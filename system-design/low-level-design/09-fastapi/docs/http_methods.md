# HTTP Methods & Status Codes

> Quick reference for FastAPI development

---

## HTTP Methods

| Method | Purpose | Has Body? | Idempotent? | FastAPI Decorator |
|--------|---------|-----------|-------------|-------------------|
| **GET** | Read/fetch a resource | No | Yes | `@app.get()` |
| **POST** | Create a new resource | Yes | No | `@app.post()` |
| **PUT** | Replace a resource entirely | Yes | Yes | `@app.put()` |
| **PATCH** | Partially update a resource | Yes | Yes | `@app.patch()` |
| **DELETE** | Remove a resource | Optional | Yes | `@app.delete()` |
| **OPTIONS** | Check which methods a route supports | No | Yes | `@app.options()` |
| **HEAD** | Same as GET but returns only headers, no body | No | Yes | `@app.head()` |

### Key Differences

- **PUT vs PATCH** — PUT replaces the entire resource, PATCH updates only the fields you send
- **POST vs PUT** — POST creates new (server assigns ID), PUT creates or replaces at a specific ID
- **Idempotent** — Calling it multiple times gives the same result as calling it once

---

## HTTP Status Codes

### 1xx — Informational

| Code | Name | Meaning |
|------|------|---------|
| 100 | Continue | Server received headers, client should send body |
| 101 | Switching Protocols | Server is switching to a different protocol (e.g., WebSocket) |

### 2xx — Success

| Code | Name | Meaning | Common Use |
|------|------|---------|------------|
| **200** | OK | Request succeeded | GET, PUT, PATCH responses |
| **201** | Created | Resource successfully created | POST responses |
| **204** | No Content | Success but nothing to return | DELETE responses |

### 3xx — Redirection

| Code | Name | Meaning |
|------|------|---------|
| 301 | Moved Permanently | Resource has a new permanent URL |
| 302 | Found | Resource temporarily at a different URL |
| 304 | Not Modified | Cached version is still valid, no need to resend |
| 307 | Temporary Redirect | Same as 302 but keeps the original HTTP method |
| 308 | Permanent Redirect | Same as 301 but keeps the original HTTP method |

### 4xx — Client Errors

| Code | Name | Meaning | Common Use |
|------|------|---------|------------|
| **400** | Bad Request | Malformed or invalid request | Invalid JSON, bad query params |
| **401** | Unauthorized | Not authenticated | Missing or expired token |
| **403** | Forbidden | Authenticated but not allowed | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist | Wrong URL or deleted resource |
| **405** | Method Not Allowed | HTTP method not supported on this route | POST on a GET-only endpoint |
| **409** | Conflict | Request conflicts with current state | Duplicate entry, version conflict |
| **422** | Unprocessable Entity | Request body failed validation | FastAPI's default for validation errors |
| **429** | Too Many Requests | Rate limit exceeded | Too many API calls |

### 5xx — Server Errors

| Code | Name | Meaning |
|------|------|---------|
| **500** | Internal Server Error | Something broke on the server |
| **502** | Bad Gateway | Server got an invalid response from upstream |
| **503** | Service Unavailable | Server is down or overloaded |
| **504** | Gateway Timeout | Upstream server didn't respond in time |

---

## Using Status Codes in FastAPI

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()

# Set status code on the route
@app.post("/items/", status_code=status.HTTP_201_CREATED)
def create_item(name: str):
    return {"name": name}

# Raise an HTTP error
@app.get("/items/{item_id}")
def read_item(item_id: int):
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    return items[item_id]
```

> FastAPI provides `status.HTTP_200_OK`, `status.HTTP_201_CREATED`, etc. as constants so you don't have to remember the numbers.
