# FastAPI - Learning Topics

> **Reference:** [https://fastapi.tiangolo.com/learn/](https://fastapi.tiangolo.com/learn/)

---

## Installation

```bash
# Installs FastAPI core only (minimal dependencies, you manage the server yourself)
pip install fastapi

# Installs FastAPI with all optional dependencies (uvicorn, jinja2, python-multipart, etc.)
 pip install "fastapi[all]"
```

---

## Running the App

```bash
# Using FastAPI CLI (recommended for development, auto-reloads on code changes)
fastapi dev main.py

# Using FastAPI CLI for production
fastapi run main.py

# Using Uvicorn directly (ASGI server)
uvicorn main:app --reload

# Using Uvicorn with custom host and port
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Using Uvicorn for production with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 1. Introductory Topics

- [ ] Python Types Intro
- [ ] Concurrency and async / await
- [ ] Environment Variables
- [ ] Virtual Environments

---

## 2. Tutorial - User Guide

- [ ] **First Steps** — Create a minimal FastAPI app with your first route and run it
- [ ] **Path Parameters** — Capture dynamic values from the URL path like `/items/{item_id}`
- [ ] **Query Parameters** — Read optional key-value pairs from the URL after `?` like `?skip=0&limit=10`
- [ ] **Request Body** — Receive JSON data from clients using Pydantic models
- [ ] **Query Parameters and String Validations** — Add constraints like `min_length`, `max_length`, and regex to query params
- [ ] **Path Parameters and Numeric Validations** — Add constraints like `ge`, `le`, `gt`, `lt` to numeric path params
- [ ] **Query Parameter Models** — Group multiple query parameters into a single Pydantic model
- [ ] **Body - Multiple Parameters** — Accept multiple body params, query params, and path params in one endpoint
- [ ] **Body - Fields** — Add validation and metadata to individual fields inside a Pydantic model
- [ ] **Body - Nested Models** — Define deeply nested JSON structures using Pydantic sub-models and lists
- [ ] **Declare Request Example Data** — Provide example values for your API docs using `schema_extra` or `Field(example=...)`
- [ ] **Extra Data Types** — Use types like UUID, datetime, Decimal, and bytes in your request/response models
- [ ] **Cookie Parameters** — Read values from cookies sent by the client
- [ ] **Header Parameters** — Read values from HTTP request headers
- [ ] **Cookie Parameter Models** — Group multiple cookie parameters into a single Pydantic model
- [ ] **Header Parameter Models** — Group multiple header parameters into a single Pydantic model
- [ ] **Response Model - Return Type** — Control and filter the shape of JSON responses using `response_model`
- [ ] **Extra Models** — Reuse and compose multiple Pydantic models for input, output, and DB layers
- [ ] **Response Status Code** — Set HTTP status codes like 201, 204 for your endpoints
- [ ] **Form Data** — Receive data from HTML form submissions instead of JSON
- [ ] **Form Models** — Group multiple form fields into a single Pydantic model
- [ ] **Request Files** — Handle file uploads using `UploadFile` and `File`
- [ ] **Request Forms and Files** — Accept both form fields and file uploads in the same request
- [ ] **Handling Errors** — Return proper HTTP error responses using `HTTPException` and custom handlers
- [ ] **Path Operation Configuration** — Set tags, summary, description, and deprecation for your endpoints
- [ ] **JSON Compatible Encoder** — Convert Pydantic models and other types to JSON-serializable dicts using `jsonable_encoder`
- [ ] **Body - Updates** — Handle partial updates with `PATCH` using Pydantic's `.model_dump(exclude_unset=True)`

### Dependencies

- [ ] **Classes as Dependencies** — Use classes with `__init__` as injectable dependencies for shared logic
- [ ] **Sub-dependencies** — Chain dependencies that depend on other dependencies for layered logic
- [ ] **Dependencies in path operation decorators** — Run dependencies without injecting their return value (e.g., auth checks)
- [ ] **Global Dependencies** — Apply dependencies to every route in the entire application
- [ ] **Dependencies with yield** — Use `yield` for setup/teardown logic like DB sessions and resource cleanup

### Security

- [ ] **Security - First Steps** — Understand the basics of OAuth2 and token-based authentication in FastAPI
- [ ] **Get Current User** — Create a dependency that extracts and returns the authenticated user
- [ ] **Simple OAuth2 with Password and Bearer** — Implement login with username/password returning a bearer token
- [ ] **OAuth2 with Password (and hashing), Bearer with JWT tokens** — Full auth flow with password hashing and signed JWT tokens

### Continued

- [ ] **Middleware** — Run custom code before/after every request for logging, timing, or headers
- [ ] **CORS (Cross-Origin Resource Sharing)** — Allow your API to be called from frontend apps on different domains
- [ ] **SQL (Relational) Databases** — Connect to SQL databases using SQLAlchemy ORM with FastAPI
- [ ] **Bigger Applications - Multiple Files** — Structure large apps using `APIRouter` across multiple modules
- [ ] **Background Tasks** — Run tasks after returning a response, like sending emails or processing data
- [ ] **Metadata and Docs URLs** — Customize API title, description, version, and docs endpoint paths
- [ ] **Static Files** — Serve static assets like CSS, JS, and images from a directory
- [ ] **Testing** — Write tests for your API endpoints using `TestClient` and pytest
- [ ] **Debugging** — Run FastAPI in debug mode with your IDE for breakpoints and step-through

---

## 3. Advanced User Guide

- [ ] Path Operation Advanced Configuration
- [ ] Additional Status Codes
- [ ] Return a Response Directly
- [ ] Custom Response - HTML, Stream, File, others
- [ ] Additional Responses in OpenAPI
- [ ] Response Cookies
- [ ] Response Headers
- [ ] Response - Change Status Code
- [ ] Advanced Dependencies

### Advanced Security

- [ ] OAuth2 scopes
- [ ] HTTP Basic Auth

### Continued

- [ ] Using the Request Directly
- [ ] Using Dataclasses
- [ ] Advanced Middleware
- [ ] Sub Applications - Mounts
- [ ] Behind a Proxy
- [ ] Templates
- [ ] WebSockets
- [ ] Lifespan Events
- [ ] Testing WebSockets
- [ ] Testing Events: lifespan and startup - shutdown
- [ ] Testing Dependencies with Overrides
- [ ] Async Tests
- [ ] Settings and Environment Variables
- [ ] OpenAPI Callbacks
- [ ] OpenAPI Webhooks
- [ ] Including WSGI - Flask, Django, others
- [ ] Generating SDKs
- [ ] Advanced Python Types

---

## 4. FastAPI CLI

- [ ] FastAPI CLI

---

## 5. Deployment

- [ ] About FastAPI versions
- [ ] FastAPI Cloud
- [ ] About HTTPS
- [ ] Run a Server Manually
- [ ] Deployments Concepts
- [ ] Deploy FastAPI on Cloud Providers
- [ ] Server Workers - Uvicorn with Workers
- [ ] FastAPI in Containers - Docker

---

## 6. How To - Recipes

- [ ] General - How To - Recipes
- [ ] Migrate from Pydantic v1 to Pydantic v2
- [ ] GraphQL
- [ ] Custom Request and APIRoute class
- [ ] Conditional OpenAPI
- [ ] Extending OpenAPI
- [ ] Separate OpenAPI Schemas for Input and Output or Not
- [ ] Custom Docs UI Static Assets (Self-Hosting)
- [ ] Configure Swagger UI
- [ ] Testing a Database
- [ ] Use Old 403 Authentication Error Status Codes
