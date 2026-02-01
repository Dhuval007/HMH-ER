import { auth, db } from "/firebase.js";

import { signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  collection, doc, setDoc, updateDoc, deleteField,
  serverTimestamp, onSnapshot, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const zonesEl = document.getElementById("zones");
const syncEl = document.getElementById("sync");
const btnSeed = document.getElementById("btnSeed");

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const bedForm = document.getElementById("bedForm");
const btnVacant = document.getElementById("btnVacant");

const COL = "erBeds";

const ZONES = [
  { name: "Resus Zone", beds: 3 },
  { name: "Red Zone", beds: 10 },
  { name: "Yellow Zone", beds: 10 },
  { name: "Green Zone", beds: 10 },
  { name: "Observation", beds: 6 },
];

function openModal() { modal.classList.remove("hidden"); }
function close() { modal.classList.add("hidden"); }
closeModal.addEventListener("click", close);
modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

function nowLabel() {
  const d = new Date();
  return d.toLocaleString();
}

function bedDocId(zoneName, bedLabel) {
  return `${zoneName}__${bedLabel}`.replace(/\s+/g, "_");
}

function safe(v) { return (v ?? "").toString(); }

function setForm(data) {
  for (const el of bedForm.elements) {
    if (!el.name) continue;
    el.value = safe(data[el.name]);
  }
}

function formData() {
  const fd = new FormData(bedForm);
  const o = {};
  for (const [k, v] of fd.entries()) o[k] = safe(v).trim();
  return o;
}

function cardForBed(docId, data) {
  const status = (data.status || "vacant").toLowerCase();

  const card = document.createElement("div");
  card.className = `bedCard ${status}`;

  const top = document.createElement("div");
  top.className = "top";

  const label = document.createElement("div");
  label.className = "bedLabel";
  label.textContent = data.bedLabel || "Bed";

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = status === "occupied" ? "Occupied" : "Vacant";

  top.appendChild(label);
  top.appendChild(badge);

  const body = document.createElement("div");

  if (status !== "occupied") {
    const plusRow = document.createElement("div");
    plusRow.className = "plusRow";
    const plus = document.createElement("div");
    plus.className = "plus";
    plus.textContent = "+";
    const t = document.createElement("div");
    t.className = "line";
    t.textContent = "Vacant";
    plusRow.appendChild(plus);
    plusRow.appendChild(t);
    body.appendChild(plusRow);
  } else {
    const line1 = document.createElement("div");
    line1.className = "line";
    line1.textContent = `${safe(data.patientName)} • ${safe(data.age)}y • ${safe(data.hospNo)}`;

    const line2 = document.createElement("div");
    line2.className = "sub";
    line2.textContent = `${safe(data.diagnosis)}`.slice(0, 70);

    const line3 = document.createElement("div");
    line3.className = "sub";
    line3.textContent = `${safe(data.assignedDoctor)} ${data.assignedDoctor ? "•" : ""} ${safe(data.assignedNurse)}`.trim();

    body.appendChild(line1);
    if (data.diagnosis) body.appendChild(line2);
    if (data.assignedDoctor || data.assignedNurse) body.appendChild(line3);
  }

  card.appendChild(top);
  card.appendChild(body);

  card.addEventListener("click", () => {
    modalTitle.textContent = `${data.zone || ""} • ${data.bedLabel || ""}`.trim();
    setForm({ docId, ...data });
    openModal();
  });

  return card;
}

function renderBoard(allBeds) {
  zonesEl.innerHTML = "";

  const byZone = new Map();
  for (const z of ZONES) byZone.set(z.name, []);

  for (const b of allBeds) {
    if (!byZone.has(b.zone)) byZone.set(b.zone, []);
    byZone.get(b.zone).push(b);
  }

  for (const z of ZONES) {
    const zoneWrap = document.createElement("section");
    zoneWrap.className = "zone";

    const h = document.createElement("h3");
    h.textContent = z.name;
    zoneWrap.appendChild(h);

    const grid = document.createElement("div");
    grid.className = "bedGrid";

    const list = (byZone.get(z.name) || []).sort((a, b) => {
      const an = parseInt((a.bedLabel || "").replace(/[^\d]/g, "") || "0", 10);
      const bn = parseInt((b.bedLabel || "").replace(/[^\d]/g, "") || "0", 10);
      return an - bn;
    });

    for (const item of list) {
      grid.appendChild(cardForBed(item.docId, item));
    }

    zoneWrap.appendChild(grid);
    zonesEl.appendChild(zoneWrap);
  }
}

async function seedBeds() {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) {
    alert("Beds already exist in Firestore (erBeds).");
    return;
  }

  for (const z of ZONES) {
    for (let i = 1; i <= z.beds; i++) {
      const bedLabel = `Bed ${i}`;
      const docId = bedDocId(z.name, bedLabel);
      await setDoc(doc(db, COL, docId), {
        zone: z.name,
        bedLabel,
        status: "vacant",
        updatedAt: serverTimestamp(),
      });
    }
  }

  alert("Seeded beds ✅");
}

btnSeed.addEventListener("click", () => seedBeds().catch(console.error));

btnVacant.addEventListener("click", async () => {
  const d = formData();
  if (!d.docId) return;

  await updateDoc(doc(db, COL, d.docId), {
    status: "vacant",
    patientName: "",
    age: "",
    hospNo: "",
    idNumber: "",
    contactNo: "",
    assignedNurse: "",
    assignedDoctor: "",
    diagnosis: "",
    plan: "",
    disposition: "",
    notes: "",
    updatedAt: serverTimestamp(),
  });

  close();
});

bedForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = formData();
  if (!d.docId) return;

  const status = (d.status || "vacant").toLowerCase();
  await updateDoc(doc(db, COL, d.docId), {
    zone: d.zone,
    bedLabel: d.bedLabel,
    status,
    patientName: d.patientName,
    age: d.age,
    hospNo: d.hospNo,
    idNumber: d.idNumber,
    contactNo: d.contactNo,
    assignedNurse: d.assignedNurse,
    assignedDoctor: d.assignedDoctor,
    diagnosis: d.diagnosis,
    plan: d.plan,
    disposition: d.disposition,
    notes: d.notes,
    updatedAt: serverTimestamp(),
  });

  close();
});

async function boot() {
  syncEl.textContent = "Sync: signing in…";
  await signInAnonymously(auth);

  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    syncEl.textContent = "Sync: live";

    const q = query(collection(db, COL), orderBy("zone"), orderBy("bedLabel"));
    onSnapshot(q, (snap) => {
      const rows = [];
      snap.forEach((d) => rows.push({ docId: d.id, ...d.data() }));
      renderBoard(rows);
      syncEl.textContent = `Sync: ${nowLabel()}`;
    });
  });
}

boot().catch((e) => {
  console.error(e);
  syncEl.textContent = "Sync: error (check console)";
});
