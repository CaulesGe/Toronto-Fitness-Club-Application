import os
import redis
import time

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL)

FLAG_CACHE_KEY = "flags:degraded_mode_local"
FLAG_REDIS_KEY = "flags:degraded_mode"

_local_cache = {}

def is_degraded_mode():
    # 1) Try fast local memory cache first
    entry = _local_cache.get(FLAG_CACHE_KEY)
    if entry:
        value, expires = entry
        if time.time() < expires:
            return value
        else:
            del _local_cache[FLAG_CACHE_KEY]  # expired

    # 2) Fetch from Redis (shared across pods)
    raw = r.get(FLAG_REDIS_KEY)
    if raw is None:
        val = False
    else:
        val = raw.decode("utf-8").lower() == "true"

    # 3) Save to local memory cache with 60-second TTL
    _local_cache[FLAG_CACHE_KEY] = (val, time.time() + 60)

    return val

def invalidate_degraded_flag_cache():
    if FLAG_CACHE_KEY in _local_cache:
        del _local_cache[FLAG_CACHE_KEY]