// =============================================================================
// 13_dom_events_and_forms.ts
// DOM Events and Forms in TypeScript
// =============================================================================
// TypeScript gives us static typing on top of the browser's DOM APIs.
// The DOM types ship inside the "lib.dom.d.ts" declaration file that is
// bundled with TypeScript — enable it via tsconfig: "lib": ["DOM", "ES2020"].
//
// Key insight: the browser DOM has a deep inheritance hierarchy.
//   EventTarget ← Node ← Element ← HTMLElement ← HTMLInputElement
// TypeScript mirrors this, so a narrower type always exposes MORE properties.
// =============================================================================

// =============================================================================
// PART A — DOM Event Listeners with TypeScript
// =============================================================================

// -----------------------------------------------------------------------------
// A1. addEventListener with typed event parameters
// -----------------------------------------------------------------------------
// The browser dispatches many flavours of Event (MouseEvent, KeyboardEvent…).
// TypeScript's overloaded addEventListener signature maps the event-name string
// to the correct Event subtype automatically, so the callback parameter is
// already narrowed — no casting needed when using the string literal form.

const button = document.getElementById("submit-btn"); // HTMLElement | null

if (button) {
  // TypeScript infers `e` as MouseEvent because "click" maps to MouseEvent.
  // This means e.clientX, e.button, e.ctrlKey etc. are all available.
  button.addEventListener("click", (e: MouseEvent) => {
    console.log(`Clicked at (${e.clientX}, ${e.clientY})`);
  });

  // "keydown" maps to KeyboardEvent — e.key / e.code are typed correctly.
  button.addEventListener("keydown", (e: KeyboardEvent) => {
    console.log(`Key pressed: ${e.key}, code: ${e.code}`);
  });

  // "focus" / "blur" map to FocusEvent — e.relatedTarget is the element
  // that is losing or gaining focus at the same time.
  button.addEventListener("focus", (e: FocusEvent) => {
    console.log("Focus arrived from:", e.relatedTarget);
  });

  // "input" maps to InputEvent — e.data contains the character(s) just typed.
  // InputEvent is distinct from Event; it carries .data and .inputType.
  button.addEventListener("input", (e: InputEvent) => {
    console.log("Input data:", e.data, "type:", e.inputType);
  });
}

// -----------------------------------------------------------------------------
// A2. HTMLElement typing — querySelector returns Element | null
// -----------------------------------------------------------------------------
// document.querySelector<T>() is a generic function. Without a type argument
// it returns Element | null. Element is the most general DOM node — it does
// NOT have .value, .checked, .type, etc.  We must either:
//   (a) pass a type argument: querySelector<HTMLInputElement>("#name")
//   (b) cast after the call: element as HTMLInputElement
// Option (a) is preferred because it avoids a runtime mistake where the CSS
// selector matches a different element type than we assumed.

const nameInput = document.querySelector<HTMLInputElement>("#name");
// nameInput is now HTMLInputElement | null — we get .value, .placeholder, etc.

if (nameInput) {
  console.log("Name field current value:", nameInput.value);
}

// When you know the element exists and is a specific type you can non-null
// assert (!) and cast together.  Use this sparingly — it bypasses null-safety.
const title = document.querySelector("h1") as HTMLHeadingElement;
// HTMLHeadingElement gives us .align, inheriting all of HTMLElement too.

// -----------------------------------------------------------------------------
// A3. Event delegation pattern
// -----------------------------------------------------------------------------
// Instead of attaching one listener per list item (expensive for large lists),
// attach ONE listener to the parent.  Events bubble up from child → parent, so
// the parent's listener fires for clicks on any descendant.
//
// WHY delegation?
//   • Fewer listeners → less memory.
//   • Works for dynamically added children (they don't need their own listener).
//   • Single place to add/remove the handler.
//
// HOW it works:
//   e.target    = the ACTUAL element the user clicked (could be a child).
//   e.currentTarget = the element the listener is attached to (the parent).
//   We check e.target to decide whether to act.

const list = document.querySelector<HTMLUListElement>("#task-list");

if (list) {
  list.addEventListener("click", (e: MouseEvent) => {
    // e.target is EventTarget | null in the base type.
    // We narrow it to Element so we can call .closest() / .matches().
    const target = e.target as Element;

    // .matches() tests whether the clicked element matches a CSS selector.
    // .closest() walks UP the DOM looking for an ancestor matching the selector.
    // Together they let us react only when a <li> (or child of <li>) is clicked.
    const listItem = target.closest("li");
    if (listItem) {
      console.log("Task clicked:", listItem.textContent);
      listItem.classList.toggle("done");
    }
  });
}

// -----------------------------------------------------------------------------
// A4. Removing event listeners — must store the function reference
// -----------------------------------------------------------------------------
// addEventListener stores an internal reference to the callback.
// removeEventListener looks up the SAME reference by identity (===).
// Arrow functions assigned inline are anonymous — you cannot remove them.
// Always save the handler to a variable when removal is needed.

function onDocumentClick(e: MouseEvent): void {
  console.log("Document clicked:", e.target);
}

document.addEventListener("click", onDocumentClick);

// Later — e.g. when a modal closes or component unmounts — remove it:
document.removeEventListener("click", onDocumentClick);
// Without the saved reference, the listener would stay attached forever
// (a "ghost listener"), causing memory leaks and unexpected behaviour.

// -----------------------------------------------------------------------------
// A5. Custom events with CustomEvent<T>
// -----------------------------------------------------------------------------
// CustomEvent<T> lets you attach typed data (the `detail` payload) to a
// browser event.  Any element can dispatch it and any ancestor can listen.
// This creates a lightweight pub/sub system within the DOM.
//
// Generic T controls the shape of event.detail — TypeScript enforces it.

interface CartUpdatePayload {
  productId: string;
  quantity: number;
}

// Dispatch a custom event from a child element.
function addToCart(productId: string, qty: number): void {
  const event = new CustomEvent<CartUpdatePayload>("cart:update", {
    detail: { productId, quantity: qty },
    // bubbles: true  → the event travels up the DOM so any ancestor can catch it.
    // composed: true → the event crosses shadow-DOM boundaries (Web Components).
    bubbles: true,
    composed: false,
  });
  document.dispatchEvent(event);
}

// Listen anywhere in the ancestor chain.
document.addEventListener("cart:update", (e: Event) => {
  // TypeScript doesn't narrow CustomEvent from the generic "Event" listener
  // signature automatically, so we cast.
  const customEvent = e as CustomEvent<CartUpdatePayload>;
  console.log(
    `Cart updated: product=${customEvent.detail.productId}, qty=${customEvent.detail.quantity}`
  );
});

// Trigger it:
addToCart("SKU-42", 3);

// =============================================================================
// PART B — Mouse & Keyboard Events
// =============================================================================

// -----------------------------------------------------------------------------
// B1. MouseEvent properties
// -----------------------------------------------------------------------------
// MouseEvent extends UIEvent extends Event.
// Key coordinates:
//   clientX/Y  — relative to the VIEWPORT (top-left = 0,0).
//   pageX/Y    — relative to the full PAGE (includes scroll offset).
//   offsetX/Y  — relative to the element the listener is on.
//   screenX/Y  — relative to the physical SCREEN.
//
// target vs currentTarget:
//   target        = element that was actually clicked (may be a child).
//   currentTarget = element the listener is registered on.
//   During propagation these can differ; inside the handler currentTarget
//   is always the element you called addEventListener on.

const canvas = document.querySelector<HTMLCanvasElement>("#drawing-canvas");

if (canvas) {
  canvas.addEventListener("mousemove", (e: MouseEvent) => {
    // offsetX/Y are relative to the canvas edge — ideal for drawing coordinates.
    const x = e.offsetX;
    const y = e.offsetY;
    console.log(`Mouse at canvas coords (${x}, ${y})`);

    // e.buttons is a bitmask: 1=left, 2=right, 4=middle (can be combined).
    if (e.buttons === 1) {
      console.log("Left button held — drawing!");
    }
  });

  canvas.addEventListener("contextmenu", (e: MouseEvent) => {
    // Prevent the browser's right-click context menu so we can show our own.
    e.preventDefault();
    console.log("Custom context menu at:", e.clientX, e.clientY);
  });
}

// -----------------------------------------------------------------------------
// B2. KeyboardEvent properties
// -----------------------------------------------------------------------------
// key    — the logical key VALUE: "Enter", "a", "A", "ArrowUp", " " (space).
//           Affected by Shift, CapsLock, locale.  Use this for character input.
// code   — the PHYSICAL key location: "KeyA", "Enter", "ShiftLeft".
//           NOT affected by Shift or locale.  Use this for game controls.
// Modifier flags: shiftKey, ctrlKey, altKey, metaKey (Cmd on Mac).

document.addEventListener("keydown", (e: KeyboardEvent) => {
  // Guard against modifier-only presses before checking combos.
  if (e.ctrlKey && e.key === "s") {
    // Ctrl+S would trigger the browser's Save dialog — prevent it.
    e.preventDefault();
    console.log("Custom save triggered!");
    return;
  }

  if (e.key === "Escape") {
    console.log("Close modal / cancel operation");
  }

  // e.code lets us map WASD to directions regardless of keyboard locale.
  switch (e.code) {
    case "KeyW": console.log("Move up"); break;
    case "KeyA": console.log("Move left"); break;
    case "KeyS": console.log("Move down"); break;
    case "KeyD": console.log("Move right"); break;
  }
});

// -----------------------------------------------------------------------------
// B3. preventDefault and stopPropagation
// -----------------------------------------------------------------------------
// preventDefault()  — cancels the browser's DEFAULT action for the event
//   (e.g. form submission, link navigation, checkbox toggle).
//   The event STILL bubbles up to ancestor listeners.
//
// stopPropagation() — stops the event from bubbling further up the DOM.
//   Ancestor listeners never fire.  Use sparingly — it can hide bugs.
//
// stopImmediatePropagation() — stops bubbling AND prevents other listeners
//   on the SAME element from firing.

const link = document.querySelector<HTMLAnchorElement>("#nav-link");

if (link) {
  link.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();       // Don't navigate to href.
    e.stopPropagation();      // Don't let the document click handler fire.
    console.log("Link interception — handling navigation ourselves.");
  });
}

// =============================================================================
// PART C — Form Handling with TypeScript
// =============================================================================

// -----------------------------------------------------------------------------
// C1. Typing form elements
// -----------------------------------------------------------------------------
// HTMLFormElement   — the <form> itself; has .elements, .submit(), .reset().
// HTMLInputElement  — <input>; has .value, .checked, .type, .validity.
// HTMLSelectElement — <select>; has .value, .selectedIndex, .options.
// HTMLTextAreaElement — <textarea>; has .value, .rows, .cols.
//
// The HTMLFormControlsCollection returned by form.elements is indexed by
// name attribute, but TypeScript types it as Element — cast to the specific
// type to access typed properties.

const registrationForm =
  document.querySelector<HTMLFormElement>("#registration-form");

// -----------------------------------------------------------------------------
// C2. Form submit handler
// -----------------------------------------------------------------------------
// The "submit" event fires when the user clicks the submit button OR presses
// Enter in a text field.  Its default action is to navigate to form.action,
// which reloads (or changes) the page.  Always call preventDefault() for
// single-page-app (SPA) or AJAX form handling.

if (registrationForm) {
  registrationForm.addEventListener("submit", (e: SubmitEvent) => {
    // Stop page navigation — we'll handle submission via fetch instead.
    e.preventDefault();

    // Access individual fields by name through form.elements.
    // The cast is necessary because HTMLFormControlsCollection is typed as
    // returning Element, not the specific input subtype.
    const usernameField = registrationForm.elements.namedItem(
      "username"
    ) as HTMLInputElement;
    const roleSelect = registrationForm.elements.namedItem(
      "role"
    ) as HTMLSelectElement;

    console.log("Username:", usernameField.value);
    console.log("Selected role:", roleSelect.value);
  });
}

// -----------------------------------------------------------------------------
// C3. FormData API with TypeScript
// -----------------------------------------------------------------------------
// FormData serialises an entire <form> into key-value pairs — it handles
// text, files, checkboxes, and multi-select fields automatically.
// Under the hood it uses the name attribute of each control.
//
// FormData is also the correct way to send multipart/form-data (file uploads)
// via fetch without manually building the request body.

function collectFormData(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  const fd = new FormData(form);
  const result: Record<string, FormDataEntryValue> = {};

  // fd.entries() iterates [name, value] pairs.
  // FormDataEntryValue = string | File — TypeScript forces us to acknowledge
  // that file inputs produce File objects, not strings.
  for (const [key, value] of fd.entries()) {
    result[key] = value;
  }
  return result;
}

// Sending the form via fetch (multipart-compatible):
async function submitForm(form: HTMLFormElement): Promise<void> {
  const payload = new FormData(form);
  const response = await fetch("/api/register", {
    method: "POST",
    body: payload, // fetch sets Content-Type: multipart/form-data automatically.
  });
  const json = await response.json();
  console.log("Server response:", json);
}

// -----------------------------------------------------------------------------
// C4. Input change event: e.target as HTMLInputElement
// -----------------------------------------------------------------------------
// The generic "change" event is typed with Event, not InputEvent.
// e.target is EventTarget | null.  EventTarget is the most primitive type —
// it has NO DOM-specific properties at all (not even .id).
// Casting to HTMLInputElement unlocks .value, .checked, .type, .name, etc.
//
// WHY not use `e.currentTarget`?  currentTarget IS already HTMLInputElement
// when you attach the listener directly to an input — but TypeScript still
// types it as EventTarget | null in the base Event interface because the
// same Event object could be dispatched on any EventTarget.

const emailInput = document.querySelector<HTMLInputElement>("#email");

if (emailInput) {
  emailInput.addEventListener("change", (e: Event) => {
    // Cast e.target so we can read .value.
    const input = e.target as HTMLInputElement;
    const email = input.value.trim();
    console.log("Email changed to:", email);
    validateEmail(email, input);
  });

  // "input" fires on EVERY keystroke; "change" fires only on blur/commit.
  // Use "input" for live feedback, "change" for final validation.
  emailInput.addEventListener("input", (e: InputEvent) => {
    // InputEvent already knows .data — the character(s) just inserted.
    console.log("Character typed:", e.data);
  });
}

// -----------------------------------------------------------------------------
// C5. Input validation with TypeScript
// -----------------------------------------------------------------------------
// The browser provides the Constraint Validation API on form controls.
// HTMLInputElement.validity returns a ValidityState object with boolean flags:
//   .valueMissing   — required field is empty.
//   .typeMismatch   — value doesn't match type="email" / type="url" etc.
//   .patternMismatch— doesn't match pattern attribute regex.
//   .rangeUnderflow / .rangeOverflow — outside min / max.
//   .valid          — all constraints pass (shorthand check).
//
// We can ALSO run custom TypeScript validation before/after the browser checks.

function validateEmail(email: string, inputEl: HTMLInputElement): boolean {
  // 1. Use the browser's built-in validity check first — it handles type="email"
  //    rules (RFC 5321 subset) without us writing regex.
  if (!inputEl.validity.valid) {
    displayError(inputEl, inputEl.validationMessage);
    return false;
  }

  // 2. Add custom business rules that the browser can't know about.
  const blockedDomains = ["tempmail.com", "throwaway.io"];
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (blockedDomains.includes(domain)) {
    displayError(inputEl, "Disposable email addresses are not allowed.");
    // setCustomValidity makes the browser treat the field as invalid and
    // show our message in its native error tooltip.
    inputEl.setCustomValidity("Disposable email addresses are not allowed.");
    return false;
  }

  // Clear any previous custom error.
  inputEl.setCustomValidity("");
  clearError(inputEl);
  return true;
}

function displayError(input: HTMLInputElement, message: string): void {
  // Attach an error message to the input's next sibling (a <span> in the HTML).
  const errorSpan = input.nextElementSibling as HTMLSpanElement | null;
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = "block";
  }
}

function clearError(input: HTMLInputElement): void {
  const errorSpan = input.nextElementSibling as HTMLSpanElement | null;
  if (errorSpan) {
    errorSpan.textContent = "";
    errorSpan.style.display = "none";
  }
}

// -----------------------------------------------------------------------------
// C6. Reading form values with proper types
// -----------------------------------------------------------------------------
// Different input types return data differently — TypeScript helps us handle
// each correctly so we don't accidentally pass a string where a number is needed.

interface RegistrationData {
  username: string;
  age: number;             // input type="number" → must parse to number
  rememberMe: boolean;     // input type="checkbox" → .checked, not .value
  country: string;         // <select> → .value
  bio: string;             // <textarea> → .value
}

function readFormValues(form: HTMLFormElement): RegistrationData {
  // Cast each field to the correct HTMLElement subtype so TypeScript gives us
  // the right properties without runtime errors.
  const username = (form.elements.namedItem("username") as HTMLInputElement).value;

  // type="number" inputs still return .value as a STRING.
  // parseInt / parseFloat / Number() converts it — and TypeScript reminds us
  // to do this because the declared type is `number`, not `string`.
  const ageStr = (form.elements.namedItem("age") as HTMLInputElement).value;
  const age = parseInt(ageStr, 10);

  // Checkboxes: use .checked (boolean), NOT .value (which is "on" by default).
  const rememberMe = (
    form.elements.namedItem("rememberMe") as HTMLInputElement
  ).checked;

  const country = (form.elements.namedItem("country") as HTMLSelectElement).value;
  const bio = (form.elements.namedItem("bio") as HTMLTextAreaElement).value;

  return { username, age, rememberMe, country, bio };
}

// =============================================================================
// PART D — Generic Event Handler Patterns
// =============================================================================

// -----------------------------------------------------------------------------
// D1. Typed event handler factory
// -----------------------------------------------------------------------------
// A factory function returns a pre-configured event handler.
// By making it generic over E (constrained to Event), callers get
// the correct event type inside the handler without casting.
//
// WHY a factory?  It lets us inject configuration (like logging level or
// a data-fetching callback) at registration time and keep handler logic clean.

function createClickHandler<E extends MouseEvent>(
  onAction: (e: E, label: string) => void,
  label: string
): (e: E) => void {
  // The returned function closes over `label` and `onAction`.
  // TypeScript infers its type as (e: E) => void — exactly what
  // addEventListener expects.
  return (e: E) => {
    // Centralised pre-processing: logging, analytics, auth guards, etc.
    console.log(`[${new Date().toISOString()}] Event "${label}" fired`);
    onAction(e, label);
  };
}

// Usage: TypeScript infers E = MouseEvent from the addEventListener call site.
const saveButtonHandler = createClickHandler<MouseEvent>(
  (e, label) => {
    console.log(`${label} at (${e.clientX}, ${e.clientY})`);
  },
  "save-button-click"
);

document.querySelector("#save-btn")?.addEventListener("click", saveButtonHandler);

// Later, removal is trivial because we have a named reference:
document.querySelector("#save-btn")?.removeEventListener("click", saveButtonHandler);

// -----------------------------------------------------------------------------
// D2. Typed EventEmitter pattern in TypeScript
// -----------------------------------------------------------------------------
// The browser's CustomEvent works well for DOM-attached events, but sometimes
// we need an event bus that is NOT tied to any DOM node (e.g. service ↔ component
// communication in vanilla TS apps without a framework).
//
// We build a generic EventEmitter using a Map keyed by event name.
// The EventMap generic parameter enforces that:
//   - emit() receives the CORRECT payload type for each event name.
//   - on() callbacks receive the CORRECT payload type automatically.
// This prevents calling emitter.emit("userLoggedIn", { wrongShape: true }).

// EventMap is a record type mapping event-name → payload type.
// Callers define their own map so the emitter is fully typed for their domain.
type EventMap = Record<string, unknown>;

// Listener signature: receives the typed payload, returns void.
type Listener<T> = (payload: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  // Map from event name → array of listener functions.
  // We use `unknown[]` here because different event names have different payload
  // types, and a single Map cannot hold heterogeneous generic types.
  // The public API methods cast safely using the Events generic.
  private listeners: Map<keyof Events, Array<Listener<unknown>>> = new Map();

  // Register a listener for a specific event.
  // K extends keyof Events ensures `event` is a valid event name and
  // TypeScript resolves `Events[K]` to the correct payload type for that name.
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    // Cast: we know this slot holds Listener<Events[K]>, but the Map stores
    // Listener<unknown>[].  This is safe because we only emit Events[K] for
    // event K (enforced by emit()'s signature below).
    this.listeners.get(event)!.push(listener as Listener<unknown>);
  }

  // Remove a previously registered listener.
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(listener as Listener<unknown>);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }

  // Emit an event — TypeScript enforces the payload matches Events[K].
  // Trying to call emit("nonExistentEvent", ...) is a compile-time error.
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const handlers = this.listeners.get(event) ?? [];
    for (const handler of handlers) {
      handler(payload);
    }
  }

  // Register a one-time listener that removes itself after firing once.
  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const wrapper: Listener<Events[K]> = (payload) => {
      listener(payload);
      this.off(event, wrapper); // auto-cleanup after first call
    };
    this.on(event, wrapper);
  }
}

// --- Concrete usage ---

// Define the application's event contract.
interface AppEvents extends EventMap {
  "user:login":   { userId: string; role: "admin" | "user" };
  "user:logout":  { userId: string };
  "cart:add":     { productId: string; quantity: number };
  "cart:clear":   undefined;
}

const appEmitter = new TypedEventEmitter<AppEvents>();

// TypeScript infers `payload` as { userId: string; role: "admin" | "user" }.
appEmitter.on("user:login", (payload) => {
  console.log(`User ${payload.userId} logged in as ${payload.role}`);
});

// One-time listener — fires once then automatically removes itself.
appEmitter.once("user:logout", (payload) => {
  console.log(`User ${payload.userId} logged out (one-time handler)`);
});

// Compile-time safety: wrong payload shape → TypeScript error.
// appEmitter.emit("user:login", { userId: "x" }); // ← ERROR: missing `role`

appEmitter.emit("user:login", { userId: "u-123", role: "admin" });
appEmitter.emit("user:logout", { userId: "u-123" });
appEmitter.emit("cart:add", { productId: "SKU-99", quantity: 2 });
// cart:clear has payload `undefined` — no second arg needed.
appEmitter.emit("cart:clear", undefined);

// =============================================================================
// Summary of key TypeScript DOM patterns
// =============================================================================
//
//  Pattern                       | How TypeScript helps
// ───────────────────────────────┼──────────────────────────────────────────────
//  addEventListener("click", e)  | Infers MouseEvent from the event-name string
//  querySelector<T>(sel)         | Returns T | null — forces null-check
//  e.target as HTMLInputElement  | Narrows EventTarget to typed DOM element
//  CustomEvent<T>                | Typed .detail payload across DOM boundaries
//  TypedEventEmitter<Events>     | Enforces payload shapes at compile time
//  form.elements.namedItem(name) | Returns Element — cast to concrete type
//  inputEl.validity              | ValidityState with boolean constraint flags
//  FormData.entries()            | Yields [string, FormDataEntryValue] pairs
// =============================================================================
