/* =====================================================
   LAB 2 — Predictable Reset Tokens
   CWE-640 / CWE-340

   This is a deterministic browser-only simulation.
   It never sends reset email or changes a real account.

   Common interface contract:
   - initLab() from common.js handles the Vulnerable/Fixed switch,
     payload buttons, descriptions, and result panel.
   - vulnerableVersion() / fixedVersion() return { blocked, message, data }.
   - updateSimulation() renders only Lab 2's simulated state.
   ===================================================== */

const RESET_DAY = "20261119";

const PAYLOADS = {
  predict: {
    targetId: "1042",
    targetAccount: "alex@example.test",
    submitted: "1042-" + RESET_DAY,
    label: "Account ID + reset date"
  },
  replay: {
    targetId: "1042",
    targetAccount: "alex@example.test",
    submitted: "1041-" + RESET_DAY,
    label: "Sample token from user 1041"
  },
  random: {
    targetId: "1042",
    targetAccount: "alex@example.test",
    submitted: "7f3a91c0-d2e8",
    label: "Unrelated guess"
  }
};

function evaluateAttempt(payload, mode) {
  const attempt = PAYLOADS[payload];
  if (!attempt) {
    return {
      blocked: true,
      message: "Unknown token attempt. The reset request was refused.",
      resultClass: "blocked",
      data: {
        attempt: { targetId: "1042", targetAccount: "alex@example.test", submitted: "—", label: "Unknown attempt" },
        mode: mode,
        accepted: false
      }
    };
  }

  // The vulnerable formula is intentionally simple and predictable:
  // token = public account ID + known reset date.
  const expectedVulnerableToken = attempt.targetId + "-" + RESET_DAY;
  const accepted = mode === "vulnerable" && attempt.submitted === expectedVulnerableToken;

  return {
    blocked: !accepted,
    resultClass: accepted ? "hacked" : "blocked",
    message: accepted
      ? "Token accepted: the simulated account password could now be changed."
      : "Token rejected: this guess does not match the valid reset token.",
    data: {
      attempt: attempt,
      mode: mode,
      accepted: accepted
    }
  };
}

function vulnerableVersion(payload) {
  return evaluateAttempt(payload, "vulnerable");
}

function fixedVersion(payload) {
  return evaluateAttempt(payload, "fixed");
}

function resetSteps() {
  document.querySelectorAll("#reset-steps .step").forEach(step => {
    step.classList.remove("visited", "current", "skipped", "breach", "rejected");
    const label = step.querySelector("small");
    if (label) label.textContent = "waiting";
  });
}

function resetSimulation() {
  $("target-account").textContent = "—";
  $("observed-token").textContent = "—";
  $("token-design").textContent = "—";
  $("submitted-token").textContent = "—";
  $("reset-outcome").textContent = "—";
  $("reset-outcome").removeAttribute("data-result");
  resetSteps();
  setStatus("", "Waiting for a payload...");
  $("sim-explanation").textContent = "Choose a token attempt to see how the reset flow handles it.";
}

function updateSimulation(data, mode, payload, outcome) {
  const attempt = data.attempt;
  const observed = mode === "vulnerable"
    ? "1041-" + RESET_DAY
    : "Redacted sample (random)";

  $("target-account").textContent = "#" + attempt.targetId + " · " + attempt.targetAccount;
  $("observed-token").textContent = observed;
  $("token-design").textContent = mode === "vulnerable"
    ? "User ID + date"
    : "CSPRNG random token";
  $("submitted-token").textContent = attempt.submitted;
  $("reset-outcome").textContent = data.accepted ? "Password reset allowed" : "Request refused";
  $("reset-outcome").dataset.result = data.accepted ? "breached" : "blocked";

  resetSteps();
  const observe = document.querySelector('#reset-steps [data-step="observe"]');
  const predict = document.querySelector('#reset-steps [data-step="predict"]');
  const validate = document.querySelector('#reset-steps [data-step="validate"]');

  observe.classList.add("visited");
  observe.querySelector("small").textContent = "pattern seen";
  predict.classList.add("visited");
  predict.querySelector("small").textContent = attempt.label;
  validate.classList.add(data.accepted ? "breach" : "rejected");
  validate.querySelector("small").textContent = data.accepted ? "accepted" : "rejected";

  if (data.accepted) {
    setStatus("danger", "Predictable token accepted — account takeover is possible.");
    $("sim-explanation").textContent = "The submitted value matches the weak ID-and-date formula, so the simulated reset flow accepts it.";
  } else if (mode === "fixed") {
    setStatus("success", "Blocked — the candidate does not match the random reset token.");
    $("sim-explanation").textContent = "The fixed flow uses an unpredictable token that is not derived from the account ID or date.";
  } else {
    setStatus("success", "Request refused — this token guess does not match.");
    $("sim-explanation").textContent = "This attempt did not reproduce the vulnerable formula. Try building a candidate from the target's public ID and reset date.";
  }
}

initLab({
  vulnerable: vulnerableVersion,
  fixed: fixedVersion,
  render: updateSimulation,
  reset: resetSimulation,
  descriptions: {
    vulnerable: "Vulnerable: the token is derived from a public user ID and a known date.",
    fixed: "Fixed: the reset token is generated with cryptographically secure randomness."
  }
});

