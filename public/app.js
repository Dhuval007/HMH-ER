import { auth, db } from "./firebase.js";

import { signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot,
  deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = textEl.value.trim();
  if (!text) return;

  await addDoc(collection(db, COL), {
    text,
    createdAt: serverTimestamp(),
  });

  textEl.value = "";
  textEl.focus();
});

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
