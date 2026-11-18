/* =====================================================
   LAB 2 — Race Condition (CWE-362)        [the team's CHALLENGE lab]
   Owner: TODO

   LOGIC CONTRACT (what this file must do)
   -----------------------------------------------------
   Scenario: a single-use coupon (uses_left = 1) on trusted-site.test.
   Each "request" runs 4 steps: READ uses_left -> CHECK > 0 ->
   WRITE uses_left - 1 -> GRANT discount.
   The simulation is deterministic: no real network, no randomness.
   "At the same time" = every request does its READ before any request
   does its WRITE (the gap between CHECK and WRITE is the bug).

   Payloads (data-payload in lab2.html):
     one   1 request
     two   2 requests at once
     ten   10 requests at once

   VULNERABLE (check-then-act, not atomic):
     one -> granted 1                      (looks fine)
     two -> granted 2, uses_left ends 0    <-- coupon used twice
     ten -> granted 10                     <-- coupon used ten times

   FIXED (check + update are one atomic step, or a lock):
     one -> granted 1
     two -> granted 1, second request refused ("coupon already used")
     ten -> granted 1, nine refused

   RENDER (ids are in lab2.html):
     #state-uses #state-granted #state-lock  -> shared state numbers
     #lanes + <template id="lane-template">  -> one lane per request
        each <li data-step="lock|read|check|write|grant"> gets class
        "active" (running) | "done" (ok) | "bad" (this step caused the bug / was refused)
     setStatus("danger"|"success", "...") and #sim-explanation

   ANIMATION RULE: render() may animate with sleep(). Because the visitor can
   press another payload or switch version mid-animation, keep a run token
   (see `runId` below) and stop old animations when the token changes.
   ===================================================== */

const PAYLOADS = {
  one: { requests: 1 },
  two: { requests: 2 },
  ten: { requests: 10 }
};

let runId = 0; // increment on every render() / reset(); old animations check it and stop

/* Pure function, no DOM. Returns the final numbers and the ordered events
   the animation will play.
   TODO: implement. Suggested return shape:
     {
       granted: number,
       usesLeftFinal: number,
       refused: number,
       events: [ { request: 0, step: "read", ok: true }, ... ]
     }                                                                    */
function simulate(requests, mode /* "vulnerable" | "fixed" */) {
  return { granted: 0, usesLeftFinal: 1, refused: 0, events: [] };
}

/* Creates `count` lanes from <template id="lane-template"> inside #lanes. */
function buildLanes(count) {
  const host = $("lanes");
  const tpl = $("lane-template");
  host.textContent = "";
  for (let i = 0; i < count; i++) {
    const lane = tpl.content.firstElementChild.cloneNode(true);
    lane.querySelector("h4").textContent = "Request " + (i + 1);
    host.appendChild(lane);
  }
}

/* TODO (Vulnerable): call simulate(), then return { blocked, message, data }.
   blocked is false when the coupon was granted more than once. */
function vulnerableVersion(payload) {
  const { requests } = PAYLOADS[payload];
  return {
    blocked: false,
    resultClass: "todo",
    message: "TODO: implement vulnerableVersion() in assets/js/lab2.js",
    data: { requests, result: simulate(requests, "vulnerable") }
  };
}

/* TODO (Fixed): same, using simulate(requests, "fixed"). Only 1 grant allowed. */
function fixedVersion(payload) {
  const { requests } = PAYLOADS[payload];
  return {
    blocked: true,
    resultClass: "todo",
    message: "TODO: implement fixedVersion() in assets/js/lab2.js",
    data: { requests, result: simulate(requests, "fixed") }
  };
}

function resetSimulation() {
  runId++;
  $("lanes").textContent = "";
  $("state-uses").textContent = "1";
  $("state-granted").textContent = "0";
  $("state-lock").textContent = "off";
  setStatus("", "Waiting for a payload...");
  $("sim-explanation").textContent = "Press a payload to see how the application handles it.";
}

/* TODO: draw and animate. Suggested flow:
     const myRun = ++runId;
     buildLanes(data.requests);
     for each event in data.result.events:
        if (myRun !== runId) return;     // a newer run started: stop
        mark the <li> active, await sleep(300), mark done/bad, update #state-*
     setStatus(...) and #sim-explanation at the end                         */
async function updateSimulation(data, mode /*, payload, outcome */) {
  const myRun = ++runId;
  buildLanes(data.requests);
  $("state-lock").textContent = mode === "fixed" ? "on" : "off";
  // TODO: animate events (check myRun !== runId before every DOM update)
}

initLab({
  vulnerable: vulnerableVersion,
  fixed: fixedVersion,
  render: updateSimulation,
  reset: resetSimulation,
  descriptions: {
    vulnerable: "Vulnerable: the app checks the coupon, then updates it a moment later.",
    fixed: "Fixed: checking and updating the coupon happen as one atomic step."
  }
});
