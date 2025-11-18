#!/usr/bin/env python

from sdcclient import SdMonitorClient
from sdcclient import IbmAuthHelper
import subprocess, time
import queue
import argparse
import csv
import os
import requests

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

metrics = [
    # jvm class
    {"id": "jmx_jvm_class_loaded", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "jmx_jvm_class_unloaded",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    # jvm heap
    {
        "id": "jmx_jvm_heap_committed",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "jmx_jvm_heap_init", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "jmx_jvm_heap_max", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "jmx_jvm_heap_used", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "jmx_jvm_heap_used_percent",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "jmx_jvm_nonHeap_committed",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "jmx_jvm_nonHeap_init", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "jmx_jvm_nonHeap_max", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "jmx_jvm_nonHeap_used", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "jmx_jvm_nonHeap_used_percent",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    # jvm gc
    {
        "id": "jmx_jvm_gc_global_count",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "jmx_jvm_gc_global_time",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    # jvm threads
    {"id": "jmx_jvm_thread_count", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "jmx_jvm_thread_daemon",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    # systems
    {"id": "container.id"},
    {"id": "cpu.used.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.cores.used", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "memory.used.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.user.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.idle.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.iowait.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.nice.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.stolen.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "cpu.system.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "fd.used.percent", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "file.error.open.count",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "file.error.total.count",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "file.bytes.in", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.iops.in", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.time.in", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.open.count", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.bytes.out", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.iops.out", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "file.time.out", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "load.average.15m", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "load.average.1m", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "load.average.5m", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "memory.bytes.available",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "memory.bytes.total", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "memory.bytes.used", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "memory.swap.bytes.available",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "memory.swap.bytes.total",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "memory.swap.bytes.used",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "memory.bytes.virtual", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {
        "id": "net.connection.count.in",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {
        "id": "net.connection.count.out",
        "aggregations": {"time": "timeAvg", "group": "avg"},
    },
    {"id": "net.error.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.bytes.in", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "net.bytes.out", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "net.tcp.queue.len", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "net.request.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.request.time", "aggregations": {"time": "avg", "group": "avg"}},
    {"id": "net.http.request.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.http.error.count", "aggregations": {"time": "sum", "group": "sum"}},
    {"id": "net.http.request.time", "aggregations": {"time": "avg", "group": "avg"}},
    {"id": "proc.count", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "system.uptime", "aggregations": {"time": "timeAvg", "group": "avg"}},
    {"id": "thread.count", "aggregations": {"time": "timeAvg", "group": "avg"}},
]


# # Function to fetch P95 latency from Django Prometheus metrics
# PROM_URL = "http://prometheus:9090/api/v1/query"
# def get_p95_latency():
#     query = """
#     histogram_quantile(
#         0.95,
#         sum(rate(view_latency_seconds_bucket[5m])) by (le)
#     )
#     """
#     r = requests.get(PROM_URL, params={"query": query})
#     data = r.json()

#     if data["status"] != "success":
#         raise Exception("Prometheus query failed")

#     # result is a list; usually one item
#     value = float(data["data"]["result"][0]["value"][1])
#     return value  # seconds


def analysis(
    service,
    transactionPerSecond,
    responseTime,
    errorRate,
    cpuCoresUsed,
    time,
    #p95_latency_seconds,
):
    ResponseTime_threshold = 1000
    TransactionPerSecond_threshold = 900
    P95_threshold = 2.0

    # normalization
    avg_response_time_based_on_1 = responseTime / ResponseTime_threshold
    avg_transactionPerSecond_based_on_1 = (
        transactionPerSecond / TransactionPerSecond_threshold
    )
    # p95_value = (
    #     p95_latency_seconds if p95_latency_seconds is not None else P95_threshold
    # )
    # p95_latency_based_on_1 = min(p95_value / P95_threshold, 1)

    w_transaction_time = 0.15
    w_response_time = 0.25
    w_accurate_rate = 0.4
    w_cpu_core_used = 0.1
    # w_p95_latency = 0.1

    utilityResult = max(
        0,
        w_response_time * (1 - min(avg_response_time_based_on_1, 1))
        + w_transaction_time * avg_transactionPerSecond_based_on_1
        + w_cpu_core_used * (1 - cpuCoresUsed)
        + w_accurate_rate * (1 - errorRate)
        # + w_p95_latency * (1 - p95_latency_based_on_1),
    )

    if cpuCoresUsed > 0.4:
        reason = "high CPU usage"
        direction = "up"
    elif cpuCoresUsed < 0.1:
        reason = "low CPU usage"
        direction = "down"
    elif responseTime > 2000:
        reason = "high response time"
        direction = "up"
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


available_pods_number = 18
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
    + ["errorRate", "averageResponseTimeMs", "transactionPerSecond"]
)
file_exists = os.path.isfile(data_consistency_path)
# cached_p95_latency = None
# last_p95_fetch = 0

while time.time() < endTime:
    # now = time.time()
    # if cached_p95_latency is None or now - last_p95_fetch >= aSlot:
    #     cached_p95_latency = get_p95_latency()
    #     last_p95_fetch = now

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
                else:
                    row["averageResponseTimeMs"] = 0
                row["transactionPerSecond"] = row["net.http.request.count"] / aSlot

                analysis(
                    service,
                    row["transactionPerSecond"],
                    row["averageResponseTimeMs"],
                    row["errorRate"],
                    row["cpu.cores.used"],
                    timestamp,
                    # cached_p95_latency,
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
