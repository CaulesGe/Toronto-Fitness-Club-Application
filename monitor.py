#!/usr/bin/env python
#
# This script shows the basics of getting data out of Sysdig Monitor by
# creating a very simple request that has no filter and no segmentation.
#
# The request queries for the average CPU across all of the instrumented hosts
# for the last 10 minutes, with 1 minute data granularity
#
# NOTE: This code is only meant to be a simple example. Please do not use
# without adding additional logic for the assignments.

import sys
from sdcclient import SdMonitorClient
from sdcclient import IbmAuthHelper
import subprocess, time
import queue
import argparse
import csv
import os

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

print("monitor start.")

aSlot = 10

time.sleep(5)
# config values based on instructions from:
# https://cloud.ibm.com/apidocs/monitor#authentication-when-using-python
GUID = "6638a8a0-2a5c-446b-8f6f-3a98be082e64"
APIKEY = "5nqMNyuHpPPMim2ucRTwzEb6gqbZVLkarO-tHe47Wg-p"
URL = "https://ca-tor.monitoring.cloud.ibm.com"
NAMESPACE = "acmeair-group1"

ibm_headers = IbmAuthHelper.get_headers(URL, APIKEY, GUID)
sdclient = SdMonitorClient(sdc_url=URL, custom_headers=ibm_headers)

#
# List of metrics to export. Imagine a SQL data table, with key columns
# and value columns.
# You just need to specify the ID for keys, and ID with aggregation for values.
#
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

print("monitor finished.")


# #
# # Data filter or None if you want to see "everything"
# #
# microservices = [
#     "acmeair-authservice",
#     "acmeair-booking-db",
#     "acmeair-bookingservice",
#     "acmeair-customer-db",
#     "acmeair-customerservice",
#     "acmeair-flight-db",
#     "acmeair-flightservice",
#     "acmeair-mainservice",
# ]

# message_queue = queue.Queue()
# already_seen_rows = set()


# def analysis(
#     service, transactionPerSecond, responseTime, errorRate, cpuCoresUsed, time
# ):
#     ResponseTime_threshold = 1000
#     TransactionPerSecond_threshold = 900

#     # normalization
#     avg_response_time_based_on_1 = responseTime / ResponseTime_threshold
#     avg_transactionPerSecond_based_on_1 = (
#         transactionPerSecond / TransactionPerSecond_threshold
#     )

#     w_transaction_time = 0.15
#     w_response_time = 0.25
#     w_accurate_rate = 0.5
#     w_cpu_core_used = 0.1

#     # goal: decrease responseTime, increase transaction rate, reduce error rate
#     utilityResult = max(
#         0,
#         w_response_time * (1 - min(avg_response_time_based_on_1, 1))
#         + w_transaction_time * avg_transactionPerSecond_based_on_1
#         + w_cpu_core_used * (1 - cpuCoresUsed)
#         + w_accurate_rate * (1 - errorRate),
#     )

#     if cpuCoresUsed > 0.4:
#         reason = "high CPU usage"
#         direction = "up"
#     elif cpuCoresUsed < 0.1:
#         reason = "low CPU usage"
#         direction = "down"
#     elif responseTime > 2000:
#         reason = "high response time"
#         direction = "up"
#     else:
#         reason = None

#     if reason and mode == "adapt":
#         scaleHander(service, reason, direction)

#     if utilityResult < 0.6:
#         msg = {
#             "service_name": service,
#             "adaptionTime": time,
#             "avg_response_time": responseTime,
#             "avg_transactionTimePerSecond": transactionPerSecond,
#             "avg_error_rate": errorRate,
#             "cpu_cores_used": cpuCoresUsed,
#             "utilityResult": utilityResult,
#         }
#         # print(f"{msg}")
#         message_queue.put(msg)
#         if mode == "adapt":
#             scaleHander(service, "utility score below 0.6", "up")


# def _oc(*args):
#     return subprocess.run(["oc", *args], capture_output=True, text=True, check=False)


# def get_current_pods_number(deploy):
#     r = _oc("get", "deploy", deploy, "-n", NAMESPACE, "-o", "jsonpath={.spec.replicas}")
#     try:
#         return int(r.stdout.strip() or "0")
#     except:
#         return 0


# available_pods_number = 18
# lastAdaption = {}
# coolDown = 30


# def scaleHander(service, reason, mode):
#     global available_pods_number
#     now = time.time()
#     last = lastAdaption.get(service, 0)
#     if not service:
#         return
#     cur = get_current_pods_number(service)
#     if mode == "up" or mode == "UP":
#         if available_pods_number < 1:
#             print("no available pod")
#             return
#         elif now - last < coolDown:
#             print(f" {service} {mode}: cool down")
#             return
#         target = cur + 1
#         out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)
#         available_pods_number = available_pods_number - 1

#     elif mode == "down" or mode == "DOWN":
#         if cur <= 1:
#             print(f"{service} only has 1 pod")
#             return
#         elif now - last < (coolDown * 3):
#             print(f" {service} {mode}: cool down")
#             return
#         target = cur - 1
#         out = _oc("scale", f"deploy/{service}", f"--replicas={target}", "-n", NAMESPACE)
#         available_pods_number = available_pods_number + 1

#     if out.returncode == 0:
#         print(f"[Scaler] {service}: {cur} → {target} replicas ({reason})")
#         lastAdaption[service] = now
#     else:
#         print(f"[Scaler][ERROR] {service}: {out.stderr or out.stdout}")


# data_consistency_path = f"data/monitorResult-{testcase}-{mode}.csv"
# fieldnames = (
#     ["timestamp", "service"]
#     + [m.get("alias") or m["id"] for m in metrics]
#     + ["errorRate", "averageResponseTimeMs", "transactionPerSecond"]
# )
# file_exists = os.path.isfile(data_consistency_path)


# while time.time() < endTime:

#     for service in microservices:

#         filter = f'kubernetes.namespace.name="acmeair-group1" and kubernetes.deployment.name="{service}"'
#         ok, res = sdclient.get_data(metrics, -aSlot, 0, aSlot, filter=filter)

#         if ok:
#             data = res["data"]

#             for d in data:
#                 timestamp = d["t"] if aSlot > 0 else startTime
#                 values = d["d"]

#                 row = {"timestamp": timestamp, "service": service}

#                 # avoid duplicate metrics row
#                 current_row_identifier = (row["timestamp"], row["service"])
#                 if current_row_identifier in already_seen_rows:
#                     continue
#                 already_seen_rows.add(current_row_identifier)

#                 for i, metric in enumerate(metrics):
#                     key = metric.get("alias") or metric["id"]
#                     row[key] = values[i]
#                 total_requests = row["net.error.count"] + row["net.request.count"]
#                 if total_requests:
#                     row["errorRate"] = row["net.error.count"] / total_requests
#                 else:
#                     row["errorRate"] = 0

#                 if row["net.http.request.count"]:
#                     avg_ms = row["net.http.request.time"] / 1e6
#                     row["averageResponseTimeMs"] = avg_ms
#                 else:
#                     row["averageResponseTimeMs"] = 0
#                 row["transactionPerSecond"] = row["net.http.request.count"] / aSlot

#                 analysis(
#                     service,
#                     row["transactionPerSecond"],
#                     row["averageResponseTimeMs"],
#                     row["errorRate"],
#                     row["cpu.cores.used"],
#                     timestamp,
#                 )

#                 with open(data_consistency_path, "a", newline="") as csvfile:
#                     writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
#                     if not file_exists:
#                         writer.writeheader()
#                         file_exists = True
#                     writer.writerow(row)

#         else:
#             print(f"{service}: data not found but res = {res}")
#             time.sleep(aSlot // 5)
#             continue
#     # next_timestamp = next_timestamp + aSlot
