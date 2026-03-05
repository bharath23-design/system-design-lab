# Design Patterns - Concise Notes

---

## Creational Patterns

### 1. Singleton

Ensures a class has only **one instance** and provides a global access point to it.

```
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

| Pros | Cons |
|------|------|
| Controlled access to sole instance | Hard to unit test (global state) |
| Lazy initialization possible | Violates Single Responsibility Principle |
| Thread-safe with proper locking | Hidden dependencies in codebase |

**Production Use:** Database connection pools, logger instances, config managers, cache clients (Redis/Memcached wrappers), feature flag services.

**Watch out:** In multi-threaded environments, use `threading.Lock()` or module-level instantiation. In microservices, a singleton is per-process, not per-cluster.

---

### 2. Factory Method

Defines an interface for creating objects but lets **subclasses decide** which class to instantiate.

```
class PaymentFactory:
    def create_payment(self, method):
        if method == "card": return CardPayment()
        if method == "upi":  return UPIPayment()
```

| Pros | Cons |
|------|------|
| Decouples object creation from usage | Can lead to many subclasses |
| Easy to add new types without modifying existing code | Slight indirection overhead |
| Follows Open/Closed Principle | Factory logic can grow complex |

**Production Use:** Payment gateway integrations, notification services (email/sms/push), cloud provider abstraction (AWS/GCP/Azure), serializer selection (JSON/XML/Protobuf).

---

### 3. Abstract Factory

Creates **families of related objects** without specifying their concrete classes.

```
class AWSFactory:
    def create_storage(self): return S3Storage()
    def create_compute(self): return EC2Compute()

class GCPFactory:
    def create_storage(self): return GCSStorage()
    def create_compute(self): return GCECompute()
```

| Pros | Cons |
|------|------|
| Ensures compatibility among related objects | Adding new product types requires changes everywhere |
| Swapping entire families is easy | More boilerplate than simple factory |
| Strong encapsulation of creation logic | Over-engineering for small systems |

**Production Use:** Cross-platform UI toolkits, multi-cloud infrastructure abstraction, database dialect support (PostgreSQL/MySQL/SQLite family of drivers).

---

### 4. Builder

Constructs complex objects **step by step**, separating construction from representation.

```
query = QueryBuilder()
    .select("name", "email")
    .from_table("users")
    .where("active = true")
    .limit(10)
    .build()
```

| Pros | Cons |
|------|------|
| Avoids telescoping constructors | More verbose for simple objects |
| Immutable objects can be built incrementally | Requires a separate builder class |
| Readable and self-documenting | Duplication between builder and product |

**Production Use:** SQL query builders, HTTP request construction, complex config objects, Kubernetes manifest generation, email/notification templates with optional fields.

---

### 5. Prototype

Creates new objects by **cloning an existing instance** rather than building from scratch.

```
import copy
new_config = copy.deepcopy(base_config)
new_config.env = "staging"
```

| Pros | Cons |
|------|------|
| Avoids expensive initialization | Deep copy can be tricky with circular refs |
| Dynamic object creation at runtime | Clone method must be maintained |
| Reduces subclass explosion | Hard to clone objects with external resources |

**Production Use:** Cloning pre-configured objects (template environments), game entities with shared base stats, document templates, test fixture generation.

---

### 6. Object Pool

Manages a pool of **reusable objects** instead of creating and destroying them on demand.

```
class ConnectionPool:
    def __init__(self, size):
        self.pool = [create_connection() for _ in range(size)]

    def acquire(self):
        return self.pool.pop()

    def release(self, conn):
        self.pool.append(conn)
```

| Pros | Cons |
|------|------|
| Avoids expensive creation/destruction overhead | Pool sizing is tricky (too small = starvation, too big = waste) |
| Predictable resource usage | Objects must be reset before reuse |
| Controls max concurrent resource usage | Added complexity for lifecycle management |

**Production Use:** Database connection pools (SQLAlchemy pool, PgBouncer), thread pools, gRPC channel pools, HTTP session pools, worker process pools (Gunicorn prefork).

**Watch out:** Always release objects back to pool (use context managers). Stale/broken connections need health checks before reuse.

---

### 7. Multiton

Like Singleton but maintains **one instance per key** — a registry of named instances.

```
class DBConnection:
    _instances = {}

    @classmethod
    def get_instance(cls, db_name):
        if db_name not in cls._instances:
            cls._instances[db_name] = cls(db_name)
        return cls._instances[db_name]

# DBConnection.get_instance("users_db")
# DBConnection.get_instance("analytics_db")
```

| Pros | Cons |
|------|------|
| Controlled instances per logical key | Global state (same drawbacks as Singleton) |
| Prevents duplicate resources for same key | Registry can grow unbounded without cleanup |
| Centralized instance management | Hard to test — shared mutable state |

**Production Use:** Per-database connection managers, per-tenant config in multi-tenant apps, per-region service clients (AWS S3 client per region), named logger instances (`logging.getLogger("module_name")`).

---

## Structural Patterns

### 8. Adapter

Converts the interface of a class into **another interface** clients expect. Makes incompatible interfaces work together.

```
class StripeAdapter(PaymentGateway):
    def __init__(self):
        self.stripe = StripeSDK()

    def charge(self, amount):
        return self.stripe.create_charge(cents=amount * 100)
```

| Pros | Cons |
|------|------|
| Reuse existing classes with incompatible interfaces | Added layer of indirection |
| Single Responsibility - conversion logic isolated | Can become a dumping ground for logic |
| Open/Closed - new adapters without changing client | Too many adapters = design smell |

**Production Use:** Third-party API integrations (payment, shipping), legacy system migration wrappers, ORM result to domain model mapping, external logging library abstraction.

---

### 9. Decorator

Adds **additional behavior** to objects dynamically without altering their structure.

```
@retry(max_attempts=3)
@cache(ttl=300)
@log_execution
def get_user(user_id):
    return db.query(user_id)
```

| Pros | Cons |
|------|------|
| Add/remove behavior at runtime | Many small decorator classes |
| Avoids feature-bloated base classes | Order of wrapping matters |
| Follows Single Responsibility | Debugging stack traces gets harder |

**Production Use:** Python decorators (`@login_required`, `@cache`, `@retry`), middleware chains in web frameworks, I/O stream wrapping (compression, encryption, buffering), API rate limiting.

---

### 10. Proxy

Provides a **surrogate or placeholder** to control access to another object.

```
class CachedUserService(UserService):
    def get_user(self, user_id):
        if user_id in self.cache:
            return self.cache[user_id]
        user = self.real_service.get_user(user_id)
        self.cache[user_id] = user
        return user
```

**Types:** Virtual (lazy load), Protection (access control), Caching, Logging, Remote (RPC stub).

| Pros | Cons |
|------|------|
| Control access without client knowing | Added latency from indirection |
| Lazy initialization of heavy objects | Proxy must stay in sync with real subject |
| Cross-cutting concerns separated cleanly | Response might be stale (caching proxy) |

**Production Use:** ORM lazy loading, API gateway (auth + rate limiting proxy), gRPC stubs, connection pooling proxies, circuit breakers.

---

### 11. Facade

Provides a **simplified interface** to a complex subsystem.

```
class OrderFacade:
    def place_order(self, cart):
        self.inventory.reserve(cart.items)
        self.payment.charge(cart.total)
        self.shipping.schedule(cart.address)
        self.notification.send_confirmation(cart.user)
```

| Pros | Cons |
|------|------|
| Simplifies complex subsystem usage | Can become a god object |
| Reduces coupling between client and subsystem | Hides complexity that devs may need |
| Single entry point for operations | Facade changes when any subsystem changes |

**Production Use:** SDK wrappers (AWS SDK facade), checkout/order orchestration, DevOps deployment pipelines, onboarding flows (user + org + permissions setup).

---

### 12. Composite

Composes objects into **tree structures** to represent part-whole hierarchies.

```
class Directory(FileComponent):
    def size(self):
        return sum(child.size() for child in self.children)

class File(FileComponent):
    def size(self):
        return self.bytes
```

| Pros | Cons |
|------|------|
| Uniform treatment of individual and composite objects | Can make design overly general |
| Easy to add new component types | Hard to restrict component types in tree |
| Recursive operations are natural | Type safety harder to enforce |

**Production Use:** File system representations, UI component trees (React/Flutter widget trees), organizational hierarchies, menu/navigation structures, permission trees.

---

## Behavioral Patterns

### 13. Observer

Defines a **one-to-many dependency** so that when one object changes state, all dependents are notified.

```
class EventBus:
    def subscribe(self, event, callback): ...
    def publish(self, event, data):
        for cb in self.listeners[event]:
            cb(data)
```

| Pros | Cons |
|------|------|
| Loose coupling between publisher and subscribers | Hard to debug event chains |
| Add new subscribers without modifying publisher | Memory leaks if subscribers aren't removed |
| Supports broadcast communication | Ordering of notifications not guaranteed |

**Production Use:** Event-driven architectures, Kafka/RabbitMQ consumers, Django signals, webhook delivery, real-time UI updates (WebSocket event handlers), pub/sub systems.

---

### 14. Strategy

Defines a family of algorithms, encapsulates each, and makes them **interchangeable at runtime**.

```
class PricingEngine:
    def __init__(self, strategy):
        self.strategy = strategy

    def calculate(self, order):
        return self.strategy.apply(order)

# Usage
engine = PricingEngine(FestivalDiscount())
engine = PricingEngine(BulkDiscount())
```

| Pros | Cons |
|------|------|
| Swap algorithms without changing context | Clients must be aware of strategies |
| Eliminates conditional statements | Overkill if only 2 strategies exist |
| Each strategy testable in isolation | Increased number of classes |

**Production Use:** Pricing/discount engines, authentication strategies (OAuth/JWT/API key), sorting/filtering algorithms, compression strategy selection, load balancing algorithms (round-robin/least-connections).

---

### 15. Command

Encapsulates a request as an **object**, allowing parameterization, queuing, and undo operations.

```
class TransferCommand:
    def execute(self):
        self.from_acc.debit(self.amount)
        self.to_acc.credit(self.amount)

    def undo(self):
        self.to_acc.debit(self.amount)
        self.from_acc.credit(self.amount)
```

| Pros | Cons |
|------|------|
| Decouple invoker from executor | Can lead to many command classes |
| Supports undo/redo, logging, queuing | Extra layer for simple operations |
| Commands can be serialized and replayed | State management for undo can be complex |

**Production Use:** Task queues (Celery tasks), undo/redo in editors, transaction logs, CLI tools (click/argparse command objects), macro recording, CQRS write side.

---

### 16. Template Method

Defines the **skeleton of an algorithm** in a base class, letting subclasses override specific steps.

```
class ETLPipeline:
    def run(self):          # template - don't override
        data = self.extract()
        cleaned = self.transform(data)
        self.load(cleaned)

    def extract(self): ...    # subclass overrides
    def transform(self): ...  # subclass overrides
    def load(self): ...       # subclass overrides
```

| Pros | Cons |
|------|------|
| Eliminates code duplication for shared flow | Tight coupling via inheritance |
| Enforces a consistent algorithm structure | Hard to compose - only one parent |
| Subclass only overrides what varies | Violates Liskov if steps are skipped |

**Production Use:** ETL pipelines, test frameworks (`setUp/test/tearDown`), web scrapers with common flow, report generation, data import/export pipelines.

---

### 17. Chain of Responsibility

Passes a request along a **chain of handlers** until one handles it.

```
class AuthMiddleware:
    def handle(self, request):
        if not request.token:
            return Response(401)
        return self.next.handle(request)
```

| Pros | Cons |
|------|------|
| Decouples sender from receivers | No guarantee the request gets handled |
| Add/reorder handlers dynamically | Hard to debug long chains |
| Each handler has single responsibility | Performance hit from traversing chain |

**Production Use:** Web middleware stacks (Django/FastAPI/Express), logging handler chains, approval workflows, input validation pipelines, exception handling chains.

---

### 18. State

Allows an object to **alter its behavior** when its internal state changes.

```
class Order:
    state = PendingState()

    def next(self):
        self.state = self.state.next(self)

# PendingState.next() -> ConfirmedState
# ConfirmedState.next() -> ShippedState
# ShippedState.next() -> DeliveredState
```

| Pros | Cons |
|------|------|
| Eliminates massive if/else state checks | Can be overkill for few states |
| Each state encapsulated in its own class | State transitions scattered across classes |
| Adding new states doesn't break existing ones | Number of classes grows with states |

**Production Use:** Order lifecycle management, payment status machines, user session states, CI/CD pipeline stages, game character states, ticket/issue workflows (Jira-like).

---

### 19. Iterator

Provides a way to access elements of a collection **sequentially** without exposing the underlying structure.

```
class PaginatedAPI:
    def __iter__(self):
        while self.has_next_page:
            yield from self.fetch_page()
            self.page += 1
```

| Pros | Cons |
|------|------|
| Uniform traversal interface | Overhead for simple collections |
| Multiple iterators on same collection | Can't easily go backwards |
| Lazy evaluation with generators | Stateful - not thread safe by default |

**Production Use:** Database cursor iteration, paginated API responses, file line-by-line processing, streaming large datasets, tree/graph traversals.

---

### 20. Mediator

Defines an object that **encapsulates how objects interact**, preventing direct references between them.

```
class ChatRoom:
    def send(self, message, sender):
        for user in self.users:
            if user != sender:
                user.receive(message)
```

| Pros | Cons |
|------|------|
| Reduces direct dependencies between objects | Mediator can become a god object |
| Centralized communication logic | Single point of failure |
| Easier to change interaction logic | Can hide important relationships |

**Production Use:** Chat rooms, air traffic control systems, form field interdependencies, microservice orchestrators, event buses, UI component coordination.

---

## Infrastructure / Application Patterns

### 21. Repository

Abstracts the **data access layer**, providing a collection-like interface for domain objects.

```
class UserRepository:
    def find_by_id(self, user_id):
        return self.session.query(User).get(user_id)

    def find_active(self):
        return self.session.query(User).filter(User.active == True).all()

    def save(self, user):
        self.session.add(user)
        self.session.commit()
```

| Pros | Cons |
|------|------|
| Decouples business logic from data access | Extra abstraction over ORM (which is already an abstraction) |
| Easy to swap storage (SQL -> NoSQL, API) | Can lead to leaky abstractions |
| Domain logic stays clean and testable | Repository methods can explode in count |
| Mocking repositories makes unit testing trivial | Risk of hiding N+1 queries |

**Production Use:** Domain-Driven Design services, any app needing testable data access, multi-storage apps (cache + DB), migrating from one database to another, Clean Architecture / Hexagonal Architecture.

**Watch out:** Avoid "fat repositories" with dozens of query methods. Use query objects or specifications for complex filters.

---

### 22. Cache

Stores **frequently accessed data** in a fast-access layer to avoid repeated expensive computation or I/O.

```
class CacheAside:
    def get_user(self, user_id):
        cached = self.cache.get(f"user:{user_id}")
        if cached:
            return cached
        user = self.db.query(user_id)
        self.cache.set(f"user:{user_id}", user, ttl=300)
        return user

    def update_user(self, user_id, data):
        self.db.update(user_id, data)
        self.cache.delete(f"user:{user_id}")  # invalidate
```

**Strategies:**
- **Cache-Aside (Lazy):** App checks cache first, fills on miss. Most common.
- **Write-Through:** Write to cache and DB simultaneously. Strong consistency.
- **Write-Behind:** Write to cache, async flush to DB. Fast writes, eventual consistency.
- **Read-Through:** Cache itself fetches from DB on miss. Simpler app code.

| Pros | Cons |
|------|------|
| Dramatically reduces latency and DB load | Stale data risk — invalidation is hard |
| Absorbs traffic spikes | Cache stampede on cold start / expiry |
| Scales reads horizontally | Added infrastructure complexity |
| Reduces cost of expensive computations | Memory is limited — eviction needed |

**Production Use:** Redis/Memcached for session and query caching, CDN for static assets, API response caching, computed aggregation caching, DNS caching.

**Watch out:** Cache invalidation is one of the hardest problems. Use TTL as a safety net, and prefer event-driven invalidation for critical data.

---

### 23. Retry

Automatically **retries a failed operation** with configurable backoff, handling transient failures gracefully.

```
def retry(max_attempts=3, backoff=2, exceptions=(Exception,)):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if attempt == max_attempts - 1:
                        raise
                    sleep(backoff ** attempt)
        return wrapper
    return decorator

@retry(max_attempts=3, backoff=2, exceptions=(ConnectionError, TimeoutError))
def call_payment_api(payload):
    return requests.post(PAYMENT_URL, json=payload)
```

**Backoff Strategies:**
- **Fixed:** Same delay every retry. Simple but can cause thundering herd.
- **Exponential:** 1s -> 2s -> 4s -> 8s. Standard for distributed systems.
- **Exponential + Jitter:** Adds randomness to prevent synchronized retries across instances.

| Pros | Cons |
|------|------|
| Handles transient network/service failures | Can amplify load on failing services |
| Improves system resilience automatically | Non-idempotent operations may cause duplicates |
| Simple to implement as decorator | Delays user response if all retries fail |
| Exponential backoff prevents thundering herd | Must cap retries to avoid infinite loops |

**Production Use:** External API calls, message queue consumers, database reconnection, file upload retries, microservice-to-microservice communication, DNS resolution.

**Watch out:** Only retry on transient errors (timeouts, 503s) — never on 400/401/403. Always pair with circuit breaker to stop retrying a dead service. Ensure operations are **idempotent** before retrying.

---

## Quick Reference - When to Use What

| Problem | Pattern |
|---------|---------|
| Need exactly one instance | Singleton |
| Object creation varies by type | Factory |
| Build complex objects step by step | Builder |
| Clone expensive objects | Prototype |
| Wrap incompatible interfaces | Adapter |
| Add behavior dynamically | Decorator |
| Control access to an object | Proxy |
| Simplify a complex subsystem | Facade |
| Tree structures | Composite |
| React to state changes | Observer |
| Swap algorithms at runtime | Strategy |
| Queue/undo operations | Command |
| Fixed algorithm, varying steps | Template Method |
| Pass request through handlers | Chain of Responsibility |
| Object behavior depends on state | State |
| Sequential access to collection | Iterator |
| Centralize object interaction | Mediator |
| Reuse expensive objects (connections) | Object Pool |
| One instance per key | Multiton |
| Abstract data access layer | Repository |
| Speed up repeated reads | Cache |
| Handle transient failures | Retry |
