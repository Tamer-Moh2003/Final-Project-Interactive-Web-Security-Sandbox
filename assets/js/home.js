/* Home page — the small Vulnerable/Fixed preview in the hero. */
(function () {
  const buttons = document.querySelectorAll("[data-demo-mode]");
  const result = document.getElementById("demo-result");
  if (!buttons.length || !result) return;

  const outcomes = {
    vulnerable: { cls: "hacked",  text: "Accepted. shell.php was saved to /uploads/ and can be opened from the web." },
    fixed:      { cls: "blocked", text: "Blocked. .php is not on the list of allowed file types." }
  };

  function show(mode) {
    buttons.forEach(b => {
      const on = b.dataset.demoMode === mode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    result.className = "result " + outcomes[mode].cls;
    result.textContent = outcomes[mode].text;
  }

  buttons.forEach(b => b.addEventListener("click", () => show(b.dataset.demoMode)));
  show("vulnerable");
})();
