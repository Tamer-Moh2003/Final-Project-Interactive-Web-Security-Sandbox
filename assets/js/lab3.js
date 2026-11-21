/* Lab 3: simulated checkout requests; no real payment or order is made. */
const PRICE = 10;
const PAYLOADS = {
  normal: ["cart", "shipping", "payment", "confirm"],
  skip: ["cart", "confirm"],
  backtrack: ["cart", "shipping", "payment", "cart-edit", "confirm"]
};

function simulate(path, mode) {
  let state = "cart", total = PRICE, paid = 0, orderCreated = false, stoppedAt = null;
  const steps = [];
  for (const request of path) {
    let reason = "";
    if (mode === "fixed") {
      if (request === "shipping" && state !== "cart") reason = "Invalid checkout state.";
      if (request === "payment" && state !== "shipping") reason = "Shipping is required before payment.";
      if (request === "cart-edit" && state !== "cart" && state !== "shipping") reason = "Cart is locked after payment.";
      if (request === "confirm" && (state !== "payment" || paid !== total)) reason = "Payment for the current cart is required.";
    }
    steps.push({ request, allowed: !reason, reason });
    if (reason) { stoppedAt = request; break; }
    if (request === "shipping") state = "shipping";
    if (request === "payment") { state = "payment"; paid = total; }
    if (request === "cart-edit") total = 5 * PRICE;
    if (request === "confirm") { state = "confirmed"; orderCreated = true; }
  }
  return { steps, state, total, paid, orderCreated, stoppedAt };
}

function runPayload(payload, mode) {
  const result = simulate(PAYLOADS[payload], mode);
  const attack = result.orderCreated && result.paid < result.total;
  let message;
  if (result.stoppedAt) message = "Blocked: " + result.steps[result.steps.length - 1].reason;
  else if (attack) message = `Attack succeeded: order confirmed for $${result.total} with only $${result.paid} paid.`;
  else message = `Order confirmed normally: $${result.paid} paid for a $${result.total} order.`;
  return { blocked: !attack, resultClass: attack ? "hacked" : "blocked", message, data: { result } };
}
function vulnerableVersion(payload) { return runPayload(payload, "vulnerable"); }
function fixedVersion(payload) { return runPayload(payload, "fixed"); }

function resetSimulation() {
  document.querySelectorAll("#wf-steps .step").forEach(step => step.className = "step");
  ["wf-request", "wf-state", "wf-paid", "wf-total"].forEach(id => $(id).textContent = "—");
  setStatus("", "Waiting for a payload...");
  $("sim-explanation").textContent = "Press a payload to see how the application handles it.";
}
function updateSimulation(data) {
  resetSimulation();
  const result = data.result;
  const visited = new Set(result.steps.filter(step => step.allowed).map(step => step.request));
  const order = ["cart", "shipping", "payment", "confirm"];
  const last = result.steps[result.steps.length - 1];
  document.querySelectorAll("#wf-steps .step").forEach(element => {
    const name = element.dataset.step;
    if (visited.has(name)) element.classList.add("visited");
    else if (visited.has("confirm") && order.indexOf(name) < 3) element.classList.add("skipped");
    if (last.allowed && name === last.request) element.classList.add("current");
  });
  $("wf-request").textContent = "/" + last.request;
  $("wf-state").textContent = result.state;
  $("wf-paid").textContent = "$" + result.paid;
  $("wf-total").textContent = "$" + result.total;
  const attack = result.orderCreated && result.paid < result.total;
  setStatus(attack ? "danger" : "success", result.stoppedAt ? "Request blocked" : attack ? "Order confirmed without full payment" : "Order confirmed");
  $("sim-explanation").textContent = result.stoppedAt ? last.reason : attack ? "The server accepted an invalid checkout workflow." : "The checkout steps were completed in order.";
}
initLab({
  vulnerable: vulnerableVersion,
  fixed: fixedVersion,
  render: updateSimulation,
  reset: resetSimulation,
  descriptions: {
    vulnerable: "Vulnerable: endpoints trust that earlier steps were completed.",
    fixed: "Fixed: the server checks the checkout state and locks the cart after payment."
  }
});
