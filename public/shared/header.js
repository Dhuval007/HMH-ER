import { watchAuth, logout } from "/shared/auth.js";

const NAV_LINKS = [
  { label: "Home", href: "/index.html" },
  { label: "ER Board", href: "/ER/board.html" },
  { label: "Discharged", href: "/ER/discharged.html" },
  { label: "Admitted", href: "/ER/admitted.html" },
  { label: "Transfer", href: "/ER/transfer.html" },
  { label: "LAMA/DOR", href: "/ER/lama.html" },
  { label: "Statistics", href: "/ER/stats.html" },
  { label: "Observation", href: "/observation.html" }
];

function normalizePath(p) {
  try { return new URL(p, window.location.origin).pathname.replace(/\/+$/, ""); }
  catch { return p; }
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

  const loginA = document.createElement("a");
  loginA.className = "hmh-btn light";
  loginA.href = "/login.html";
  loginA.textContent = "Login";

  const signOutBtn = document.createElement("button");
  signOutBtn.className = "hmh-btn danger";
  signOutBtn.type = "button";
  signOutBtn.textContent = "Sign Out";
  signOutBtn.addEventListener("click", async () => {
    await logout();
    window.location.href = "/login.html";
  });

  auth.appendChild(loginA);
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
    if (normalizePath(x.href) === current) a.classList.add("active");
    nav.appendChild(a);
  });

  header.appendChild(inner);
  header.appendChild(nav);

  return { header, loginA, signOutBtn, nav };
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("hmhHeader")) return;

  const { header, loginA, signOutBtn, nav } = buildHeader();

  const isLogin = normalizePath(window.location.pathname).endsWith("/login.html");
  if (isLogin) nav.style.display = "none";

  document.body.insertBefore(header, document.body.firstChild);

  // Toggle buttons based on auth state
  watchAuth((u) => {
    if (u) {
      loginA.style.display = "none";
      signOutBtn.style.display = "inline-flex";
    } else {
      loginA.style.display = "inline-flex";
      signOutBtn.style.display = "none";
    }
  });
});
