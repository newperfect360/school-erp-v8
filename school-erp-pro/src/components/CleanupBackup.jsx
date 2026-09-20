import { useState } from 'react';
import { createCleanupBackup, verifyCleanupBackup } from '../services/cleanupBackup';

export default function CleanupBackup() {
  const [busy, setBusy] = useState(false), [downloaded, setDownloaded] = useState(null), [message, setMessage] = useState('');
  const download = async () => {
    setBusy(true); setDownloaded(null); setMessage('');
    try {
      const { archive, filename } = await createCleanupBackup();
      const text = JSON.stringify(archive);
      await verifyCleanupBackup(text, archive.sha256);
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloaded({ filename, checksum: archive.sha256 });
      setMessage('Download requested. Select the saved file below to verify the copy on disk. No records have been deleted.');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const verify = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || !downloaded) return;
    setBusy(true);
    try {
      const result = await verifyCleanupBackup(await file.text(), downloaded.checksum);
      setMessage(`Saved backup verified: ${result.recordStores} record stores and ${result.assets} attachments from ${result.origin}. No records have been deleted. This does not verify cloud or Android data.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  return <section className="school-panel workflow-panel"><h3>Backup before test-data cleanup</h3>
    <p>Run this separately in the browser containing your localhost records and your Vercel records. Close other school tabs first. This archive includes local React records, settings, templates, embedded photos and stored attachment files. It excludes authentication credentials, cloud data, Android data and legacy app storage.</p>
    <p>This is a recovery archive for cleanup review, separate from the record-merge backup below. The existing merge restore does not restore this archive. No reset is enabled: verified Admin authentication and the shared backend are not connected.</p>
    <button disabled={busy} onClick={download}>Download dated cleanup backup with attachments</button>
    {downloaded && <><p>Filename: {downloaded.filename}</p><label>Verify saved cleanup backup<input type="file" accept=".json" disabled={busy} onChange={verify}/></label></>}
    <p role="status">{message}</p>
  </section>;
}
