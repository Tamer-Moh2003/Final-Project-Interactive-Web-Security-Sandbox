/* =====================================================
   Ghurir Sandbox — shared JavaScript
   1) Theme toggle (every page)
   2) initLab()   (lab pages) — the Vulnerable/Fixed engine
   Do not put lab-specific logic here. Each lab has its own file
   in assets/js/labN.js.
   ===================================================== */

/* ---------- 1) Theme toggle ---------- */
(function themeToggle() {
  const KEY = "ghurir-theme";
  const root = document.documentElement;

  function systemTheme() {
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function currentTheme() { return root.dataset.theme || systemTheme(); }

  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) { /* storage blocked: fall back to system theme */ }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const paint = () => { btn.textContent = currentTheme() === "dark" ? "Light mode" : "Dark mode"; };
    paint();
    btn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
    });
  });
})();

/* ---------- Small helpers for lab scripts ---------- */
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/* Sets the big status line inside a simulation.
   kind: "danger" | "success" | "" (neutral) */
function setStatus(kind, text, elementId = "sim-status") {
  const el = $(elementId);
  if (!el) return;
  el.className = "sim-status" + (kind ? " " + kind : "");
  el.textContent = text;
}

/* ---------- 2) The lab engine ----------
   initLab({ vulnerable, fixed, render, reset, descriptions })

   vulnerable(payload) / fixed(payload)  ->  outcome object:
     {
       blocked: boolean,        // true = attack stopped, false = attack worked
       message: string,         // text shown in the result box
       data: any,               // handed to render() untouched
       resultClass: "hacked" | "blocked" | "todo"   // optional override
     }

   render(data, mode, payload, outcome)  draws the simulation area.
   reset()                               puts the simulation back to "waiting".
   descriptions                          { vulnerable: "...", fixed: "..." }

   The engine handles: the Vulnerable/Fixed switch, payload buttons,
   re-running the SAME payload when the version is switched, and the
   coloured top border (body[data-mode]).                                  */
function initLab({ vulnerable, fixed, render, reset, descriptions }) {
  let mode = "vulnerable";
  let selectedPayload = null;

  const resultBox = $("result");
  const modeDescription = $("mode-description");
  const modeButtons = document.querySelectorAll("button[data-mode]");
  const payloadButtons = document.querySelectorAll("button[data-payload]");

  if (!resultBox || !modeButtons.length || !payloadButtons.length) {
    console.error("Lab setup is incomplete: #result, [data-mode] and [data-payload] are required.");
    return;
  }

  function clearResult() {
    resultBox.textContent = "";
    resultBox.className = "result";
  }

  function runSelectedPayload() {
    if (selectedPayload === null) return;
    const handler = mode === "vulnerable" ? vulnerable : fixed;
    const outcome = handler(selectedPayload);

    resultBox.textContent = outcome.message;
    resultBox.className = "result " + (outcome.resultClass || (outcome.blocked ? "blocked" : "hacked"));

    if (typeof render === "function") render(outcome.data, mode, selectedPayload, outcome);
  }

  function setMode(nextMode) {
    if (nextMode !== "vulnerable" && nextMode !== "fixed") return;
    mode = nextMode;
    document.body.dataset.mode = mode;

    modeButtons.forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (modeDescription && descriptions) modeDescription.textContent = descriptions[mode] || "";

    clearResult();
    if (selectedPayload !== null) runSelectedPayload();
    else if (typeof reset === "function") reset();
  }

  modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));

  payloadButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedPayload = button.dataset.payload;
      payloadButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      runSelectedPayload();
    });
  });

  setMode("vulnerable");
}
