from rest_framework.pagination import LimitOffsetPagination
from group_8958.feature_flags import is_degraded_mode  

class AdaptiveLimitOffsetPagination(LimitOffsetPagination):
    # normal mode default page size
    default_limit = 20
    max_limit = 100

    def get_limit(self, request):
        """
        Returns the number of items to include in the page.
        If degraded mode is on, we shrink the page size.
        """
        # Start with whatever DRF thinks the limit is
        limit = super().get_limit(request)

        # If client didn’t give ?limit=, DRF will use default_limit
        if is_degraded_mode():
            # force a smaller page size in degraded mode
            degraded_limit = 3

            # If client asks for something bigger, cap it
            if limit is None:
                return degraded_limit
            return min(limit, degraded_limit)

        # Non-degraded: just use normal limit
        return limit