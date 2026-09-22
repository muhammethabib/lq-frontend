# BuildLQ Frontend Implementation — Review Prompt

## Purpose

You previously implemented a feature based on the "BuildLQ Frontend Development Instructions." Now perform a **compliance review** of that implementation against those instructions.

This is not a "does it work" review — a feature can run fine and still fail this review if it doesn't follow the required conventions.

## How to Perform This Review

1. Identify the files you created or modified **for this specific feature** (use your change list/diff — don't re-scan the whole project). Read each relevant file **once**, and evaluate all checklist items below against that single reading — don't reopen the same file repeatedly per item, to keep the review efficient.
2. For each checklist item, mark one status:
   - ✅ Compliant
   - ⚠️ Partially compliant
   - ❌ Non-compliant
   - ➖ Not applicable (say why, briefly)
3. In the **Summary Table**, the symbol alone is enough for ✅/➖ items — no explanation needed. For ⚠️/❌ items, one short phrase is enough in the table (e.g. "missing CSRF comment"); save full detail for the **Critical/Minor Issues** sections further down — don't repeat long explanations twice.
4. Don't mark something ✅ purely from memory or assumption — base it on what you actually see in the code. If you're unsure after checking, mark it ⚠️ rather than guessing ✅.

---

## Review Checklist

### A. File Separation
- [ ] HTML, CSS, and JS are in separate files (except small, justified exceptions)
- [ ] No large `<style>`/`<script>` blocks buried inside HTML pages

### B. Stimulus-Style JS
- [ ] Most dynamic/interactive behavior uses the controller pattern (targets, values, `data-action`)
- [ ] No `onclick=`/inline event-handler attributes used for anything beyond very small cases
- [ ] Controller file names are `snake_case_controller.js`, matching kebab-case `data-controller` values
- [ ] `static targets`/`static values` used instead of manual DOM queries where appropriate

### C. Data Flow
- [ ] Data passed to JS uses `data-*` attributes, not values buried in inline scripts

### D. Bootstrap Usage
- [ ] Tabs/dropdowns/modals use Bootstrap 5 `data-bs-*` attributes
- [ ] Standard Bootstrap classes used for buttons/forms/tables

### E. Modal Pattern
- [ ] Modals use the empty-container + `<template>` + `bootstrap.Modal` pattern
- [ ] No modal built as an iframe with a separate full HTML document
- [ ] Icons/tooltips re-initialized after dynamic content injection

### F. Icons
- [ ] Feather icons used for standard icons; no new icon library introduced

### G. CSS
- [ ] One CSS file per feature, scoped under a root class
- [ ] Kebab-case class names, no Tailwind utility classes
- [ ] Plain `@media` queries used for responsiveness

### H. `js-` Prefix
- [ ] `js-` classes used only for plain-JS DOM hooks, never styled, never replacing a proper Stimulus target

### I. Text Content
- [ ] Text is written directly and clearly; no duplicate full page/template per language
- [ ] Any language-specific text noted in handoff notes

### J. AJAX
- [ ] Dynamic data interactions use jQuery `$.ajax` with `controller/action`-style URLs
- [ ] Sample/mock data used sensibly where no real backend exists

### K. RTL / Multi-Script Handling (if applicable)
- [ ] Text direction driven by a data attribute/class, not hardcoded

### L. Result Lists
- [ ] Tabular data uses `<table>` markup where reasonable

### M. Content Variation & Robustness
- [ ] Layout tested/considered for long/short, single-line/multi-line, and bold content

### N. User Roles
- [ ] Admin/staff-only sections clearly marked

### O. Naming & Comments
- [ ] Class/ID/function/variable names are clear, descriptive, and in English
- [ ] Non-obvious or complex code has short explanatory comments in english.
- [ ] Names and comments should not in the turkish, it should be in enlgish even in turkish trnaslated file.

### P. Scope Discipline
- [ ] No unrelated files changed beyond what the feature required
- [ ] No new architectural pattern introduced where an existing one already applied
- [ ] Any judgment call made where instructions were unclear is explained with a code comment

### Q. Responsive
- [ ] Test UI on different screen sizes, it should be responsive for every screen size.

---

## Final Review Report Format

### 1. Summary Table
List every checklist item with its status symbol (and a short phrase for ⚠️/❌ only).

### 2. Critical Issues (❌)
For each: what was done, what was required, and the fix needed.

### 3. Minor Issues (⚠️)
Same format, for partial-compliance items.

### 4. Missing Items
Anything required that wasn't implemented at all.

### 5. Unnecessary Changes / Assumptions
Anything added or changed beyond what was needed, or any undocumented judgment call.

### 6. Overall Verdict
- **Ready for handoff** — fully compliant
- **Ready with minor fixes** — list them
- **Not ready** — list the critical issues to resolve first

---

## Important

- Base every status on what you actually see in the code, not on intention or memory.
- Keep the report focused — full explanations only where truly needed (Critical/Minor sections), symbols elsewhere.
