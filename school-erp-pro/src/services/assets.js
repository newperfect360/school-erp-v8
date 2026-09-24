const types = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4"]);
function database() { return new Promise((resolve, reject) => { const request = indexedDB.open("school-erp-assets-v1", 1); request.onupgradeneeded = () => request.result.createObjectStore("assets", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Local file storage is unavailable.")); }); }
export async function saveAsset(file, audioOnly = false, scope = null) {
  if (!types.has(file.type) || (audioOnly && !file.type.startsWith("audio/"))) throw new Error("Use PDF, JPG, PNG, WebP or a supported audio file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be 10 MB or smaller.");
  if(scope){
    const {sharedOperationalEnabled}=await import('../backend/sharedReadCache');
    if(sharedOperationalEnabled){
      if(!scope.className?.trim()||!scope.division?.trim())throw Error('Choose class and division before uploading.');
      const classId=`${scope.className}:${scope.division}`;if(classId.includes('/'))throw Error('Invalid class/division.');
      const {schoolFirebase}=await import('../backend/firebaseClient'),{ref,uploadBytes}=await import('firebase/storage'),client=schoolFirebase();
      const id=`schools/${client.schoolId}/class_files/${classId}/${crypto.randomUUID()}`;
      await uploadBytes(ref(client.storage,id),file,{contentType:file.type,customMetadata:{originalName:file.name}});return {id,name:file.name,type:file.type,size:file.size,shared:true,classId};
    }
  }
  const db = await database(), item = { id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, blob: file, createdAt: new Date().toISOString() };
  await new Promise((resolve, reject) => { const tx = db.transaction("assets", "readwrite"); tx.objectStore("assets").add(item); tx.oncomplete = resolve; tx.onerror = () => reject(new Error("File could not be saved. Check available browser storage.")); tx.onabort = tx.onerror; }); db.close();
  return { id: item.id, name: item.name, type: item.type, size: item.size };
}
export async function readAsset(id) { if(id?.startsWith("schools/")){const {schoolFirebase}=await import("../backend/firebaseClient"),{ref,getBlob,getMetadata}=await import("firebase/storage"),client=schoolFirebase();if(!id.startsWith(`schools/${client.schoolId}/class_files/`))throw Error("File is outside the current school.");const target=ref(client.storage,id),[blob,metadata]=await Promise.all([getBlob(target,10*1024*1024),getMetadata(target)]);return {id,blob,name:metadata.customMetadata?.originalName||metadata.name,type:metadata.contentType||blob.type,size:metadata.size};} const db = await database(); try { return await new Promise((resolve, reject) => { const request = db.transaction("assets").objectStore("assets").get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); } finally { db.close(); } }
