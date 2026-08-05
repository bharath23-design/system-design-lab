// ==============================
// Variables
// ==============================

let username = "Bharath";
const age = 24;
let isStudent = true;

// ==============================
// Data Types
// ==============================

let number = 100;
let text = "Hello JavaScript";
let colors = ["Red", "Green", "Blue"];

let user = {
    name: username,
    age: age,
    city: "Hyderabad"
};

// ==============================
// Function
// ==============================

function greet(name) {
    return `Welcome ${name}!`;
}

// ==============================
// DOM Elements
// ==============================

const button = document.getElementById("btn");
const message = document.getElementById("message");
const output = document.getElementById("output");

// ==============================
// Button Click
// ==============================

button.addEventListener("click", function () {

    // Change text
    message.textContent = greet(username);

    // Comparison
    const result = age >= 18 ? "Adult" : "Minor";

    // Array Method
    const upperColors = colors.map(color => color.toUpperCase());

    // Build output safely using DOM methods (no innerHTML with dynamic values)
    output.textContent = "";

    function addHeading(tag, text) {
        const el = document.createElement(tag);
        el.textContent = text;
        output.appendChild(el);
    }

    function addLine(label, value) {
        const p = document.createElement("p");
        p.style.margin = "4px 0";
        const b = document.createElement("b");
        b.textContent = label + ": ";
        p.appendChild(b);
        p.appendChild(document.createTextNode(value));
        output.appendChild(p);
    }

    function addRule() {
        output.appendChild(document.createElement("hr"));
    }

    addHeading("h3", "User Information");
    addLine("Name", user.name);
    addLine("Age", user.age);
    addLine("City", user.city);

    addRule();
    addLine("Status", result);

    addRule();
    addHeading("b", "Original Colors:");
    colors.forEach(function (color) {
        const p = document.createElement("p");
        p.style.margin = "2px 0";
        p.textContent = color;
        output.appendChild(p);
    });

    addRule();
    addLine("Uppercase Colors", upperColors.join(", "));

    addRule();
    addLine("Random Calculation", `10 + 20 = ${10 + 20}`);
});


// ==============================
// To-Do List
// ==============================

let todos = [];  // array of { id, text, done }
let nextId = 1;

const todoInput     = document.getElementById("todo-input");
const addTodoBtn    = document.getElementById("add-todo-btn");
const todoList      = document.getElementById("todo-list");
const todoStats     = document.getElementById("todo-stats");
const clearDoneBtn  = document.getElementById("clear-done-btn");

function renderTodos() {
    todoList.innerHTML = "";

    todos.forEach(function (todo) {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const span = document.createElement("span");
        span.className = "todo-text";
        span.textContent = todo.text;
        span.title = "Click to toggle complete";
        span.addEventListener("click", function () {
            toggleTodo(todo.id);
        });

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const doneBtn = document.createElement("button");
        doneBtn.className = "done-btn";
        doneBtn.textContent = todo.done ? "Undo" : "Done";
        doneBtn.addEventListener("click", function () {
            toggleTodo(todo.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", function () {
            deleteTodo(todo.id);
        });

        actions.appendChild(doneBtn);
        actions.appendChild(deleteBtn);
        li.appendChild(span);
        li.appendChild(actions);
        todoList.appendChild(li);
    });

    const total     = todos.length;
    const completed = todos.filter(t => t.done).length;
    todoStats.textContent = `${completed} of ${total} task(s) completed`;
}

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    todos.push({ id: nextId++, text: text, done: false });
    todoInput.value = "";
    renderTodos();
}

function toggleTodo(id) {
    todos = todos.map(function (t) {
        return t.id === id ? { id: t.id, text: t.text, done: !t.done } : t;
    });
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    renderTodos();
}

// Add via button click
addTodoBtn.addEventListener("click", addTodo);

// Add via Enter key
todoInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTodo();
});

// Clear all completed tasks
clearDoneBtn.addEventListener("click", function () {
    todos = todos.filter(t => !t.done);
    renderTodos();
});

// Initial render to show stats
renderTodos();
