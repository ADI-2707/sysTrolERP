from rest_framework import exceptions
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.core.exceptions import custom_exception_handler
from apps.core.pagination import StandardPageNumberPagination


def test_custom_exception_handler_validation_error():
    factory = APIRequestFactory()
    request = factory.get("/")
    exc = exceptions.ValidationError({"email": ["Enter a valid email address."]})
    context = {"request": request, "view": None}

    response = custom_exception_handler(exc, context)
    assert response.status_code == 400
    assert response.data["code"] == "validation_error"
    assert response.data["message"] == "Validation failed."
    assert "email" in response.data["fields"]
    assert response.data["fields"]["email"] == ["Enter a valid email address."]


def test_custom_exception_handler_not_found():
    factory = APIRequestFactory()
    request = factory.get("/")
    exc = exceptions.NotFound("Item not found.")
    context = {"request": request, "view": None}

    response = custom_exception_handler(exc, context)
    assert response.status_code == 404
    assert response.data["code"] == "not_found"
    assert response.data["message"] == "Item not found."
    assert response.data["fields"] == {}


def test_custom_exception_handler_unhandled():
    factory = APIRequestFactory()
    request = factory.get("/")
    exc = RuntimeError("Database connection died")
    context = {"request": request, "view": None}

    response = custom_exception_handler(exc, context)
    assert response.status_code == 500
    assert response.data["code"] == "server_error"
    assert response.data["message"] == "An unexpected error occurred."
    assert response.data["fields"] == {}


def test_standard_pagination():
    class DummyQueryset:
        def __init__(self, items):
            self.items = items

        def __len__(self):
            return len(self.items)

        def __getitem__(self, index):
            return self.items[index]

        def count(self):
            return len(self.items)

    factory = APIRequestFactory()
    wsgi_req = factory.get("/?page=1&page_size=10")
    request = Request(wsgi_req)
    paginator = StandardPageNumberPagination()
    page_data = paginator.paginate_queryset(list(range(25)), request)
    response = paginator.get_paginated_response(page_data)

    assert response.data["count"] == 25
    assert response.data["page"] == 1
    assert response.data["total_pages"] == 3
    assert len(response.data["results"]) == 10
