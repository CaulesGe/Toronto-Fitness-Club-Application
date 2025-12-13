#!/usr/bin/env python

from sdcclient import SdMonitorClient
from sdcclient import IbmAuthHelper
import subprocess, time
import queue
import argparse
import csv
import os
import numpy as np
from collections import defaultdict
import json
import redis

parser = argparse.ArgumentParser()
parser.add_argument("--start", type=int)
parser.add_argument("--end", type=int)
parser.add_argument("--testcase", type=str)
parser.add_argument("--mode", type=str)
args = parser.parse_args()

startTime = args.start
endTime = args.end
testcase = args.testcase
mode = args.mode

aSlot = 10
time.sleep(5)

GUID = "6638a8a0-2a5c-446b-8f6f-3a98be082e64"
APIKEY = "QeFoD_vEncyKex-n1jfN4mYABdpwmaJm9t8Ss9Zr7Ocz"
URL = "https://ca-tor.monitoring.cloud.ibm.com"
NAMESPACE = "acmeair-group1"

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL)

ibm_headers = IbmAuthHelper.get_headers(URL, APIKEY, GUID)
sdclient = SdMonitorClient(sdc_url=URL, custom_headers=ibm_headers)

microservices = ["tfc-backend", "tfc-frontend"]
message_queue = queue.Queue()
already_seen_rows = set()

# Track latency samples for P95 calculation
latency_samples = defaultdict(list)
MAX_SAMPLES_PER_SERVICE = 1000  # Keep rolling window

metrics = [
    # systems
    {"id": "cpu.used.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.cores.used", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "memory.used.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.user.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "net.error.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.request.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.request.time", "aggregations": {"time": "avg", "group": "avg"}},
    {"id": "net.http.request.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.http.error.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.http.request.time", "aggregations": {"time": "avg", "group": "avg"}},
]


def calculate_p95_latency(service):
    """Calculate P95 latency from collected samples"""
    samples = latency_samples.get(service, [])
    if not samples:
        return 0
    return np.percentile(samples, 95)


def analysis(
    service,
    transactionPerSecond,
    responseTime,
    errorRate,
    cpuCoresUsed,
    time,
    p95_latency_ms,
):
    ResponseTime_threshold = 1000
    TransactionPerSecond_threshold = 900
    P95_threshold = 2000  # 2000ms for P95 threshold

    # normalization
    avg_response_time_based_on_1 = responseTime / ResponseTime_threshold
    avg_transactionPerSecond_based_on_1 = (
        transactionPerSecond / TransactionPerSecond_threshold
    )
    p95_latency_based_on_1 = min(p95_latency_ms / P95_threshold, 1)

    w_transaction_time = 0.15
    w_response_time = 0.2
    w_accurate_rate = 0.35
    w_cpu_core_used = 0.1
    w_p95_latency = 0.2

    utilityResult = max(
        0,
        w_response_time * (1 - min(avg_response_time_based_on_1, 1))
        + w_transaction_time * avg_transactionPerSecond_based_on_1
        + w_cpu_core_used * (1 - cpuCoresUsed)
        + w_accurate_rate * (1 - errorRate)
        + w_p95_latency * (1 - p95_latency_based_on_1),
    )

    if cpuCoresUsed > 0.4:
        reason = "high CPU usage"
        direction = "up"
    elif p95_latency_ms > P95_threshold:
        reason = "high P95 latency"
        direction = "up"
    elif responseTime > 2000:
        reason = "high response time"
        direction = "up"    
    elif cpuCoresUsed < 0.1:
        reason = "low CPU usage"
        direction = "down"
    else:
        reason = None
    print(f"mode={mode}, reason={reason}")
    if reason and mode == "adapt":
        scaleHander(service, reason, direction)

    if utilityResult < 0.6:
        msg = {
            "service_name": service,
            "adaptionTime": time,
            "avg_response_time": responseTime,
            "avg_transactionTimePerSecond": transactionPerSecond,
            "avg_error_rate": errorRate,
            "cpu_cores_used": cpuCoresUsed,
            "utilityResult": utilityResult,
        }
        print(f"{msg}")
        message_queue.put(msg)
        if mode == "adapt":
            scaleHander(service, "utility score below 0.6", "up")


def _oc(*args):
    return subprocess.run(["oc", *args], capture_output=True, text=True, check=False)


def get_current_pods_number(deploy):
    r = _oc("get", "deploy", deploy, "-n", NAMESPACE, "-o", "jsonpath={.spec.replicas}")
    try:
        return int(r.stdout.strip() or "0")
    except:
        return 0


available_pods_number = 5
lastAdaption = {}
coolDown = 30


def scaleHander(service, reason, direction):
    global available_pods_number
    print("available_pods_number:", available_pods_number)
    now = time.time()
    last = lastAdaption.get(service, 0)

    if not service:
        return

    dir_lower = direction.lower()   # normalize once
    cur = get_current_pods_number(service)

    # Safeguards
    if cur is None:
        print(f"[Scaler][ERROR] Could not get current replicas for {service}")
        return

    if dir_lower == "up":
        # Cooldown for scaling up
        if now - last < coolDown:
            print(f"{service} already scaled up recently; cooling down.")
            return

        # No free pods left in global pool → enable degraded mode and stop
        if available_pods_number < 1:
            print("No available pod in pool, enabling degraded mode.")
            set_degraded_mode(enabled=True,
                              reason="no available pod, degraded performance")
            return

        target = cur + 1
        out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)

        if out.returncode == 0:
            available_pods_number -= 1   # only change pool on success
            print(f"[Scaler] {service}: {cur} → {target} replicas ({reason})")
            lastAdaption[service] = now
        else:
            print(f"[Scaler][ERROR] {service}: {out.stderr or out.stdout}")
        
        return

    elif dir_lower == "down":
        # Longer cooldown for scaling down
        if now - last < (coolDown * 3):
            print(f"{service} already scaled down recently; cooling down.")
            return

        if cur <= 1:
            print(f"{service} has only 1 replica; will not scale down.")
            return

        # Were we previously at max capacity (0 free pods)?
        was_saturated = (available_pods_number == 0)

        target = cur - 1
        out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)

        if out.returncode == 0:
            available_pods_number += 1   # we freed one pod in the global pool
            print(f"[Scaler] {service}: {cur} → {target} replicas ({reason})")
            lastAdaption[service] = now

            # If we had no free pods before and now we do,
            # it is safe to go back to standard mode.
            if was_saturated and available_pods_number > 0:
                print("back to standard mode")
                set_degraded_mode(enabled=False,
                                  reason="back to standard mode")
        else:
            print(f"[Scaler][ERROR] {service}: {out.stderr or out.stdout}")
        return

    else:
        print(f"[Scaler][WARN] Unknown direction '{direction}' for {service}")
        return


def set_degraded_mode(enabled, reason):
    value = "true" if enabled else "false"
    r.set("flags:degraded_mode", value)
    if reason:
        r.set("flags:degrade_reason", reason)
    # notify all backends
    r.publish("channels:flags", json.dumps({"flag": "degraded_mode", "value": value, "reason": reason}))
    print(f"[monitor] degraded_mode set to {value} ({reason})")


data_consistency_path = f"data/monitorResult-{testcase}-{mode}.csv"
fieldnames = (
    ["timestamp", "service"]
    + [m.get("alias") or m["id"] for m in metrics]
    + ["errorRate", "averageResponseTimeMs", "transactionPerSecond", "p95LatencyMs"]
)
file_exists = os.path.isfile(data_consistency_path)

# clear redis db at start
set_degraded_mode(enabled=False, reason="starting monitor script")
r.flushdb()
print("[redis] DB cleared")
while time.time() < endTime:
    for service in microservices:
        filter = f'kubernetes.namespace.name="acmeair-group1" and kubernetes.deployment.name="{service}"'
        ok, res = sdclient.get_data(metrics, -aSlot, 0, aSlot, filter=filter)

        if ok:
            data = res["data"]

            for d in data:
                timestamp = d["t"] if aSlot > 0 else startTime
                values = d["d"]
                row = {"timestamp": timestamp, "service": service}

                # avoid duplicate metrics row
                current_row_identifier = (row["timestamp"], row["service"])
                if current_row_identifier in already_seen_rows:
                    continue
                already_seen_rows.add(current_row_identifier)

                for i, metric in enumerate(metrics):
                    key = metric.get("alias") or metric["id"]
                    row[key] = values[i]
                if row["net.http.request.count"]:
                    row["errorRate"] = (
                        row["net.http.error.count"] / row["net.http.request.count"]
                    )
                else:
                    row["errorRate"] = 0

                if row["net.http.request.count"]:
                    avg_ms = row["net.http.request.time"] / 1e6
                    row["averageResponseTimeMs"] = avg_ms
                    # Track latency sample for P95 calculation
                    latency_samples[service].append(avg_ms)
                    if len(latency_samples[service]) > MAX_SAMPLES_PER_SERVICE:
                        latency_samples[service].pop(0)
                else:
                    row["averageResponseTimeMs"] = 0
                row["transactionPerSecond"] = row["net.http.request.count"] / aSlot
                
                row["p95LatencyMs"] = calculate_p95_latency(service)

                analysis(
                    service,
                    row["transactionPerSecond"],
                    row["averageResponseTimeMs"],
                    row["errorRate"],
                    row["cpu.cores.used"],
                    timestamp,
                    row["p95LatencyMs"],
                )

                with open(data_consistency_path, "a", newline="") as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                    if not file_exists:
                        writer.writeheader()
                        file_exists = True
                    writer.writerow(row)

        else:
            print(f"{service}: data not found but res = {res}")
            time.sleep(aSlot // 5)
            continue
