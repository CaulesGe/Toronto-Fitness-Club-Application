#!/usr/bin/env python

from sdcclient import SdMonitorClient
from sdcclient import IbmAuthHelper
import subprocess, time
import queue
import argparse
import csv
import os
import requests
import numpy as np
from collections import defaultdict

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
    # For P95 calculation - get percentile directly from Sysdig
    {"id": "net.http.request.time", "aggregations": {"time": "timeAvg", "group": "p95"}}
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


available_pods_number = 16
lastAdaption = {}
coolDown = 30


def scaleHander(service, reason, mode):
    global available_pods_number
    now = time.time()
    last = lastAdaption.get(service, 0)
    if not service:
        return
    cur = get_current_pods_number(service)
    if mode == "up" or mode == "UP":
        if available_pods_number < 1:
            print("no available pod")
            return
        elif now - last < coolDown:
            print(
                f" {service} already scale {mode} so we need to wait for a moment to cool down."
            )
            return
        target = cur + 1
        out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)
        available_pods_number = available_pods_number - 1

    elif mode == "down" or mode == "DOWN":
        if cur <= 1:
            print(f"{service} only has 1 pod so cannot scale down.")
            return
        elif now - last < (coolDown * 3):
            print(
                f" {service} already scale {mode} so we need to wait for a moment to cool down."
            )
            return
        target = cur - 1
        out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)
        available_pods_number = available_pods_number + 1

    if out.returncode == 0:
        print(f"[Scaler] {service}: {cur} → {target} replicas ({reason})")
        lastAdaption[service] = now
    else:
        print(f"[Scaler][ERROR] {service}: {out.stderr or out.stdout}")


data_consistency_path = f"data/monitorResult-{testcase}-{mode}.csv"
fieldnames = (
    ["timestamp", "service"]
    + [m.get("alias") or m["id"] for m in metrics]
    + ["errorRate", "averageResponseTimeMs", "transactionPerSecond", "p95LatencyMs"]
)
file_exists = os.path.isfile(data_consistency_path)

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
                
                # Get P95 from Sysdig directly (last metric in list) or calculate from samples
                p95_from_sysdig = values[-1] / 1e6 if values[-1] else 0  # Convert to ms
                p95_from_samples = calculate_p95_latency(service)
                row["p95LatencyMs"] = p95_from_sysdig if p95_from_sysdig > 0 else p95_from_samples

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
