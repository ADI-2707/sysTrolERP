import hashlib
import math

from django.core.cache import cache
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class StandardPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        params = getattr(request, "query_params", getattr(request, "GET", {}))
        if params and str(params.get("cached_count", "")).lower() in ("true", "1"):
            query_key = hashlib.md5(str(queryset.query).encode("utf-8")).hexdigest()
            cache_key = f"pagination_count_{query_key}"
            cached_count = cache.get(cache_key)
            if cached_count is not None:
                self.django_paginator_class = self._get_cached_paginator_class(cached_count)
            else:
                count = queryset.count()
                cache.set(cache_key, count, timeout=60)
                self.django_paginator_class = self._get_cached_paginator_class(count)
        return super().paginate_queryset(queryset, request, view)

    def _get_cached_paginator_class(self, fixed_count):
        from django.core.paginator import Paginator

        class FixedCountPaginator(Paginator):
            @property
            def count(self):
                return fixed_count

        return FixedCountPaginator

    def get_paginated_response(self, data):
        count = self.page.paginator.count
        total_pages = math.ceil(count / self.get_page_size(self.request)) if count else 0
        return Response(
            {
                "count": count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "page": self.page.number,
                "total_pages": total_pages,
                "results": data,
            }
        )


class StandardCursorPagination(CursorPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
    ordering = "-created_at"
