#!/bin/bash

GROUP=1
if [ "$GROUP" -eq 0 ]; then
    echo "Error: please update your group number!"
    exit 1  
fi
if [ $(oc project -q) != "acmeair-group${GROUP}" ]; then 
  echo "Error: please update your current project/namespace!"
  exit 1
fi

APP_BACKEND_NAME="tfc-backend"
APP_FRONTEND_NAME="tfc-frontend"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_DOCKERFILE="${BACKEND_DIR}/Dockerfile"
FRONTEND_DOCKERFILE="${FRONTEND_DIR}/Dockerfile"
NEW_TAG=$(date +%Y%m%d%H%M%S)

echo "Detecting OpenShift project and registry..."
EXTERNAL_REGISTRY=$(oc get route default-route -n openshift-image-registry --template='{{ .spec.host }}')
PROJECT_NAME=$(oc project -q)

if [[ ${1} == "" ]]
then
  echo "Using Docker to build/push"
  BUILD_TOOL="docker"
else
  echo "Using podman to build/push"
  BUILD_TOOL="podman"
  TLS_VERIFY="--tls-verify=false"
fi

# Create an ImageStream
oc create imagestream tfc-backend
oc create imagestream tfc-frontend

echo "Trying ${BUILD_TOOL} login -u $(oc whoami) -p $(oc whoami -t) ${TLS_VERIFY}  ${EXTERNAL_REGISTRY}"
${BUILD_TOOL} login -u $(oc whoami) -p $(oc whoami -t) ${TLS_VERIFY}  ${EXTERNAL_REGISTRY}

if [[ $? -ne 0 ]]
then
  echo "Login Failed" 
  exit
fi

IMAGE_PREFIX_EXTERNAL=${EXTERNAL_REGISTRY}/${PROJECT_NAME}
IMAGE_PREFIX_INTERNAL=image-registry.openshift-image-registry.svc:5000/${PROJECT_NAME}

echo "Image Prefix External=${IMAGE_PREFIX_EXTERNAL}"
echo "Image Prefix Internal=${IMAGE_PREFIX_INTERNAL}"
echo "OpenShift Project=${PROJECT_NAME}"

# Build and push backend image
if [[ ! -f "${BACKEND_DOCKERFILE}" ]]; then
  echo "Error: ${BACKEND_DOCKERFILE} not found. Please ensure it exists."
  exit 1
fi


echo "Building backend image ${IMAGE_PREFIX_EXTERNAL}/${APP_BACKEND_NAME}:latest from ${BACKEND_DOCKERFILE} ..."
${BUILD_TOOL} build --platform linux/amd64 --pull -t ${IMAGE_PREFIX_EXTERNAL}/${APP_BACKEND_NAME}:$NEW_TAG -f ${BACKEND_DOCKERFILE} ${BACKEND_DIR}
echo "Pushing backend image ..."
PUSH_OK=false
for i in 1 2 3; do
  if ${BUILD_TOOL} push ${IMAGE_PREFIX_EXTERNAL}/${APP_BACKEND_NAME}:$NEW_TAG ${TLS_VERIFY}; then
    PUSH_OK=true; break
  else
    echo "Backend push attempt ${i} failed; retrying in 5s..."
    sleep 5
  fi
done

# Optional cluster-native build fallback if external push fails
if [[ "${PUSH_OK}" != "true" || "${USE_CLUSTER_BUILD:-false}" == "true" ]]; then
  echo "Falling back to OpenShift BuildConfig for backend (cluster-native build)."
  if ! oc get bc/${APP_BACKEND_NAME} >/dev/null 2>&1; then
    oc new-build --name ${APP_BACKEND_NAME} --binary --strategy docker -n ${PROJECT_NAME}
  fi
  oc start-build ${APP_BACKEND_NAME} --from-dir=${BACKEND_DIR} --wait --follow
fi

# setup database connection secret
echo "Injecting PostgreSQL connection settings"
oc create secret generic pg-conn \
  --from-literal=DATABASE_URL='postgresql://neondb_owner:npg_oZKg8fm7ylkU@ep-ancient-meadow-ah4lob6r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' \
  --dry-run=client -o yaml | oc apply -f -

oc set env deploy/${APP_BACKEND_NAME} --from=secret/pg-conn --overwrite

echo "Deploying/updating backend on OpenShift ..."
# Create or update Deployment, Service, and Route for backend
if oc get deploy/${APP_BACKEND_NAME} >/dev/null 2>&1; then
  oc set image deploy/${APP_BACKEND_NAME} ${APP_BACKEND_NAME}=${IMAGE_PREFIX_INTERNAL}/${APP_BACKEND_NAME}:$NEW_TAG
else
  # Create a deployment from the image
  oc create deployment ${APP_BACKEND_NAME} --image=${IMAGE_PREFIX_INTERNAL}/${APP_BACKEND_NAME}:$NEW_TAG
fi

# Ensure service exists and exposes port 8000
if ! oc get svc/${APP_BACKEND_NAME} >/dev/null 2>&1; then
  oc expose deployment/${APP_BACKEND_NAME} --port=8000
fi

# Ensure route exists
if ! oc get route/${APP_BACKEND_NAME} >/dev/null 2>&1; then
  oc expose svc/${APP_BACKEND_NAME}
fi


# Build and push frontend image
if [[ ! -f "${FRONTEND_DOCKERFILE}" ]]; then
  echo "Error: ${FRONTEND_DOCKERFILE} not found. Please ensure it exists."
  exit 1
fi

# Get backend route to pass to frontend build
BACKEND_ROUTE=$(oc get route/${APP_BACKEND_NAME} -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
if [[ -z "${BACKEND_ROUTE}" ]]; then
  echo "Warning: Backend route not found. Frontend will default to localhost:8000 for local dev."
  REACT_APP_API_BASE_URL="http://localhost:8000"
else
  REACT_APP_API_BASE_URL="https://${BACKEND_ROUTE}"
fi

echo "Building frontend image ${IMAGE_PREFIX_EXTERNAL}/${APP_FRONTEND_NAME}:latest from ${FRONTEND_DOCKERFILE} ..."
echo "Using REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}"
${BUILD_TOOL} build --platform linux/amd64 --pull --build-arg REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL} -t ${IMAGE_PREFIX_EXTERNAL}/${APP_FRONTEND_NAME}:$NEW_TAG -f ${FRONTEND_DOCKERFILE} ${FRONTEND_DIR}
echo "Pushing frontend image ..."
PUSH_OK_FE=false
for i in 1 2 3; do
  if ${BUILD_TOOL} push ${IMAGE_PREFIX_EXTERNAL}/${APP_FRONTEND_NAME}:$NEW_TAG ${TLS_VERIFY}; then
    PUSH_OK_FE=true; break
  else
    echo "Frontend push attempt ${i} failed; retrying in 5s..."
    sleep 5
  fi
done

if [[ "${PUSH_OK_FE}" != "true" || "${USE_CLUSTER_BUILD:-false}" == "true" ]]; then
  echo "Falling back to OpenShift BuildConfig for frontend (cluster-native build)."
  if ! oc get bc/${APP_FRONTEND_NAME} >/dev/null 2>&1; then
    oc new-build --name ${APP_FRONTEND_NAME} --binary --strategy docker -n ${PROJECT_NAME}
  fi
  oc start-build ${APP_FRONTEND_NAME} --from-dir=${FRONTEND_DIR} --wait --follow
fi


echo "Deploying/updating frontend on OpenShift ..."
# Create or update Deployment, Service, and Route for frontend
if oc get deploy/${APP_FRONTEND_NAME} >/dev/null 2>&1; then
  oc set image deploy/${APP_FRONTEND_NAME} ${APP_FRONTEND_NAME}=${IMAGE_PREFIX_INTERNAL}/${APP_FRONTEND_NAME}:$NEW_TAG
else
  oc create deployment ${APP_FRONTEND_NAME} --image=${IMAGE_PREFIX_INTERNAL}/${APP_FRONTEND_NAME}:$NEW_TAG
fi

# Ensure service exists and exposes port 8080
if ! oc get svc/${APP_FRONTEND_NAME} >/dev/null 2>&1; then
  oc expose deployment/${APP_FRONTEND_NAME} --port=8080
fi

# Ensure route exists
if ! oc get route/${APP_FRONTEND_NAME} >/dev/null 2>&1; then
  oc expose svc/${APP_FRONTEND_NAME}
fi

echo "Deployment triggered. Current services and routes:"
oc get deploy,svc,route -l app.kubernetes.io/managed-by!=Helm || true

cat <<EOF

EOF

# Restart backend deployment to apply migrations
#oc rollout restart deploy/tfc-backend
#oc rsh deploy/tfc-backend python manage.py migrate 