/* Observation modal + DOCX generator (Docxtemplater) */

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
    if (!res.ok) throw new Error("Template missing: public/templates/ER_PROGRESS_SHEET_template.docx");

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
