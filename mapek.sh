#!/bin/bash

pick_load() {
  case "$1" in
  low)
    THREAD=10
    ;;
  medium)
    THREAD=100
    ;;
  high)
    THREAD=200
    ;;
  *)
    echo "Syntax: $0 [low|medium|high|all] [baseline|adapt]"
    exit 1
    ;;
  esac
}

runCase() {
  local CASE="$1"
  pick_load "${CASE}"

  START_TIME=$(date +%s)
  END_TIME=$((START_TIME + DURATION + COOL_DOWN_TIME + 30))

  python3 monitor.py --start "${START_TIME}" --end "${END_TIME}" --testcase "${CASE}" --mode "${MODE}" &
  MONITOR_PID=$!

  sleep 5

  JMETER_RESULTS="./data/JmeterResults-${CASE}.jtl"
  jmeter -n -f -t jmeter/startup.jmx \
    -l "${JMETER_RESULTS}" \
    -Jsummariser.name=summary \
    -Jsummariser.interval=5 \
    -Jsummariser.out=false \
    -DusePureIDs=true \
    -JHOST="${HOST}" \
    -JPORT="${PORT}" \
    -JTHREAD="${THREAD}" \
    -JDURATION="${DURATION}" \
    -JRAMP="${RAMP}" \
    -JDELAY="${DELAY}"

  echo "Cooling Down for ${COOL_DOWN_TIME}s..."
  sleep "${COOL_DOWN_TIME}"

  # need || true otherwise if "No such process" occurs, script will stop
  if [[ -n "${EXECUTOR_PID:-}" ]]; then
    kill ${EXECUTOR_PID} || true
    unset EXECUTOR_PID
  fi

  if [[ -n "${MONITOR_PID:-}" ]]; then
    if ! wait "${MONITOR_PID}"; then
      echo "Warning: monitor process exited with non-zero status" >&2
    fi
    unset MONITOR_PID
  fi
}

# methods finished

set -euo pipefail

PRESSURE="${1-}"
MODE="${2-}"

if [[ -z "${PRESSURE}" || -z "${MODE}" ]]; then
  echo "Syntax: $0 [low|medium|high|all] [baseline|adapt]"
  exit 1
fi

COOL_DOWN_TIME=60
HOST=$(oc get route tfc-frontend -n acmeair-group1 --template='{{ .spec.host }}')
PORT=443
DURATION=60
RAMP=0
DELAY=10

oc scale deployment --all --replicas=1 -n acmeair-group1

mkdir -p ./data

if [[ "${PRESSURE}" == "all" ]]; then
  for CASE in high medium low; do
    runCase "${CASE}"
    echo "Waiting ${COOL_DOWN_TIME} seconds before next test case..."
    sleep "${COOL_DOWN_TIME}"
  done
else
  runCase "${PRESSURE}"
fi
