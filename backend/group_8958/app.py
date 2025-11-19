# group_8958/apps.py
from django.apps import AppConfig
import threading
import os
import json
import redis

from .feature_flags import invalidate_degraded_flag_cache  # our own helper

class Group8958Config(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "group_8958"

    def ready(self):
        # Start background listener thread for Redis pub/sub
        thread = threading.Thread(target=self._start_flag_listener, daemon=True)
        thread.start()

    def _start_flag_listener(self):
        REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
        r = redis.from_url(REDIS_URL)
        pubsub = r.pubsub()
        pubsub.subscribe("channels:flags")

        for msg in pubsub.listen():
            if msg["type"] != "message":
                continue
            try:
                payload = json.loads(msg["data"])
                if payload.get("flag") == "degraded_mode":
                    # Clear the in-process cache for degraded flag
                    invalidate_degraded_flag_cache()
                    print(f"[django] degraded_mode cache invalidated -> {payload.get('value')}")
            except Exception as e:
                print("[django] flag listener error:", e)
