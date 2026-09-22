# BuildLQ Frontend Development Instructions

## Context

You are building frontend UI for **BuildLQ**, an existing web application. You don't need Rails/Ruby, ERB, or any backend setup — just build with **plain HTML, CSS, and JavaScript**. Our engineering team will later wire your HTML/CSS/JS into our Rails backend, so keeping things clean, simple, and well-organized (as described below) makes that step fast and error-free.

If something isn't clearly covered in this document, don't stop and wait for an answer — use the closest matching pattern shown here, keep your solution simple, and add a short comment in the code explaining what you decided and why. Our team will review it during integration.

## Tech Stack

- Plain **HTML** pages (no templating language required)
- Plain **CSS** (no SCSS/Sass needed)
- **JavaScript**, organized using a "Stimulus-style" pattern (explained below) for most dynamic behavior
- **jQuery** for AJAX/dynamic data calls (this is what we mostly use — not `fetch`)
- **Bootstrap 5** for layout, components, and styling — include it via CDN for your preview

Don't Use Tailwind, React, Vue, Angular, or any other heavy framework — they don't fit our existing stack and make integration harder.

## Folder Structure (suggested)

```
/pages/*.html                          → your HTML pages
/css/<feature>.css                     → one CSS file per feature
/js/controllers/<feature>_controller.js → one JS file per behavior/feature
```
You don't need to match our internal project structure exactly — just keep one file per feature/behavior so it's easy for us to move things into our project later.

---

## Core Rules

### 1. Page structure
Wrap each page/feature in one root `<div>` with a Bootstrap class plus one custom class, and connect your JS to it:
```html
<div class="container-fluid p-4 my-feature-surface" data-controller="my-feature">
  ...
</div>
```
All of that feature's CSS should be scoped under `.my-feature-surface`.

### 2. Use a "Stimulus-style" pattern for most dynamic behavior
For most interactive behavior, avoid `onclick="..."` scattered everywhere and instead use a small, reusable JS controller pattern. You can load a lightweight library called **Stimulus** directly via CDN (no build tools, no Rails needed):

```html
<script src="https://cdn.jsdelivr.net/npm/stimulus@3/dist/stimulus.umd.min.js"></script>
<script>
  const application = Stimulus.Application.start();
</script>
```

Then write a controller like this:
```javascript
// js/controllers/my_feature_controller.js
class MyFeatureController extends Stimulus.Controller {
  static targets = ["input", "button"]
  static values = { message: String }

  connect() {
    // runs automatically when this element appears on the page
  }

  handleClick() {
    // runs when the button below is clicked
  }
}
application.register("my-feature", MyFeatureController)
```
```html
<button data-my-feature-target="button" data-action="click->my-feature#handleClick">Go</button>
```

- File name: `snake_case_controller.js` → matching `data-controller` value: `kebab-case` (e.g. `my_feature_controller.js` → `data-controller="my-feature"`).
- It's fine to use plain JavaScript (`addEventListener`, etc.) for very small, one-off bits — this pattern is for anything with real interactivity (toggles, tabs, dropdowns, popups, forms).

### 3. Passing data into JavaScript
Use `data-*` attributes to hand information to your JS — don't hide data inside random `<script>` blocks:
```html
<div data-controller="my-feature" data-my-feature-message-value="Hello">
```
```javascript
static values = { message: String }  // → this.messageValue
```

### 4. Bootstrap components
Use Bootstrap 5 attributes for tabs, dropdowns, and modals:
```html
<!-- Tab -->
<button data-bs-toggle="tab" data-bs-target="#pane1" role="tab">Tab</button>

<!-- Dropdown -->
<button data-bs-toggle="dropdown" data-bs-auto-close="outside">Filter</button>

<!-- Modal close -->
<button data-bs-dismiss="modal" aria-label="Close"></button>
```
Standard classes: `btn btn-primary`, `form-control`, `form-select`, `form-check`, `table table-light`.

### 5. Modals with dynamic content
Don't build a modal as an `<iframe>` loading a whole separate HTML page. Instead:
1. Keep an empty modal container on the page.
2. Keep the modal's actual content in a `<template>` tag (or a separate small HTML snippet).
3. Use JavaScript to copy that content into the empty container and show it with Bootstrap's JS:

```html
<div id="myModal" class="modal"></div>

<template id="myModalTemplate">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">...</div>
    </div>
  </div>
</template>
```
```javascript
function openMyModal() {
  const modalEl = document.getElementById('myModal');
  modalEl.innerHTML = document.getElementById('myModalTemplate').innerHTML;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}
```
This keeps the modal content clean and reusable — later, this `<template>` content becomes a real server-rendered snippet on our end, no extra work needed from you.

After showing new content this way, re-run icon rendering (see next section) and re-initialize any tooltips inside it.

### 6. Icons
Use Feather icons for standard icons:
```html
<i data-feather="search"></i>
```
(Load Feather via CDN, then call `feather.replace();` once your page loads, and again any time you add new HTML dynamically.) Use inline `<svg>` only for icons Feather doesn't have. Don't introduce a new icon library.

### 7. CSS
- One CSS file per feature (e.g. `search-results.css`), linked with a normal tag:
```html
<link rel="stylesheet" href="css/search-results.css">
```
- Scope everything in that file under the feature's root class:
```css
.my-feature-surface {
  --my-feature-radius: 12px; /* use CSS variables for values you may need to tweak */
}
.my-feature-surface .result-card {
  border-radius: var(--my-feature-radius);
}
```
- Use clear, kebab-case class names — no Tailwind utility classes.
- Use plain `@media (max-width: ...)` queries for responsiveness.

### 8. The `js-` class prefix
Use a `js-` prefixed class only on elements that need to be found by plain JavaScript (not through a Stimulus target) — e.g. a shared scroll listener. Never write CSS rules against a `js-*` class:
```html
<div class="js-my-panel my-feature-panel" data-controller="my-feature">
```

### 9. Text content
Just write your text directly in the HTML, in English (and Turkish too, if you have the translated copy ready).

### 10. Dynamic data / AJAX (jQuery style)
For anything that would normally load or send data to a server, use jQuery's `$.ajax`, with a URL written in the same style our Rails routes use — `/controller_name/action_name`:

```html
<button data-action="click->search-results#loadMore">Load More</button>
```
```javascript
loadMore() {
  $.ajax({
    url: '/search_output/load_more',   // controller/action style — matches our Rails routes
    type: 'GET',
    data: { page: 2 },
    success: function(response) {
      // update the page with the response
    }
  });
}
```
Since you won't have a real backend, it's fine to fake the response with sample data instead of making a real network call — just keep the code structured as if it were calling a real endpoint like this, so we know exactly what backend route to build.

### 11. Handle real content variations
Your sample/placeholder content is rarely what real data looks like. Make sure your layout doesn't break with:
- Very long text vs. very short text
- Single-line vs. multi-line content
- Bold/highlighted text mixed with normal text
- Empty or missing values

Test your CSS with a few different content lengths, not just your one sample example.

### 12. Design for different user roles
BuildLQ has different types of users — **Admin**, **Staff**, and regular **Users** — and they don't all see the same things. When designing a page, think about which parts should only be visible to admins/staff (e.g. edit or delete buttons, admin-only panels). Mark these clearly, e.g.:
```html
<div class="admin-only">...</div>
```
so our team knows exactly what to restrict when we add real permission checks.

### 13. Script and stylesheet organization
Try to keep your `<script>` and `<link>` tags organized in one place per page (e.g. together near the top) rather than scattering them randomly throughout the file. This isn't a hard rule — just makes your pages easier to read and integrate.

### 14. Naming
Use clear, descriptive, **English** names for every class, ID, JavaScript function, and variable — the name should describe what it actually does or represents:
- ✅ `search-result-card`, `handleDictionaryToggle`, `dictionaryDropdown`
- ❌ `card2`, `doStuff`, `div1`, `myFunc`

### 15. Comments
Add short, simple comments to explain anything that isn't immediately obvious — a tricky CSS layout trick, a bit of non-trivial JS logic, or why you made a particular design choice. Keep comments in plain, easy English so our team can quickly understand your intent.

### 16. Responsive UI
Make sure Ui should be responsive for major categories of screen sizes.

---

## DO

- Build most dynamic behavior using the Stimulus-style controller pattern shown above.
- Pass data into JS using `data-*` attributes.
- Use Bootstrap 5 (`data-bs-*`) for tabs, dropdowns, and modals.
- Keep each feature's CSS in one file, scoped under that feature's root class.
- Write clear text directly in English (and Turkish, if available).
- Use jQuery `$.ajax` with a `controller/action`-style URL for anything dynamic.
- Re-run `feather.replace()` and re-init tooltips after adding new HTML dynamically.
- Test your layout with different content lengths (short/long/multi-line/bold).
- Clearly mark admin/staff-only sections.
- Use clear, descriptive, English names for everything.
- Add short comments for anything non-obvious.
- Responsive ui across screen sizes.

## DON'T

- Don't mix HTML, CSS, and JS in one file, except for very small, one-off cases.
- Don't use Tailwind, React, Vue, or other frameworks not listed above.
- Don't build a modal as an `<iframe>` with its own separate full HTML page.
- Don't hardcode text direction (RTL/LTR) for Ottoman/Latin content — use a data attribute or class so it can be driven by real data later, e.g. `data-direction="rtl"`.
- Don't invent a completely new pattern when one of the above already solves the problem — pick the closest match and add a short comment explaining your choice.

---

## Before Handoff — Checklist

- [ ] HTML, CSS, and JS are kept in separate files (except very small, justified exceptions)
- [ ] Most dynamic behavior uses the Stimulus-style controller pattern with `data-action`/`data-*-target`
- [ ] Data passed into JS uses `data-*` attributes
- [ ] Bootstrap 5 (`data-bs-*`) used for tabs/dropdowns/modals
- [ ] CSS is organized in one file per feature, scoped under a root class
- [ ] Text is written clearly (English + Turkish where available); any language-specific text is noted in handoff notes
- [ ] Icons/tooltips are re-initialized after any dynamic HTML changes
- [ ] Dynamic data interactions use jQuery `$.ajax` with `controller/action`-style URLs
- [ ] RTL/Latin-Ottoman handling uses a data attribute/class, not hardcoded assumptions
- [ ] Result lists use `<table>` markup where reasonable
- [ ] Layout tested against varying content lengths (short, long, single-line, multi-line, bold)
- [ ] Admin/staff-only sections are clearly marked
- [ ] Class/ID/function/variable names are clear, descriptive, and in English
- [ ] Complex or non-obvious code has short explanatory comments
- [ ] Any place you made a judgment call is explained with a short comment in the code
