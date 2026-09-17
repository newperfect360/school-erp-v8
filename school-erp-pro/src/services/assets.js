const types = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"]);
function database() { return new Promise((resolve, reject) => { const request = indexedDB.open("school-erp-assets-v1", 1); request.onupgradeneeded = () => request.result.createObjectStore("assets", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Local file storage is unavailable.")); }); }
export async function saveAsset(file, audioOnly = false) {
  if (!types.has(file.type) || (audioOnly && !file.type.startsWith("audio/"))) throw new Error("Use PDF, JPG, PNG, WebP or a supported audio file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be 10 MB or smaller.");
  const db = await database(), item = { id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, blob: file, createdAt: new Date().toISOString() };
  await new Promise((resolve, reject) => { const tx = db.transaction("assets", "readwrite"); tx.objectStore("assets").add(item); tx.oncomplete = resolve; tx.onerror = () => reject(new Error("File could not be saved. Check available browser storage.")); tx.onabort = tx.onerror; }); db.close();
  return { id: item.id, name: item.name, type: item.type, size: item.size };
}
export async function readAsset(id) { const db = await database(); try { return await new Promise((resolve, reject) => { const request = db.transaction("assets").objectStore("assets").get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); } finally { db.close(); } }
