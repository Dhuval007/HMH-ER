/**
 * Injects a consistent HMH header + nav into every page.
 * Edit NAV_LINKS to match your actual page paths.
 */

const NAV_LINKS = [
  { label: "Home", href: "/index.html" },
  { label: "ER Board", href: "/ER/index.html" },
  { label: "Discharged", href: "/ER/discharged.html" },
  { label: "Admitted", href: "/ER/admitted.html" },
  { label: "Transfer", href: "/ER/transfer.html" },
  { label: "LAMA/DOR", href: "/ER/lama.html" },
  { label: "Statistics", href: "/ER/stats.html" },
  { label: "Observation Sheet", href: "/observation.html" },
];

function normalizePath(p) {
  try {
    const u = new URL(p, window.location.origin);
    return u.pathname.replace(/\/+$/, "");
  } catch {
    return p;
  }
}

function buildHeader() {
  const header = document.createElement("header");
  header.className = "hmh-topbar";
  header.id = "hmhHeader";

  const inner = document.createElement("div");
  inner.className = "hmh-topbar-inner";

  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "hmh-title";
  title.textContent = "Emergency Room Patient Tracker";
  const sub = document.createElement("div");
  sub.className = "hmh-sub";
  sub.textContent = "HMH ER • Quick navigation";
  titleWrap.appendChild(title);
  titleWrap.appendChild(sub);

  const spacer = document.createElement("div");
  spacer.className = "hmh-spacer";

  const auth = document.createElement("div");
  auth.className = "hmh-auth";

  // Login link (always visible)
  const loginA = document.createElement("a");
  loginA.className = "hmh-btn light";
  loginA.href = "/login.html";
  loginA.textContent = "Login";
  auth.appendChild(loginA);

  // Optional Sign Out button if your page already has auth logic.
  // If you later add Firebase auth, you can wire window.hmhSignOut() in auth.js.
  const signOutBtn = document.createElement("button");
  signOutBtn.className = "hmh-btn danger";
  signOutBtn.type = "button";
  signOutBtn.textContent = "Sign Out";
  signOutBtn.addEventListener("click", async () => {
    if (typeof window.hmhSignOut === "function") {
      await window.hmhSignOut();
      window.location.href = "/login.html";
    } else {
      alert("Sign out not wired yet. Add Firebase auth.js later.");
    }
  });
  auth.appendChild(signOutBtn);

  inner.appendChild(titleWrap);
  inner.appendChild(spacer);
  inner.appendChild(auth);

  const nav = document.createElement("nav");
  nav.className = "hmh-nav";

  const current = normalizePath(window.location.pathname);
  NAV_LINKS.forEach((x) => {
    const a = document.createElement("a");
    a.className = "hmh-pill";
    a.href = x.href;
    a.textContent = x.label;

    const target = normalizePath(x.href);
    if (target === current) a.classList.add("active");

    nav.appendChild(a);
  });

  header.appendChild(inner);
  header.appendChild(nav);

  return header;
}

function inject() {
  // Don't double-inject if page already has it
  if (document.getElementById("hmhHeader")) return;

  // Optional: minimal header on login page (or hide pills)
  const isLogin = normalizePath(window.location.pathname).endsWith("/login.html");

  const h = buildHeader();
  if (isLogin) {
    // On login page, hide nav pills to keep it clean
    const nav = h.querySelector(".hmh-nav");
    if (nav) nav.style.display = "none";
  }

  document.body.insertBefore(h, document.body.firstChild);

  // Wrap content if page doesn't already have a main container
  // (Won't break existing layouts.)
  // If you already use a wrap, ignore.
}

document.addEventListener("DOMContentLoaded", inject);
