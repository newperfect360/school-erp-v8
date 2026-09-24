import {schoolStorage} from '../backend/demoClient';
// Read-only pre-cleanup archive. This never clears records or grants reset permission.
const ownedKey = key => key === 'schoolSettings' || /^erp_pro_/.test(key);
const sensitiveKey = key => /password|token|credential|users/i.test(key);
const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), n => n.toString(16).padStart(2, '0')).join('');

async function readAssets() {
  if (!indexedDB.databases) throw Error('This browser cannot inventory attachment databases. Use current Edge or Chrome.');
  const databases = await indexedDB.databases();
  if (!databases.some(db => db.name === 'school-erp-assets-v1')) return [];
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('school-erp-assets-v1');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readonly');
      const request = tx.objectStore('assets').getAll();
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error || Error('Attachment backup failed.'));
    });
  } finally { db.close(); }
}

function recordsSnapshot() {
  const records = {}, excludedKeys = [];
  for (const key of schoolStorage.keys().sort()) {
    if (!ownedKey(key)) continue;
    if (sensitiveKey(key)) { excludedKeys.push(key); continue; }
    // Preserve raw strings, including malformed records, rather than silently discarding them.
    records[key] = schoolStorage.getItem(key);
  }
  return { records, excludedKeys };
}

const encodeBlob = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(Error('An attachment could not be backed up.'));
  reader.readAsDataURL(blob);
});

export async function createCleanupBackup() {
  const before = recordsSnapshot();
  const attachments = await readAssets();
  const assets = await Promise.all(attachments.map(async ({ blob, ...metadata }) => {
    if (!(blob instanceof Blob)) throw Error(`Attachment ${metadata.id} has no readable file. Backup stopped.`);
    return { ...metadata, byteLength: blob.size, dataUrl: await encodeBlob(blob) };
  }));
  if (JSON.stringify(before) !== JSON.stringify(recordsSnapshot())) throw Error('Records changed during backup. Close other school tabs and try again.');
  const payload = JSON.stringify({ format: 'school-erp-local-cleanup-backup', version: 1,
    createdAt: new Date().toISOString(), origin: location.origin, ...before, assets,
    scope: 'React browser records and school-erp-assets-v1 only. Excludes cloud, Android, legacy app and authentication credentials.' });
  const archive = { payload, sha256: await digest(payload) };
  return { archive, filename: `school-cleanup-backup-${location.hostname}-${location.port || 'https'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json` };
}

export async function verifyCleanupBackup(text, expectedChecksum) {
  const archive = JSON.parse(text);
  if (typeof archive.payload !== 'string' || !archive.sha256 || await digest(archive.payload) !== archive.sha256) throw Error('Backup checksum failed. Do not delete records.');
  if (expectedChecksum && archive.sha256 !== expectedChecksum) throw Error('Choose the backup downloaded in this session.');
  const data = JSON.parse(archive.payload);
  if (data.format !== 'school-erp-local-cleanup-backup' || data.version !== 1 || !data.records || !Array.isArray(data.assets)) throw Error('Unsupported cleanup backup.');
  return { origin: data.origin, createdAt: data.createdAt, recordStores: Object.keys(data.records).length, assets: data.assets.length, sha256: archive.sha256 };
}
