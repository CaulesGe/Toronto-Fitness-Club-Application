# Toronto Fitness Club - OpenShift Deployment Guide

## Summary of Changes

### Fixed Issues
1. **Nginx Permission Errors** - Switched to `nginxinc/nginx-unprivileged:1.27` and configured to run on port 8080
2. **Hardcoded API URLs** - Replaced all `http://localhost:8000` and `http://127.0.0.1:8000` with configurable `API_BASE_URL`
3. **Registry Push Failures** - Added retry logic, better authentication, and cluster-native BuildConfig fallback

### Files Modified

#### Frontend
- **frontend/src/config.js** - NEW: Central API configuration using `REACT_APP_API_BASE_URL`
- **frontend/Dockerfile** - Updated to accept `REACT_APP_API_BASE_URL` build arg, use unprivileged nginx on port 8080
- **frontend/default.config** - Changed listen port from 8000 to 8080
- **All Component Files** - Replaced hardcoded URLs with `API_BASE_URL` import:
  - App.js
  - components/Account/Login.js
  - components/Account/Register.js
  - components/Account/Profile.js
  - components/Payment/History.js
  - components/Subscription/Add.js
  - components/Subscription/Edit.js
  - components/Studios/Album.js
  - components/Studios/Details.js
  - components/Classes/UserClassSchedule/index.js
  - components/Classes/UserClassHistory/index.js
  - components/Classes/StudioSchedule/index.js
  - components/Classes/Enroll/EnrollEvent.js
  - components/Classes/Enroll/EnrollClass.js
  - components/Classes/Drop/DropEvent.js
  - components/Classes/Drop/DropClass.js

#### Backend
- **backend/Dockerfile** - NEW: Django app with gunicorn on port 8000

#### Deployment Scripts
- **buildAndDeployToOpenshift.sh** - Comprehensive updates:
  - Better registry detection (`oc registry info`)
  - Login with 'openshift' user + token
  - Push retries (3 attempts)
  - Cluster-native BuildConfig fallback
  - Internal registry image references for deployments
  - Automatic backend route detection and injection into frontend build
  - Service port corrected to 8080 for frontend
  
- **buildAndDeployToOpenshiftNew.sh** - Same updates as above

## How It Works

### Local Development
- React app defaults to `http://localhost:8000` when `REACT_APP_API_BASE_URL` is not set
- Run backend: `cd backend && python manage.py runserver`
- Run frontend: `cd frontend && npm start`

### OpenShift Deployment
1. **Backend deploys first** and creates a route (e.g., `https://tfc-backend-yourproject.apps.cluster.com`)
2. **Frontend build** detects the backend route and bakes it into the React bundle via build arg
3. **Frontend nginx** serves the static files on port 8080 (unprivileged)
4. Users access frontend → frontend calls backend via the OpenShift route

### Port Configuration
- **Backend**: Port 8000 (Django/gunicorn)
- **Frontend**: Port 8080 (nginx unprivileged)
- **OpenShift Services**: Expose these ports correctly
- **OpenShift Routes**: HTTP/HTTPS ingress for both

## Running the Deployment

### Prerequisites
- oc CLI logged in: `oc login ...`
- Project selected: `oc project <your-namespace>`
- Docker or Podman installed

### Option 1: Standard Deploy (with retries)
```bash
./buildAndDeployToOpenshift.sh
```

### Option 2: Force Cluster Build (no external registry push)
```bash
USE_CLUSTER_BUILD=true ./buildAndDeployToOpenshift.sh
```

### Option 3: Use Podman
```bash
./buildAndDeployToOpenshift.sh podman
```

## Post-Deployment Steps

### 1. Fix Existing Service Ports (if services already exist)
```bash
# Delete and recreate frontend service with correct port
oc delete svc/tfc-frontend
oc expose deployment/tfc-frontend --port=8080

# Verify backend service
oc get svc/tfc-backend -o yaml | grep -A2 ports
# Should show port: 8000
```

### 2. Configure Django Settings
```bash
# Get route hostnames
BACKEND_HOST=$(oc get route tfc-backend -o jsonpath='{.spec.host}')
FRONTEND_HOST=$(oc get route tfc-frontend -o jsonpath='{.spec.host}')

# Set Django environment variables
oc set env deploy/tfc-backend \
  SECRET_KEY=your-secret-key-here \
  ALLOWED_HOSTS="${BACKEND_HOST},${FRONTEND_HOST}" \
  DEBUG=False \
  DATABASE_URL=sqlite:////tmp/db.sqlite3
```

### 3. Watch Pods Start
```bash
oc get pods -w
```

### 4. Access Your App
```bash
# Get frontend URL
oc get route tfc-frontend -o jsonpath='https://{.spec.host}{"\n"}'

# Get backend URL
oc get route tfc-backend -o jsonpath='https://{.spec.host}{"\n"}'
```

### 5. Check Logs
```bash
# Frontend logs
oc logs deploy/tfc-frontend -f

# Backend logs
oc logs deploy/tfc-backend -f
```

## Troubleshooting

### Frontend: "Failed to fetch" errors
- Check CORS settings in Django backend
- Verify backend route is accessible: `curl https://your-backend-route/studios/all/?longitude=0&latitude=0`
- Check frontend logs for the API_BASE_URL: `oc logs deploy/tfc-frontend | grep API_BASE_URL`

### Backend: 400 Bad Request
- Add route host to ALLOWED_HOSTS: `oc set env deploy/tfc-backend ALLOWED_HOSTS='*'` (temp fix)
- Or set specific hosts as shown in step 2 above

### Image Push Fails (500 errors)
- Use cluster build: `USE_CLUSTER_BUILD=true ./buildAndDeployToOpenshift.sh`
- This builds images inside OpenShift, bypassing external registry issues

### Permission Denied (nginx)
- Already fixed: using `nginxinc/nginx-unprivileged:1.27`
- Verify frontend port: `oc get svc/tfc-frontend -o yaml | grep -A2 ports` (should be 8080)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ OpenShift Cluster                                           │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │ tfc-frontend         │      │ tfc-backend          │   │
│  │ (nginx:8080)         │─────▶│ (django:8000)        │   │
│  │ React SPA            │ API  │ REST API             │   │
│  └──────────────────────┘      └──────────────────────┘   │
│           │                              │                 │
│           │ Route                        │ Route           │
│           ▼                              ▼                 │
│  https://tfc-frontend...      https://tfc-backend...       │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
    User's Browser
```

## Next Steps

1. **Add Database**: Deploy PostgreSQL and configure `DATABASE_URL`
2. **Run Migrations**: `oc exec deploy/tfc-backend -- python manage.py migrate`
3. **Load Data**: `oc exec deploy/tfc-backend -- python manage.py loaddata fixtures.json`
4. **Set Up CI/CD**: Configure GitHub Actions for automatic deploys
5. **Add Health Checks**: Configure liveness and readiness probes

## Questions?

- Check OpenShift console: Project → Workloads → Deployments
- Review events: `oc get events --sort-by='.lastTimestamp'`
- Describe resources: `oc describe deploy/tfc-frontend` or `oc describe deploy/tfc-backend`
