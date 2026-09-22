// js/view_states.js
// The states the view switcher offers, in the reference mock's own order.
//
// These are the six screens the main page can be in, not a list of the
// site's pages: the side menu is how a reader moves between pages. The
// switcher is for reviewing, so it puts each screen one click away instead
// of making it be reached by searching.
//
// This file, js/controllers/view_switcher_controller.js and css/view-switcher.css
// come out at integration; nothing else refers to them.

window.LQ_VIEW_STATES = [
  { state: "home", key: "viewHome", label: "Home" },
  { state: "new-visitor", key: "viewNewVisitor", label: "Home – New Visitor" },
  { state: "no-results", key: "viewNoResults", label: "No Results" },
  { state: "results", key: "viewResults", label: "Results" },
  { state: "popup", key: "viewPopup", label: "Popup" },
  { state: "redhouse", key: "viewRedhouse", label: "Redhouse" }
];
