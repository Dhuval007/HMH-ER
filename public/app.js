import { auth, db } from "./firebase.js";

import { signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot,
  deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ---------- Handover list ---------- */
const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const addForm = document.getElementById("addForm");
const textEl = document.getElementById("text");
const COL = "handoverItems";

function setStatus(s) { statusEl.textContent = s; }

function renderItem(id, data) {
  const wrap = document.createElement("div");
  wrap.className = "item";

  const t = document.createElement("div");
  t.className = "t";
  t.textContent = data.text ?? "";

  const meta = document.createElement("div");
  meta.className = "meta";
  const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  meta.textContent = ts ? ts.toLocaleString() : "";

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    await deleteDoc(doc(db, COL, id));
  });

  wrap.appendChild(t);
  wrap.appendChild(meta);
  wrap.appendChild(del);
  return wrap;
}

function startRealtimeList() {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    snap.forEach((d) => listEl.appendChild(renderItem(d.id, d.data())));
  });
}

addForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = textEl.value.trim();
  if (!text) return;

  await addDoc(collection(db, COL), { text, createdAt: serverTimestamp() });
  textEl.value = "";
  textEl.focus();
});

/* ---------- Observation modal + DOCX ---------- */
const obsModal = document.getElementById("obsModal");
const btnObs = document.getElementById("btnObs");
const closeObs = document.getElementById("closeObs");
const btnGenerateDoc = document.getElementById("btnGenerateDoc");
const obsForm = document.getElementById("obsForm");

btnObs?.addEventListener("click", () => obsModal.classList.remove("hidden"));
closeObs?.addEventListener("click", () => obsModal.classList.add("hidden"));

function formToData(formEl) {
  const fd = new FormData(formEl);
  const data = {};
  for (const [k, v] of fd.entries()) data[k] = String(v ?? "").trim();
  return data;
}

btnGenerateDoc?.addEventListener("click", async () => {
  try {
    const data = formToData(obsForm);

    const res = await fetch("./templates/ER_PROGRESS_SHEET_template.docx");
    if (!res.ok) throw new Error("Template missing: /public/templates/ER_PROGRESS_SHEET_template.docx");

    const arrayBuffer = await res.arrayBuffer();
    const zip = new window.PizZip(arrayBuffer);
    const docx = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    docx.setData(data);
    docx.render();

    const out = docx.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const safeName = (data.patient_name || "patient").replace(/[^\w\-]+/g, "_");
    window.saveAs(out, `ER_Progress_Sheet_${safeName}.docx`);
  } catch (e) {
    console.error(e);
    alert("DOCX generation failed. Open console for details.");
  }
});

/* ---------- Boot ---------- */
async function boot() {
  setStatus("Signing in…");
  await signInAnonymously(auth);

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    setStatus("Ready");
    startRealtimeList();
  });
}

boot().catch((err) => {
  console.error(err);
  setStatus("Error");
});
