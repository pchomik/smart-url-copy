// Light/dark theme switch. Choice persists in localStorage; default follows the OS.
const KEY = "advance-copy-theme";

const stored = localStorage.getItem(KEY);
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector("#theme-toggle")?.setAttribute("aria-pressed", String(dark));
}

export function initTheme() {
  apply(stored ? stored === "dark" : prefersDark);
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    const dark = !document.documentElement.classList.contains("dark");
    localStorage.setItem(KEY, dark ? "dark" : "light");
    apply(dark);
  });
}
