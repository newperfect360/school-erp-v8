import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = resolve(root, 'android-app/GBSSCHOOL/app/build/outputs/apk/debug');
const metadata = JSON.parse(readFileSync(resolve(build, 'output-metadata.json'), 'utf8'));
const artifact = metadata.elements[0];
if (metadata.applicationId !== 'com.gbsschool.app' || artifact.versionName !== '1.0.0' || artifact.versionCode !== 1) {
  throw new Error('Unexpected APK identity/version. Build version 1.0.0 (1) first.');
}
const bytes = readFileSync(resolve(build, artifact.outputFile));
const dir = resolve(root, 'releases/android');
mkdirSync(dir, { recursive: true });
const file = 'GBSSCHOOL-v1.0.0.apk';
writeFileSync(resolve(dir, file), bytes);
for (const screenshot of ['login.png', 'dashboard.png']) {
  copyFileSync(resolve(root, 'android-app/GBSSCHOOL/artifacts', screenshot), resolve(dir, screenshot));
}
const release = {
  packageId: metadata.applicationId, versionName: artifact.versionName, versionCode: artifact.versionCode,
  file, buildType: 'debug — UI preview only', minSdk: 24, targetSdk: 36,
  bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  releaseDate: new Date().toISOString().slice(0, 10),
};
writeFileSync(resolve(dir, 'release.json'), JSON.stringify(release, null, 2) + '\n');
console.log(JSON.stringify(release, null, 2));
