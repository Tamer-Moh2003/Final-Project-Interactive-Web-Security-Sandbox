const samples = {
  executable: { name: "invoice.exe", format: "Executable" },
  doubleExtension: { name: "invoice.pdf.exe", format: "Executable" },
  mismatch: { name: "product-image.jpg", format: "Unknown" },
  valid: { name: "catalog.pdf", format: "PDF" }
};

const formats = new Map([
  ["pdf", "PDF"], ["png", "PNG"], ["jpg", "JPEG"], ["jpeg", "JPEG"]
]);

function vulnerableVersion(sample) {
  const checks = {
    extension: "skip",
    name: "skip",
    format: "skip"
  };
  const accepted = true;
  return { accepted, checks };
}

function fixedVersion(sample) {
  const [stem, ...extensions] = sample.name.toLowerCase().split(".");
  const expected = formats.get(extensions.at(-1));
  const checks = {
    extension: Boolean(expected),
    name: Boolean(stem) && extensions.length === 1,
    format: Boolean(expected) && sample.format === expected
  };
  const accepted = Object.values(checks).every(Boolean);
  return { accepted, checks };
}

const officeFiles = [...$("office-files").children];
const processingButton = $("simulate-processing");
const timeline = $("incident-timeline");
const warning = $("incident-warning");
let lockTimer;
let affected = 0;
let selected = null;
let mode = "vulnerable";

function record(text) {
  const event = document.createElement("li");
  event.textContent = text;
  timeline.append(event);
}

function updateCount() {
  $("incident-count").textContent = affected + " of " + officeFiles.length + " fictional files locked";
}

function restoreOffice() {
  clearTimeout(lockTimer);
  affected = 0;
  for (const file of officeFiles) {
    file.classList.remove("locked");
    file.lastElementChild.textContent = "Available";
  }
  warning.hidden = true;
  processingButton.disabled = true;
  timeline.replaceChildren();
  updateCount();
  record("Office files available.");
}

function showCheck(name, value) {
  const pill = $("check-" + name);
  const state = value === true ? "pass" : value === false ? "fail" : value;
  const labels = { pass: "Passed", fail: "Failed", skip: "Skipped", waiting: "Waiting" };
  pill.className = "pill " + state;
  pill.textContent = labels[state];
}

function render() {
  restoreOffice();
  const sample = samples[selected];
  $("up-filename").textContent = sample?.name ?? "—";
  $("up-format").textContent = sample?.format ?? "—";

  const fixed = mode === "fixed";
  $("mode-description").textContent = fixed
    ? "Fixed mode checks the extension, filename, and simulated content."
    : "Vulnerable mode accepts sample records without validation.";
  $("result").className = "result";
  $("result").textContent = "";
  if (!sample) {
    for (const check of ["extension", "name", "format"]) showCheck(check, "waiting");
    return;
  }

  const { accepted, checks } = (fixed ? fixedVersion : vulnerableVersion)(sample);
  for (const [name, value] of Object.entries(checks)) showCheck(name, value);
  const unsafeAccepted = accepted && !fixed && !fixedVersion(sample).accepted;
  processingButton.disabled = !unsafeAccepted;

  const reasons = [];
  if (checks.name === false) reasons.push("The filename must have a single extension.");
  if (checks.extension === false) reasons.push("The final extension is outside the allowlist.");
  if (checks.extension && checks.format === false) reasons.push("The content does not match the expected format.");

  const status = accepted ? "Upload accepted" : "Upload rejected";
  $("result").classList.add(unsafeAccepted ? "hacked" : "blocked");
  $("result").textContent = status + ". " + (
    unsafeAccepted ? "Validation was skipped. You can simulate unsafe processing."
      : accepted ? "The sample is an approved file format." : reasons.join(" ")
  );
  record(status + " · " + sample.name);
}

function showCode(id, handler, highlighted, style) {
  for (const line of handler.toString().split("\n")) {
    const row = document.createElement("span");
    row.className = line.includes(highlighted) ? "ln " + style : "ln";
    row.textContent = line;
    $(id).append(row, "\n");
  }
}

function lockNextFile() {
  const file = officeFiles[affected];
  file.classList.add("locked");
  file.lastElementChild.textContent = "Locked";
  affected += 1;
  updateCount();
  record("Locked · " + file.firstElementChild.textContent);
  if (affected < officeFiles.length) {
    lockTimer = setTimeout(lockNextFile, 420);
  } else {
    record("Simulated incident complete.");
  }
}

processingButton.addEventListener("click", () => {
  if (processingButton.disabled) return;
  processingButton.disabled = true;
  record("Simulated unsafe processing started.");
  warning.hidden = false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // The same fictional state changes happen without a timed sequence.
    for (const file of officeFiles) {
      file.classList.add("locked");
      file.lastElementChild.textContent = "Locked";
    }
    affected = officeFiles.length;
    updateCount();
    record("Simulated incident complete.");
    return;
  }
  lockTimer = setTimeout(lockNextFile, 300);
});

const modeButtons = document.querySelectorAll("button[data-mode]");
const sampleButtons = document.querySelectorAll("button[data-payload]");

function updateButtons(buttons, key, selectedValue) {
  for (const button of buttons) {
    const active = button.dataset[key] === selectedValue;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

for (const button of modeButtons) {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.body.dataset.mode = mode;
    updateButtons(modeButtons, "mode", mode);
    render();
  });
}

for (const button of sampleButtons) {
  button.addEventListener("click", () => {
    selected = button.dataset.payload;
    updateButtons(sampleButtons, "payload", selected);
    render();
  });
}

$("reset-incident").addEventListener("click", () => {
  selected = null;
  updateButtons(sampleButtons, "payload", selected);
  render();
});

showCode("vulnerable-code", vulnerableVersion, "const accepted", "bad");
showCode("fixed-code", fixedVersion, "const accepted", "good");
updateButtons(modeButtons, "mode", mode);
render();
