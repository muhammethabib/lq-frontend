# LexiQamus Frontend

Frontend mock for **LexiQamus** (internal name: BuildLQ), rebuilt to the
development team's conventions so pages can be moved into the Rails app
with minimal adaptation.

The previous mock lives in
[`lq-frontend-mock`](https://github.com/muhammethabib/lq-frontend-mock) and
stays as the visual/text reference. Nothing is copied from it verbatim;
each feature is rebuilt here following `docs/`.

## Stack

- Plain HTML, CSS and JavaScript, no build step
- **Bootstrap 5** for layout and components (CDN)
- **Stimulus 3** for interactive behaviour (CDN)
- **jQuery** for AJAX-style data calls (CDN)
- **Feather** icons (CDN)

No Tailwind, no React/Vue, no SCSS.

## Folder structure

```
pages/<feature>.html                  one HTML page per feature
css/base.css                          brand tokens, fonts, shared page chrome
css/<feature>.css                     one CSS file per feature, scoped under .<feature>-surface
js/app.js                             starts Stimulus, runs feather.replace() and tooltip init
js/controllers/<feature>_controller.js one Stimulus controller per behaviour
assets/                               logo and static images
docs/                                 the dev team's instructions and review prompt
```

## Conventions (short version)

Full rules are in `docs/frontend-development-instructions.md`. The
essentials:

1. Every feature is wrapped in one root element:
   `<div class="container-fluid p-4 <feature>-surface" data-controller="<feature>">`
2. All CSS for that feature lives in `css/<feature>.css` and is scoped
   under `.<feature>-surface`.
3. Interactivity goes through a Stimulus controller in
   `js/controllers/<feature>_controller.js` using `data-action`,
   `data-<feature>-target` and `data-<feature>-*-value`.
4. Tabs, dropdowns and modals use Bootstrap `data-bs-*` attributes. Modal
   content lives in a `<template>` and is copied into an empty
   `<div class="modal">` container.
5. Server calls use `$.ajax` with a `/controller_name/action_name` URL and
   a faked response until the backend exists.
6. Text direction for Ottoman/Latin content is driven by
   `data-direction="rtl|ltr"`, never hardcoded.
7. Admin/staff-only UI is marked with the `admin-only` class.
8. Names and comments are in English, also in Turkish-language pages.

## Working with the AI agent

- Start a new feature by giving the agent
  `docs/frontend-development-instructions.md` together with the request.
- Before handoff, run `docs/frontend-review-prompt.md` on the change and
  fix anything marked ❌ or ⚠️. The dev team runs the same review on their
  side.

## Preview

Open any file in `pages/` directly in a browser, or serve the repo root:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000/pages/search.html`.
