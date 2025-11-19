from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import studio
from group_8958.redis_client import redis_client

def clear_studio_cache():
    for key in redis_client.scan_iter("studios:degraded:*"):
        redis_client.delete(key)

@receiver(post_save, sender=studio)
@receiver(post_delete, sender=studio)
def studio_changed(sender, instance, **kwargs):
    clear_studio_cache()