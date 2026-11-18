/* =====================================================
   LAB 3 — Workflow Bypass (CWE-841)
   Owner: TODO

   LOGIC CONTRACT (what this file must do)
   -----------------------------------------------------
   Scenario: checkout with 4 steps: cart -> shipping -> payment -> confirm.
   Each payload is a list of "requests" the visitor's browser sends,
   in order. The server holds an order state.
   Prices: 1 item = $10. No real data.

   Valid transitions (the fixed server enforces this table):
     cart     -> shipping
     shipping -> payment
     payment  -> confirm      (only if paid)
     cart is LOCKED once state = payment or later

   Payloads (data-payload in lab3.html):
     normal     cart(1 item) -> shipping -> payment($10) -> confirm
     skip       cart -> confirm                      (never paid)
     backtrack  cart(1 item) -> shipping -> payment($10)
                -> cart-edit (change to 5 items) -> confirm

   VULNERABLE (each endpoint trusts that the previous step happened):
     normal    -> order confirmed, paid $10, total $10
     skip      -> order confirmed, paid $0                <-- payment bypassed
     backtrack -> order confirmed, paid $10, total $50    <-- paid for 1, got 5

   FIXED (server-side state machine):
     normal    -> order confirmed (same as before, nothing breaks)
     skip      -> blocked at confirm: "403: payment required (state = cart)"
     backtrack -> blocked at cart-edit: "403: cart is locked after payment"

   RENDER (ids are in lab3.html):
     #wf-steps .step[data-step]  -> add class "visited" | "skipped" | "current"
     #wf-request #wf-state #wf-paid #wf-total -> text for the last request
     setStatus("danger"|"success", "...") and #sim-explanation
   ===================================================== */

const PRICE = 10;

const PAYLOADS = {
  normal:    { path: ["cart", "shipping", "payment", "confirm"], items: 1, editedItems: 1 },
  skip:      { path: ["cart", "confirm"],                         items: 1, editedItems: 1 },
  backtrack: { path: ["cart", "shipping", "payment", "cart-edit", "confirm"], items: 1, editedItems: 5 }
};

/* Pure function, no DOM. Walk the path and apply the rules of `mode`.
   TODO: implement. Suggested return shape:
     {
       steps: [ { request: "confirm", stateBefore: "cart", allowed: true, reason: "" }, ... ],
       orderCreated: boolean,
       paid: number,        // dollars actually paid
       total: number,       // dollars the order is worth
       stoppedAt: string | null   // request name where the fixed server refused
     }                                                                          */
function simulate(payload, mode /* "vulnerable" | "fixed" */) {
  return { steps: [], orderCreated: false, paid: 0, total: 0, stoppedAt: null };
}

/* TODO (Vulnerable): call simulate(), return { blocked, message, data }.
   blocked is false when the order was created without a full payment. */
function vulnerableVersion(payload) {
  return {
    blocked: false,
    resultClass: "todo",
    message: "TODO: implement vulnerableVersion() in assets/js/lab3.js",
    data: { payload, result: simulate(PAYLOADS[payload], "vulnerable") }
  };
}

/* TODO (Fixed): same, with the state machine from the contract. */
function fixedVersion(payload) {
  return {
    blocked: true,
    resultClass: "todo",
    message: "TODO: implement fixedVersion() in assets/js/lab3.js",
    data: { payload, result: simulate(PAYLOADS[payload], "fixed") }
  };
}

function resetSimulation() {
  document.querySelectorAll("#wf-steps .step").forEach(s => (s.className = "step"));
  ["wf-request", "wf-state", "wf-paid", "wf-total"].forEach(id => ($(id).textContent = "—"));
  setStatus("", "Waiting for a payload...");
  $("sim-explanation").textContent = "Press a payload to see how the application handles it.";
}

/* TODO: draw the outcome from data.result.
   - mark each visited step, mark steps that were jumped over as "skipped"
   - fill #wf-request / #wf-state / #wf-paid / #wf-total
   - setStatus("danger" | "success", "...") and #sim-explanation              */
function updateSimulation(data, mode /*, payload, outcome */) {
  resetSimulation();
  // TODO
}

initLab({
  vulnerable: vulnerableVersion,
  fixed: fixedVersion,
  render: updateSimulation,
  reset: resetSimulation,
  descriptions: {
    vulnerable: "Vulnerable: every step trusts that the previous step already happened.",
    fixed: "Fixed: the server keeps the order state and allows only valid transitions."
  }
});
