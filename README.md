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
- **Bootstrap 5** for layout, components and the offcanvas menu
- **Stimulus 3** for interactive behaviour
- **jQuery** for the data calls
- **Feather** icons

All four are served from local copies in `vendor/`, at the versions the
instructions name, so the pages open offline. See `vendor/README.md`.

No Tailwind, no React/Vue, no SCSS.

## Folder structure

```
index.html                            forwards to the first page
pages/<feature>.html                  one HTML page per feature
css/base.css                          brand tokens, fonts, shared chrome (menu, language switch)
css/<feature>.css                     one CSS file per feature, scoped under .<feature>-surface
css/ottoman-keyboard.css              the on-screen keyboard, shared by any field
js/app.js                             starts Stimulus, runs feather.replace() and tooltip init
js/controllers/<feature>_controller.js one Stimulus controller per behaviour
js/page_chrome.js                     the top bar and side menu, written once
js/translations.js                    Turkish strings, keyed by data-i18n
js/keyboard_layout.js                 the Ottoman keyboard's keys, and the
                                      Latin-to-Ottoman map for physical typing
js/sample_data.js                     stand-in for the search endpoint
js/decoder_sample_data.js             stand-in for the decoder endpoint
assets/                               logo and static images
vendor/                               local copies of Bootstrap, jQuery, Stimulus, Feather
docs/                                 the dev team's instructions and review prompt
```

## What is built

| Page | File | State |
| --- | --- | --- |
| Main page (search) | `pages/home.html` | Built |
| Word Decoder | `pages/home.html`, decoder tab | Built |
| About | `pages/about.html` | Built |
| Team | `pages/team.html` | Built |
| What is LexiQamus? | `pages/what-is-lexiqamus.html` | Built |
| Institutional Subscribers | `pages/institutional.html` | Built |
| Pricing | `pages/pricing.html` | Built |
| LexiQamus 1.0 | `pages/lq1.html` | Built |
| User Guide | `pages/user-guide.html` | Built |
| Version 3.0: What's New | `pages/lq3-whats-new.html` | Built |
| History of Suggestions and Corrections | `pages/suggestions-history.html` | Built |
| Dictionary Digitization and Data Model | `pages/data-model.html` | Built |
| Lexicon Digitization Project | `pages/lexicon-digitization.html` | Built |
| Version 2.0: What's New | `pages/lq2-whats-new.html` | Built |

Every menu entry now leads to a page. The sign-up screen and the dictionary
entry window are the two pieces still to build.

A menu entry only becomes a link once its page exists. `js/page_chrome.js`
lists the built ones in `window.LQ_BUILT_PAGES`; an entry not on that list
stays marked "soon" and is not clickable.

## Endpoints the backend will need

| Route | Used by | Parameters |
| --- | --- | --- |
| `GET /search_output/results` | Search tab | `q`, `script`, `source`, `categories[]`, `groups[]`, `dictionaries[]` |
| `GET /word_decoder/results` | Word Decoder tab | `pattern` (JSON), `q` (readable form), `expand` |

The decoder's `pattern` is an object with `slots` and `joins`. A slot is one
letter position and names its kind: a `letter`, a set of `alternatives`, a
`rasm` (the skeleton shape with the dots unclear, plus the letters it stands
for), or the wildcards `any` and `many`. `joins` carries one entry per gap
between two slots, `separate`, `connected` or `uncertain`, recording how the
letters are written. Both files documenting the response shape are listed
above.

Every interface string has a `data-i18n` key and its Turkish equivalent in
`js/translations.js`. Text that a controller writes itself is translated
through `window.LQ.translate`, and re-rendered when the language changes.

`pages/home.html` is the worked example of every convention below: the root
container, the Stimulus controller, Bootstrap dropdowns and offcanvas, the
jQuery call shape, `data-direction` for Ottoman text and `admin-only` for
staff controls.

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

then visit `http://localhost:8000/`.

The live preview of the current state is at
https://muhammethabib.github.io/lq-frontend/
