# JavaScript Basics Cheat Sheet

> The essential JavaScript concepts every developer should know before moving to advanced topics.

---

# 1. Variables

Variables store data.

```javascript
let name = "John";
const age = 25;
var city = "Hyderabad";
```

### Types

- `let` → Can be reassigned
- `const` → Cannot be reassigned
- `var` → Old way (avoid in modern JS)

---

# 2. Data Types

JavaScript supports multiple data types.

```javascript
let age = 25;          // Number
let name = "John";     // String
let isAdmin = true;    // Boolean
let user = {};         // Object
let fruits = [];       // Array
let value = null;      // Null
let data;              // Undefined
```

### Primitive Types

- Number
- String
- Boolean
- Null
- Undefined
- BigInt
- Symbol

### Non-Primitive

- Object
- Array
- Function

---

# 3. Operators

Used to perform operations.

### Arithmetic

```javascript
+
-
*
/
%
**
```

Example

```javascript
let sum = 10 + 5;
```

### Assignment

```javascript
=
+=
-=
*=
/=
```

### Comparison

```javascript
==
===
!=
!==
<
>
<=
>=
```

### Logical

```javascript
&&
||
!
```

---

# 4. Objects

Objects store data as key-value pairs.

```javascript
const user = {
  name: "John",
  age: 25,
  isAdmin: true
};
```

Access values

```javascript
user.name

user["age"]
```

Add property

```javascript
user.city = "Hyderabad";
```

---

# 5. Strings

Strings store text.

```javascript
let greeting = "Hello";
```

Common Methods

```javascript
length
toUpperCase()
toLowerCase()
trim()
slice()
replace()
includes()
split()
```

Example

```javascript
let name = "JavaScript";

name.toUpperCase();
```

---

# 6. Control Flow (if / else)

Execute code based on conditions.

```javascript
if (age >= 18) {
    console.log("Adult");
}
else if (age >= 13) {
    console.log("Teen");
}
else {
    console.log("Child");
}
```

---

# 7. Loops

### For Loop

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

### While Loop

```javascript
let i = 0;

while (i < 5) {
    console.log(i);
    i++;
}
```

### Do While

```javascript
do {
    console.log(i);
    i++;
} while (i < 5);
```

---

# 8. Functions

Functions are reusable blocks of code.

### Function Declaration

```javascript
function greet(name) {
    return "Hello " + name;
}
```

### Arrow Function

```javascript
const greet = (name) => {
    return "Hello " + name;
};
```

### Short Arrow Function

```javascript
const square = x => x * x;
```

---

# 9. Parameters

Parameters receive input values.

```javascript
function add(a, b) {
    return a + b;
}
```

Calling

```javascript
add(10, 20);
```

Here:

- `a`, `b` → Parameters
- `10`, `20` → Arguments

---

# 10. Return

`return` sends a value back from a function.

```javascript
function multiply(a, b) {
    return a * b;
}
```

Without return

```javascript
function hello() {
    console.log("Hi");
}
```

---

# 11. Arrays

Arrays store multiple values.

```javascript
const fruits = [
    "Apple",
    "Banana",
    "Orange"
];
```

Access

```javascript
fruits[0]
```

Common Methods

```javascript
push()
pop()
shift()
unshift()
slice()
splice()
map()
filter()
find()
reduce()
```

---

# 12. Comparison Operators

Compare two values.

| Operator | Meaning |
|----------|---------|
| `==` | Equal (loose) |
| `===` | Strict Equal |
| `!=` | Not Equal |
| `!==` | Strict Not Equal |
| `>` | Greater Than |
| `<` | Less Than |
| `>=` | Greater or Equal |
| `<=` | Less or Equal |

Example

```javascript
5 === "5" // false

5 == "5" // true
```

Prefer using `===`.

---

# 13. Logical Operators

### AND

```javascript
&&
```

Both conditions must be true.

```javascript
age > 18 && isStudent
```

---

### OR

```javascript
||
```

At least one condition is true.

```javascript
isAdmin || isOwner
```

---

### NOT

```javascript
!
```

Reverse a boolean.

```javascript
!isLoggedIn
```

---

# 14. Array Methods

### forEach()

```javascript
numbers.forEach(num => {
    console.log(num);
});
```

### map()

Creates a new array.

```javascript
numbers.map(num => num * 2);
```

### filter()

Returns matching items.

```javascript
numbers.filter(num => num > 5);
```

### find()

Returns first matching item.

```javascript
numbers.find(num => num === 5);
```

### reduce()

Reduces array to one value.

```javascript
numbers.reduce((sum, num) => sum + num, 0);
```

---

# 15. DOM Introduction

DOM = Document Object Model

JavaScript can manipulate HTML.

Select Elements

```javascript
document.getElementById()

document.querySelector()

document.querySelectorAll()
```

Change Text

```javascript
document.querySelector("h1").textContent = "Hello";
```

Change HTML

```javascript
element.innerHTML = "<b>Welcome</b>";
```

Change Style

```javascript
element.style.color = "red";
```

Listen for Events

```javascript
button.addEventListener("click", () => {
    alert("Clicked!");
});
```

---

# Quick Revision

| Topic | Key Concept |
|--------|-------------|
| Variables | `let`, `const`, `var` |
| Data Types | Number, String, Boolean, Object, Array |
| Operators | Arithmetic, Assignment, Comparison, Logical |
| Objects | Key-value pairs |
| Strings | Text and string methods |
| Control Flow | `if`, `else if`, `else` |
| Loops | `for`, `while`, `do...while` |
| Functions | Reusable code blocks |
| Parameters | Function inputs |
| Return | Output from functions |
| Arrays | Ordered collections |
| Comparison | `===`, `!==`, `>`, `<` |
| Logical | `&&`, `||`, `!` |
| Array Methods | `forEach`, `map`, `filter`, `find`, `reduce` |
| DOM | Manipulate HTML using JavaScript |

---

## Next Topics to Learn

- ES6 Features
- Destructuring
- Spread & Rest Operators
- Template Literals
- Objects & Arrays (Advanced)
- Closures
- Scope & Hoisting
- Callbacks
- Promises
- Async/Await
- Modules
- Classes (OOP)
- Error Handling
- Fetch API
- Local Storage
- Event Loop
- Prototype & Inheritance
- Design Patterns
- TypeScript