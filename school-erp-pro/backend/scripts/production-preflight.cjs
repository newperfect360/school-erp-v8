// Read-only production inventory and backup. Never writes Firebase records/rules.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { getGlobalDefaultAccount } = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const { Client } = require('firebase-tools/lib/apiv2');

async function main() {
  const project = process.argv[2];
  if (!/^[a-z][a-z0-9-]{4,60}$/.test(project || '')) throw Error('Supply the existing Firebase project ID.');
  await requireAuth({ ...getGlobalDefaultAccount(), project });
  const db = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1' });
  const rules = new Client({ urlPrefix: 'https://firebaserules.googleapis.com', apiVersion: 'v1' });
  const root = `projects/${project}/databases/(default)/documents`;
  const snapshot = { project, startedAt: new Date().toISOString(), documents: [], missingParents: [], collections: [] };
  async function walk(parent) {
    let token;
    do {
      const response = await db.post(parent + ':listCollectionIds', { pageSize: 100, ...(token ? { pageToken: token } : {}) });
      for (const id of response.body.collectionIds || []) {
        const collectionPath = parent + '/' + id;
        const entry = { path: collectionPath.slice(root.length + 1), count: 0, fields: [] };
        snapshot.collections.push(entry);
        const fields = new Set();
        let pageToken;
        do {
          const page = await db.get(collectionPath, { queryParams: { pageSize: 100, showMissing: true, ...(pageToken ? { pageToken } : {}) } });
          for (const document of page.body.documents || []) {
            if (document.createTime) {
              snapshot.documents.push(document); entry.count++;
              Object.keys(document.fields || {}).forEach(key => fields.add(key));
            } else snapshot.missingParents.push(document.name);
            await walk(document.name);
          }
          pageToken = page.body.nextPageToken;
        } while (pageToken);
        entry.fields = [...fields].sort();
      }
      token = response.body.nextPageToken;
    } while (token);
  }
  await walk(root);
  const release = await rules.get(`projects/${project}/releases/cloud.firestore`);
  const ruleSource = await rules.get(release.body.rulesetName);
  snapshot.rules = { release: release.body, ruleset: ruleSource.body };
  snapshot.completedAt = new Date().toISOString();
  snapshot.consistency = 'Paginated read-only snapshot; not an atomic managed export. Quiesce writes and recheck updateTime before migration.';
  const output = path.resolve(__dirname, '../production-backup-' + Date.now() + '.local');
  const bytes = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(output, bytes, { flag: 'wx' });
  const reread = fs.readFileSync(output);
  if (JSON.parse(reread).documents.length !== snapshot.documents.length) throw Error('Backup readback failed.');
  console.log(JSON.stringify({ backup: output, sha256: crypto.createHash('sha256').update(reread).digest('hex'), documents: snapshot.documents.length, collections: snapshot.collections, consistency: snapshot.consistency }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
