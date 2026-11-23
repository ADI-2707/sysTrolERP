import math
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response

class StandardPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

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
