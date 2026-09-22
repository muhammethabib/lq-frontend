// js/pricing_sample.js
// Stand-in for the pricing endpoint.
//
//   GET /pricing/plans
//
// A term is a number of months. A plan gives, for each term, what the whole
// term costs and how much that saves against paying by the month; the saving
// is given rather than worked out, because the sales page rounds it its own
// way. Free has no prices: it is free by the month whatever term is chosen.

window.LQ_PRICING_SAMPLE = {
  currency: "TL",
  terms: [1, 3, 6, 12],
  plans: {
    standard: {
      1: { total: 1500, saving: 0 },
      3: { total: 3000, saving: 33 },
      6: { total: 5250, saving: 42 },
      12: { total: 8400, saving: 53 }
    },
    premium: {
      1: { total: 2250, saving: 0 },
      3: { total: 4350, saving: 36 },
      6: { total: 7500, saving: 44 },
      12: { total: 12750, saving: 53 }
    }
  }
};
