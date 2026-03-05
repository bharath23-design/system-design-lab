# Python API Frameworks

## Flask

- **Type:** Micro-framework (WSGI [Web Server Gateway Interface], synchronous)
- **Philosophy:** Lightweight, minimal core — add what you need via extensions
- **Learning Curve:** Easy — great for beginners
- **Key Features:**
  - Built on Werkzeug (WSGI toolkit) and Jinja2 (templating)
  - Highly extensible via a rich ecosystem of plugins (Flask-SQLAlchemy, Flask-Login, etc.)
  - Flexible routing and middleware support
  - No enforced project structure — full freedom in how you organize code
- **Performance:** ~4,000–5,000 requests/sec (Gunicorn). Synchronous by default, so it can become a bottleneck under high concurrency
- **Limitations:** No built-in async support, no automatic data validation, no auto-generated API docs
- **Use Cases:** Quick prototypes, MVPs, proof-of-concepts, small-to-medium applications, learning APIs
- **Used By:** Netflix, Airbnb, Reddit

---

## FastAPI

- **Type:** Modern async framework (ASGI[Asynchronous Server Gateway Interface], async-native)
- **Philosophy:** High performance with developer productivity — leverages Python type hints
- **Learning Curve:** Intermediate — requires understanding of async/await and type hints
- **Key Features:**
  - Built on Starlette (ASGI web framework) and Pydantic (data validation)
  - Automatic request/response validation using Python type hints
  - Auto-generated interactive API docs (Swagger UI and ReDoc) via OpenAPI
  - Native async/await support for non-blocking I/O
  - Dependency injection system built-in
  - WebSocket support
- **Performance:** ~20,000+ requests/sec (Uvicorn). On par with Node.js and Go frameworks in benchmarks
- **Limitations:** Smaller ecosystem compared to Django, no built-in ORM or admin panel
- **Use Cases:** High-performance REST APIs, microservices, ML/AI model serving, real-time applications, agentic AI backends
- **Adoption:** 78,000+ GitHub stars; 38% of Python developers use it for API development (2025 JetBrains survey)

---

## Django (+ Django REST Framework)

- **Type:** Full-stack "batteries included" framework (WSGI, with ASGI support since v3.0)
- **Philosophy:** Convention over configuration — comes with everything built-in
- **Learning Curve:** Steepest — many built-in components and conventions to learn
- **Key Features:**
  - Powerful ORM with migrations
  - Built-in admin panel, authentication, and authorization
  - Django REST Framework (DRF) adds serializers, viewsets, browsable API, throttling, pagination, and filtering
  - Form handling, CSRF protection, and security best practices out of the box
  - Mature ecosystem with extensive third-party packages
- **Performance:** ~4,000–5,000 requests/sec. Slowest of the three, but caching and async views can improve throughput
- **Limitations:** Heavier footprint, more opinionated structure, overkill for simple APIs
- **Use Cases:** Enterprise web applications, content management systems, data-heavy CRUD apps, monolithic applications, admin-heavy projects
- **Used By:** Instagram, Spotify, Dropbox, Pinterest

---

## Comparison Summary

| Criteria        | Flask              | FastAPI              | Django                  |
|-----------------|--------------------|----------------------|-------------------------|
| **Architecture**| WSGI (sync)        | ASGI (async-native)  | WSGI + ASGI support     |
| **Performance** | ~4,000–5,000 rps   | ~20,000+ rps         | ~4,000–5,000 rps        |
| **Learning**    | Easy               | Intermediate         | Complex                 |
| **Validation**  | Manual / extensions| Automatic (Pydantic) | DRF Serializers         |
| **API Docs**    | Manual / extensions| Auto-generated (OpenAPI)| DRF Browsable API    |
| **ORM**         | None (use SQLAlchemy)| None (use SQLAlchemy)| Built-in Django ORM   |
| **Admin Panel** | No                 | No                   | Yes (built-in)          |
| **Async**       | Limited            | Native               | Partial (since v3.0)    |
| **Best For**    | MVPs, prototypes   | APIs, microservices, AI| Enterprise, full-stack |

## When to Choose What

- **Choose Flask** when you want maximum flexibility, are building a quick prototype, or need a lightweight API with minimal overhead.
- **Choose FastAPI** when you need high performance, async I/O, automatic validation, or are serving ML models and building microservices.
- **Choose Django** when you need a full-featured web application with admin panel, ORM, authentication, and a mature ecosystem out of the box.