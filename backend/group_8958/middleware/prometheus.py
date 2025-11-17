# myapp/middleware/prometheus.py
import time
from prometheus_client import Histogram, Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse

REQUEST_LATENCY = Histogram('view_latency_seconds', 'Request latency', ['path', 'method'])
REQUEST_COUNT = Counter('request_count_total', 'Request count', ['path','method','status'])
ERROR_COUNT = Counter('error_count_total', 'Error count', ['path','method','status'])

class PrometheusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        try:
            response = self.get_response(request)
        except Exception as e:
            duration = time.time() - start
            path = request.path.split('?')[0]
            REQUEST_LATENCY.labels(path=path, method=request.method).observe(duration)
            ERROR_COUNT.labels(path=path, method=request.method, status='500').inc()
            raise
        duration = time.time() - start
        path = request.path.split('?')[0]
        REQUEST_LATENCY.labels(path=path, method=request.method).observe(duration)
        REQUEST_COUNT.labels(path=path, method=request.method, status=str(response.status_code)).inc()
        return response

# metrics endpoint view
def metrics_view(request):
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
