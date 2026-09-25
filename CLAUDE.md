# Working in this repository

This is the LexiQamus (BuildLQ) frontend mock. The development team will
move these pages into their Rails app, so every change must follow their
conventions.

## Before any UI work

1. Read `docs/frontend-development-instructions.md` in full and follow it.
2. Use `pages/home.html`, `css/home.css` and
   `js/controllers/home_controller.js` as the worked example of the
   required patterns. It is the main search page and it exercises all of
   them.
3. Before reporting a feature as done, run the review in
   `docs/frontend-review-prompt.md` against your own changes and fix every
   ❌ and ⚠️ item.

## Hard rules

- Bootstrap 5, Stimulus, jQuery and Feather only. No Tailwind, React, Vue,
  SCSS or new icon libraries.
- One HTML page, one CSS file and one Stimulus controller per feature.
  No large `<style>` or `<script>` blocks inside HTML.
- Feature CSS is scoped under `.<feature>-surface`.
- Class, ID, function and variable names and all code comments are in
  English, also in Turkish-language pages.
- Text direction uses `data-direction="rtl|ltr"`, never a hardcoded class.
- Admin/staff-only UI is wrapped in `.admin-only`.
- Only touch files the feature needs.
- Turkish copy goes in `js/translations.js` against a `data-i18n` key; the
  English text stays inline in the HTML. Never add a second page per
  language.
- Libraries are the local copies in `vendor/`, not CDN URLs, so the pages
  open offline.

## Reference

The old mock in https://github.com/muhammethabib/lq-frontend-mock is the
visual and text reference. Do not copy its Tailwind markup; rebuild the
same look with the patterns above.

## Language

The repository owner communicates in Turkish. Reply in Turkish; keep code,
names and comments in English.

Anything written for the development team is English: tickets, issue and
pull request text, video and demo scripts, release notes. The interface's
own Turkish copy still lives in `js/translations.js`.
