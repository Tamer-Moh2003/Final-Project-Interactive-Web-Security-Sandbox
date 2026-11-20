
/* =====================================================
   LAB 2 — Predictable Reset Tokens
   CWE-640 / CWE-340

   Browser-only security simulation.

   Vulnerable:
   Token = Public User ID + Reset Date

   Fixed:
   Token = Cryptographically secure random value

   Colors:
   Red   = Predictable token accepted
   Green = Invalid token correctly rejected

   No real email, server requests or account changes.
   ===================================================== */


/* =========================================
   1. SIMULATION CONFIGURATION
   ========================================= */

const RESET_DAY = "20261119";

const TARGET = {
  id: "1042",
  account: "alex@example.test"
};


/* =========================================
   2. GENERATE A RANDOM TOKEN
   ========================================= */

function generateSecureToken() {

  if (!window.crypto || !window.crypto.getRandomValues) {
    throw new Error(
      "Secure random generation is not supported by this browser."
    );
  }

  const bytes = new Uint8Array(32);

  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}


// One random token is generated for the simulated target account.
// It remains unchanged during this page session.

const FIXED_RESET_TOKEN = generateSecureToken();


/* =========================================
   3. PAYLOADS
   ========================================= */

const PAYLOADS = {

  predict: {
    targetId: TARGET.id,
    targetAccount: TARGET.account,

    submitted: TARGET.id + "-" + RESET_DAY,

    label: "Account ID + reset date"
  },

  replay: {
    targetId: TARGET.id,
    targetAccount: TARGET.account,

    submitted: "1041-" + RESET_DAY,

    label: "Sample token from user 1041"
  },

  random: {
    targetId: TARGET.id,
    targetAccount: TARGET.account,

    submitted: "7f3a91c0-d2e8",

    label: "Unrelated guess"
  }

};


/* =========================================
   4. TOKEN GENERATION LOGIC
   ========================================= */

function getExpectedToken(mode) {

  if (mode === "vulnerable") {

    // Weak and predictable token generation.

    return TARGET.id + "-" + RESET_DAY;
  }

  if (mode === "fixed") {

    // Cryptographically secure random token.

    return FIXED_RESET_TOKEN;
  }

  return null;
}


/* =========================================
   5. TOKEN VALIDATION
   ========================================= */

function evaluateAttempt(payload, mode) {

  const attempt = PAYLOADS[payload];

  // Reject unknown payloads.

  if (!attempt) {

    return {

      blocked: true,

      message: "Unknown token attempt. Request refused.",

      data: {

        attempt: {
          targetId: TARGET.id,
          targetAccount: TARGET.account,
          submitted: "—",
          label: "Unknown attempt"
        },

        mode: mode,
        accepted: false

      }

    };
  }


  // Get the actual expected token for the selected version.

  const expectedToken = getExpectedToken(mode);


  // Compare the submitted value with the expected token.

  const accepted =
    attempt.submitted === expectedToken;


  // Detect whether the vulnerability was successfully demonstrated.

  const securityFailure =
    mode === "vulnerable" && accepted;


  return {

    blocked: !accepted,

    message: securityFailure

      ? "SECURITY FAILURE: A predictable reset token was accepted. Unauthorized password reset is possible."

      : accepted

        ? "Token accepted."

        : "Token rejected. The reset request was blocked.",

    data: {

      attempt: attempt,

      mode: mode,

      accepted: accepted,

      securityFailure: securityFailure,

      secureRejection: !accepted

    }

  };

}


/* =========================================
   6. VULNERABLE VERSION
   ========================================= */

function vulnerableVersion(payload) {

  return evaluateAttempt(payload, "vulnerable");

}


/* =========================================
   7. FIXED VERSION
   ========================================= */

function fixedVersion(payload) {

  return evaluateAttempt(payload, "fixed");

}


/* =========================================
   8. RESET STEPPER
   ========================================= */

function resetSteps() {

  document
    .querySelectorAll("#reset-steps .step")
    .forEach(step => {

      step.classList.remove(
        "visited",
        "current",
        "skipped",
        "breach",
        "rejected"
      );

      const label = step.querySelector("small");

      if (label) {
        label.textContent = "waiting";
      }

    });

}


/* =========================================
   9. RESET SIMULATION
   ========================================= */

function resetSimulation() {

  $("target-account").textContent = "—";

  $("observed-token").textContent = "—";

  $("token-design").textContent = "—";

  $("submitted-token").textContent = "—";


  const resetOutcome = $("reset-outcome");

  resetOutcome.textContent = "—";

  resetOutcome.removeAttribute("data-result");


  resetSteps();


  setStatus("", "Waiting for a payload...");


  $("sim-explanation").textContent =
    "Choose a token attempt to see how the reset flow handles it.";

}


/* =========================================
   10. UPDATE SIMULATION
   ========================================= */

function updateSimulation(data, mode, payload, outcome) {

  const attempt = data.attempt;


  /* -----------------------------------------
     DISPLAY ACCOUNT INFORMATION
     ----------------------------------------- */

  $("target-account").textContent =
    "#" + attempt.targetId + " · " + attempt.targetAccount;


  /* -----------------------------------------
     DISPLAY OBSERVED TOKEN
     ----------------------------------------- */

  const observed = mode === "vulnerable"

    ? "1041-" + RESET_DAY

    : "Hidden random token";


  $("observed-token").textContent = observed;


  /* -----------------------------------------
     DISPLAY TOKEN DESIGN
     ----------------------------------------- */

  $("token-design").textContent =

    mode === "vulnerable"

      ? "User ID + date"

      : "CSPRNG random token";


  /* -----------------------------------------
     DISPLAY SUBMITTED TOKEN
     ----------------------------------------- */

  $("submitted-token").textContent =
    attempt.submitted;


  /* -----------------------------------------
     DISPLAY VALIDATION RESULT
     ----------------------------------------- */

  const resetOutcome = $("reset-outcome");


  if (data.securityFailure) {

    resetOutcome.textContent =
      "Password reset allowed — SECURITY FAILURE";

    resetOutcome.dataset.result = "breached";

  } else {

    resetOutcome.textContent =
      "Password reset blocked";

    resetOutcome.dataset.result = "blocked";

  }


  /* =========================================
     UPDATE STEPPER
     ========================================= */

  resetSteps();


  const observe = document.querySelector(
    '#reset-steps [data-step="observe"]'
  );

  const predict = document.querySelector(
    '#reset-steps [data-step="predict"]'
  );

  const validate = document.querySelector(
    '#reset-steps [data-step="validate"]'
  );


  // Step 1: Observe sample.

  observe.classList.add("visited");

  observe.querySelector("small").textContent =

    mode === "vulnerable"

      ? "pattern observed"

      : "random token";


  // Step 2: Build candidate.

  predict.classList.add("visited");

  predict.querySelector("small").textContent =
    attempt.label;


  // Step 3: Validate token.

  if (data.securityFailure) {

    // Unexpected acceptance = vulnerability.

    validate.classList.add("breach");

    validate.querySelector("small").textContent =
      "accepted — vulnerable";

  } else {

    // Rejected token = expected secure behavior.

    validate.classList.add("rejected");

    validate.querySelector("small").textContent =
      "rejected — secure";

  }


  /* =========================================
     UPDATE STATUS
     ========================================= */

  if (data.securityFailure) {

    setStatus(
      "danger",
      "Security failure! The predictable token was accepted."
    );

    $("sim-explanation").textContent =
      "The application accepted a token that could be calculated using the public account ID and reset date. An unauthorized password reset is possible.";

  } else if (mode === "fixed") {

    setStatus(
      "success",
      "Secure behavior — the guessed token was rejected."
    );

    $("sim-explanation").textContent =
      "The application generated a cryptographically secure random token. The submitted guess does not match the actual token, so the password reset is blocked.";

  } else {

    setStatus(
      "success",
      "Request rejected — this attempt did not exploit the vulnerability."
    );

    $("sim-explanation").textContent =
      "The submitted token does not match the predictable formula. The application correctly rejected this particular attempt. Try building a token from the target account ID and reset date.";

  }

}


/* =========================================
   11. INITIALIZE LAB
   ========================================= */

initLab({

  vulnerable: vulnerableVersion,

  fixed: fixedVersion,

  render: updateSimulation,

  reset: resetSimulation,

  descriptions: {

    vulnerable:
      "Vulnerable: the reset token is generated using a public user ID and a known date.",

    fixed:
      "Fixed: the reset token is generated using cryptographically secure randomness."

  }

});
