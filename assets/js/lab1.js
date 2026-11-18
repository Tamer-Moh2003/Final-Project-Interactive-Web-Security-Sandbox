/* =====================================================
   LAB 1 — Unrestricted File Upload (CWE-434)
   Owner: TODO

   LOGIC CONTRACT (what this file must do)
   -----------------------------------------------------
   Scenario: an avatar-upload form on trusted-site.test.
   NOTHING is really uploaded. Each payload is just a made-up
   file description (name, declared type, first bytes).

   Payloads (buttons in lab1.html -> data-payload):
     legit  photo.png   type image/png      real content = PNG
     php    shell.php   type application/x-php   real content = script
     spoof  shell.php   type image/png (forged)  real content = script

   VULNERABLE server (weak check, a realistic mistake):
     - checks ONLY the type the browser declared (the client controls it)
     - keeps the original file name, stores it in /uploads/ (web-accessible)
     Expected:
       legit -> accepted
       php   -> rejected (the weak check catches the obvious one)
       spoof -> ACCEPTED, stored as /uploads/shell.php, server could run it  <-- the bug

   FIXED server (defence in depth):
     1. extension must be on an allowlist (.png .jpg .jpeg .gif)
     2. declared type must be an image type
     3. real content (magic bytes) must match an image
     4. rename to a random name, store outside the web root / no-execute
     Expected:
       legit -> accepted, renamed e.g. /uploads/a91f3c.png
       php   -> blocked (extension)
       spoof -> blocked (extension AND magic bytes mismatch)

   RENDER (what the visitor sees, element ids are in lab1.html):
     #up-filename #up-mime #up-magic         -> show the payload
     #check-ext #check-mime #check-magic #check-rename -> setCheck(id, "pass"|"fail"|"skip")
        ("skip" = this version never runs that check)
     #up-stored #up-exec                      -> where it was stored, can the server run it?
     setStatus("danger"|"success", "...")     -> big status line
     #sim-explanation                         -> one sentence, plain English
   ===================================================== */

const PAYLOADS = {
  legit: { filename: "photo.png", mime: "image/png",          magic: "89 50 4E 47 (PNG image)", realImage: true  },
  php:   { filename: "shell.php", mime: "application/x-php",  magic: "3C 3F 70 68 (script text)", realImage: false },
  spoof: { filename: "shell.php", mime: "image/png",          magic: "3C 3F 70 68 (script text)", realImage: false }
};

/* Marks one check row. state: "pass" | "fail" | "skip" | "waiting" */
function setCheck(id, state) {
  const el = $(id);
  if (!el) return;
  const labels = { pass: "passed", fail: "failed", skip: "not checked", waiting: "waiting" };
  el.className = "pill" + (state === "waiting" ? "" : " " + state);
  el.textContent = labels[state];
}

/* TODO (Vulnerable): return { blocked, message, data }.
   Follow the VULNERABLE rules in the contract above. */
function vulnerableVersion(payload) {
  const file = PAYLOADS[payload];
  return {
    blocked: false,
    resultClass: "todo",
    message: "TODO: implement vulnerableVersion() in assets/js/lab1.js",
    data: { file }
  };
}

/* TODO (Fixed): same shape, FIXED rules. The same payload must now be blocked. */
function fixedVersion(payload) {
  const file = PAYLOADS[payload];
  return {
    blocked: true,
    resultClass: "todo",
    message: "TODO: implement fixedVersion() in assets/js/lab1.js",
    data: { file }
  };
}

function resetSimulation() {
  $("up-filename").textContent = "—";
  $("up-mime").textContent = "—";
  $("up-magic").textContent = "—";
  ["check-ext", "check-mime", "check-magic", "check-rename"].forEach(id => setCheck(id, "waiting"));
  $("up-stored").textContent = "—";
  $("up-exec").textContent = "—";
  setStatus("", "Waiting for a payload...");
  $("sim-explanation").textContent = "Press a payload to see how the application handles it.";
}

/* TODO: draw the outcome. The first three lines are done for you. */
function updateSimulation(data, mode /*, payload, outcome */) {
  const { file } = data;
  $("up-filename").textContent = file.filename;
  $("up-mime").textContent = file.mime;
  $("up-magic").textContent = file.magic;

  // TODO: setCheck(...) for each of the 4 rows (use "skip" for checks this version does not run)
  // TODO: fill #up-stored and #up-exec
  // TODO: setStatus("danger" | "success", "...") and #sim-explanation
}

initLab({
  vulnerable: vulnerableVersion,
  fixed: fixedVersion,
  render: updateSimulation,
  reset: resetSimulation,
  descriptions: {
    vulnerable: "Vulnerable: the server only trusts the file type sent by the browser.",
    fixed: "Fixed: the server checks the extension, the real content, and renames the file."
  }
});
