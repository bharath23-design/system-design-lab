# Pydantic & Typing in Python

---

## `typing` — Python's Built-in Type Hints (stdlib)

Type hints don't enforce anything at runtime — they're for editors, `mypy`, and readability.

### Primitives

```python
name: str = "alice"
age: int = 30
score: float = 9.5
active: bool = True
data: bytes = b"raw"
```

### Collections

```python
from typing import List, Dict, Tuple, Set   # Python 3.8
# Python 3.9+ — use built-in directly (no import needed)

names: list[str] = ["alice", "bob"]
scores: dict[str, int] = {"alice": 95}
coords: tuple[int, int] = (10, 20)
tags: set[str] = {"admin", "user"}
```

### Optional & Union

```python
from typing import Optional, Union

# Optional[X] == X | None
def get_user(id: int) -> Optional[str]:
    ...

# Union — one of several types
def parse(val: Union[str, int]) -> str:
    ...

# Python 3.10+ shorthand
def greet(name: str | None = None) -> str:
    ...
```

### Any & Literal

```python
from typing import Any, Literal

def log(data: Any) -> None: ...          # opt-out of type checking

status: Literal["active", "inactive", "pending"]
role: Literal["admin", "user"]
```

### Callable & TypeVar

```python
from typing import Callable, TypeVar

Handler = Callable[[str, int], bool]     # (str, int) -> bool

T = TypeVar("T")                         # generic placeholder

def first(items: list[T]) -> T:
    return items[0]
```

### TypedDict — Dict with known keys

```python
from typing import TypedDict

class UserDict(TypedDict):
    name: str
    age: int
    email: str

user: UserDict = {"name": "Alice", "age": 30, "email": "a@b.com"}
```

### Protocol — Structural typing ("duck typing" with types)

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("drawing circle")

def render(shape: Drawable) -> None:   # Circle satisfies Drawable
    shape.draw()
```

### Annotated — Attach metadata to types

```python
from typing import Annotated

UserId = Annotated[int, "positive integer"]
Name = Annotated[str, "max 50 chars"]
```

Pydantic uses `Annotated` heavily for validation constraints.

### Final & ClassVar

```python
from typing import Final, ClassVar

MAX_SIZE: Final = 100           # cannot be reassigned
class Foo:
    count: ClassVar[int] = 0    # class-level, not instance
```

### Common Aliases (quick reference)

```python
from typing import (
    Any, Optional, Union, Literal,
    List, Dict, Tuple, Set,          # use built-in in 3.9+
    Callable, TypeVar, Generic,
    TypedDict, Protocol,
    Annotated, Final, ClassVar,
    overload, cast, TYPE_CHECKING,
)
```

---

## `pydantic` — Runtime Data Validation

Pydantic enforces types **at runtime** — it parses and validates incoming data (API bodies, env vars, configs).

```bash
uv add pydantic
```

---

### BaseModel — Core Building Block

```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str
    active: bool = True          # default value

user = User(name="Alice", age=30, email="alice@example.com")
print(user.name)                 # Alice
print(user.model_dump())         # {'name': 'Alice', 'age': 30, ...}
print(user.model_dump_json())    # JSON string
```

Pydantic auto-coerces compatible types:

```python
User(name="Alice", age="30", ...)   # "30" → 30, no error
User(name="Alice", age="abc", ...)  # ValidationError
```

---

### Field — Validation Constraints

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, le=10_000)            # 0 < price <= 10000
    stock: int = Field(ge=0, default=0)              # stock >= 0
    sku: str = Field(pattern=r"^[A-Z]{3}-\d{4}$")   # regex
    tags: list[str] = Field(default_factory=list)
```

| Constraint | Meaning |
|---|---|
| `gt` / `lt` | greater than / less than |
| `ge` / `le` | greater or equal / less or equal |
| `min_length` / `max_length` | string or list length |
| `pattern` | regex match |
| `default_factory` | callable for mutable defaults |

---

### Optional Fields & Defaults

```python
from pydantic import BaseModel
from typing import Optional

class Article(BaseModel):
    title: str
    body: str
    tags: list[str] = []                  # default empty list
    published: bool = False
    author: Optional[str] = None          # nullable, defaults None
    views: int | None = None              # 3.10+ shorthand
```

---

### Nested Models

```python
class Address(BaseModel):
    street: str
    city: str
    zip: str

class User(BaseModel):
    name: str
    address: Address                       # nested model
    friends: list["User"] = []            # recursive / self-referential

user = User(
    name="Alice",
    address={"street": "123 Main St", "city": "NY", "zip": "10001"},
)
print(user.address.city)                   # NY
```

---

### Validators

#### `@field_validator` — validate a single field

```python
from pydantic import BaseModel, field_validator

class User(BaseModel):
    name: str
    email: str
    age: int

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name cannot be blank")
        return v.title()                    # normalize to title case

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower()
```

#### `@model_validator` — validate across multiple fields

```python
from pydantic import BaseModel, model_validator

class DateRange(BaseModel):
    start: int
    end: int

    @model_validator(mode="after")
    def check_range(self) -> "DateRange":
        if self.end <= self.start:
            raise ValueError("end must be after start")
        return self
```

---

### Annotated Validators (Reusable)

```python
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator

def strip_whitespace(v: str) -> str:
    return v.strip()

CleanStr = Annotated[str, BeforeValidator(strip_whitespace)]

class Form(BaseModel):
    username: CleanStr
    bio: CleanStr = ""
```

---

### Serialization

```python
user = User(name="Alice", age=30, email="alice@example.com")

# To dict
user.model_dump()
user.model_dump(exclude={"email"})
user.model_dump(include={"name", "age"})
user.model_dump(exclude_none=True)         # drop None fields
user.model_dump(by_alias=True)             # use field aliases

# To JSON string
user.model_dump_json()
user.model_dump_json(indent=2)

# From dict / JSON
User.model_validate({"name": "Bob", "age": 25, "email": "b@c.com"})
User.model_validate_json('{"name":"Bob","age":25,"email":"b@c.com"}')
```

---

### Field Aliases — Different external name

```python
from pydantic import BaseModel, Field

class Response(BaseModel):
    user_id: int = Field(alias="userId")          # parse "userId" from JSON
    full_name: str = Field(alias="fullName")

    model_config = {"populate_by_name": True}     # also allow snake_case

resp = Response.model_validate({"userId": 1, "fullName": "Alice"})
print(resp.user_id)    # 1
```

---

### model_config — Model-level settings

```python
from pydantic import BaseModel, ConfigDict

class User(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,     # strip strings automatically
        str_to_lower=True,             # lowercase all strings
        frozen=True,                   # immutable (hashable)
        extra="forbid",                # error on unknown fields
        populate_by_name=True,         # allow both alias and field name
    )

    name: str
    email: str
```

---

### `pydantic-settings` — Config from Env / `.env`

```bash
uv add pydantic-settings
```

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "MyApp"
    database_url: str
    api_key: str
    debug: bool = False
    port: int = 8000

settings = Settings()               # reads from env / .env automatically
print(settings.database_url)
```

`.env` file:

```env
DATABASE_URL=postgresql://user:pass@localhost/db
API_KEY=secret123
DEBUG=true
PORT=8080
```

---

### Discriminated Unions — Type-safe polymorphism

```python
from typing import Literal, Union, Annotated
from pydantic import BaseModel, Field

class Cat(BaseModel):
    type: Literal["cat"]
    meows: bool

class Dog(BaseModel):
    type: Literal["dog"]
    barks: bool

Pet = Annotated[Union[Cat, Dog], Field(discriminator="type")]

class Owner(BaseModel):
    name: str
    pet: Pet

owner = Owner.model_validate({"name": "Alice", "pet": {"type": "cat", "meows": True}})
print(type(owner.pet))     # <class 'Cat'>
```

---

### Computed Fields

```python
from pydantic import BaseModel, computed_field

class Rectangle(BaseModel):
    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        return self.width * self.height

r = Rectangle(width=4, height=5)
print(r.area)              # 20.0
print(r.model_dump())      # includes 'area'
```

---

### JSON Schema Generation

```python
print(User.model_json_schema())
# → OpenAPI-compatible JSON schema dict

import json
print(json.dumps(User.model_json_schema(), indent=2))
```

FastAPI uses this automatically to generate `/docs` (Swagger UI).

---

## Pydantic + FastAPI — Full Example

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

app = FastAPI()

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    age: int = Field(ge=18, le=120)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(body: UserCreate) -> UserResponse:
    # body is already validated — safe to use directly
    user_id = save_to_db(body.model_dump())
    return UserResponse(id=user_id, **body.model_dump())
```

---

## Quick Reference

### typing

| Type | Example |
|---|---|
| `str \| None` | optional string |
| `list[str]` | list of strings |
| `dict[str, int]` | string → int map |
| `tuple[int, str]` | fixed-length tuple |
| `Literal["a","b"]` | exact value |
| `TypedDict` | dict with known keys |
| `Protocol` | structural interface |
| `Callable[[int], str]` | function signature |
| `Annotated[T, meta]` | type + metadata |

### pydantic

| Feature | How |
|---|---|
| Define model | `class M(BaseModel)` |
| Constraints | `Field(gt=0, max_length=50)` |
| Validate field | `@field_validator("field")` |
| Cross-field validation | `@model_validator(mode="after")` |
| To dict | `m.model_dump()` |
| To JSON | `m.model_dump_json()` |
| From dict | `M.model_validate({...})` |
| From JSON | `M.model_validate_json("...")` |
| Settings | `class S(BaseSettings)` |
| Immutable | `model_config = ConfigDict(frozen=True)` |
| Block extra fields | `model_config = ConfigDict(extra="forbid")` |
