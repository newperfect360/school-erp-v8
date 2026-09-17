import { useEffect, useState } from 'react';
import { SchoolMark } from '../design/SchoolUI';
import { useLanguage } from '../design/language';
import './download-app.css';

function useRelease() {
  const [release, setRelease] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/downloads/android/release.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
      .then(data => {
        if (data.packageId !== 'com.gbsschool.app' || !/^[a-f0-9]{64}$/.test(data.sha256) || data.file !== 'GBSSCHOOL-v1.0.0.apk') throw new Error('Invalid release');
        setRelease(data);
      }).catch(error => { if (error.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, []);
  return { release, error };
}

export function DownloadAppCard() {
  const { t } = useLanguage();
  const { release } = useRelease();
  return <section className="app-download-card" aria-label="Android app download">
    <span className="app-release-label">ANDROID · TEST BUILD</span>
    <h2>GBSSCHOOL Android App</h2>
    <p>{t('Your school, ready for a first look on your phone.', 'आपल्या फोनवर शालेय ॲपचे पूर्वदृश्य पाहा.')}</p>
    {release && <p className="app-release-meta">v{release.versionName} · {(release.bytes / 1048576).toFixed(1)} MB · Android 7.0+<br/>Updated {release.releaseDate}</p>}
    <p>Login &amp; Dashboard preview. School sign-in is not connected.</p>
    <a className="app-download-button" href="/download-app">{t('Download Android App', 'Android ॲप डाउनलोड करा')} ↗</a>
  </section>;
}

export default function DownloadApp() {
  const { release, error } = useRelease();
  return <main className="app-download-page">
    <header><a href="/" className="app-back">← School portal</a><div className="app-download-brand"><SchoolMark/><strong>GBS SCHOOL</strong></div></header>
    <section className="app-download-hero">
      <div><span className="app-release-label">LEARNING · GROWING · TOGETHER</span><h1>Your school.<br/><em>Now on Android.</em></h1><p>A first look at the GBSSCHOOL mobile experience.</p><p className="app-test-notice"><strong>Test/debug APK — UI preview only.</strong> Explore Login and Dashboard with sample data. Real login, OTP, student records, attendance, contacts, uploads, scanner and notifications are not connected in this build. Do not enter real credentials.</p>
      {error ? <p role="alert">The release file is unavailable. Please try again later.</p> : !release ? <p role="status">Loading release details…</p> : <><dl className="app-release-facts"><div><dt>Version</dt><dd>{release.versionName} (code {release.versionCode})</dd></div><div><dt>File size</dt><dd>{(release.bytes / 1048576).toFixed(1)} MB</dd></div><div><dt>Released</dt><dd>{release.releaseDate}</dd></div><div><dt>Requires</dt><dd>Android 7.0+ (API {release.minSdk})</dd></div></dl><a className="app-download-button" href={'/downloads/android/' + release.file} download={release.file}>Download test APK · v{release.versionName}</a><p>Signed with a debug certificate. Device installation testing is pending.</p></>}
      </div><figure className="app-phone-preview"><img src="/downloads/android/dashboard.png" alt="Actual GBSSCHOOL Android dashboard showing sample data"/><figcaption>Actual Android UI test capture · sample data</figcaption></figure>
    </section>
    <div className="app-download-details"><section><h2>What’s included</h2><ul><li>Professional school Login and Dashboard preview.</li><li>Scrollable phone layouts and Android system bar insets.</li><li>Clear notices for modules awaiting backend connection.</li><li>Independent Kotlin and Jetpack Compose project.</li></ul><h2>Install for testing</h2><ol><li>Download the APK intentionally using the button above.</li><li>Open the downloaded file on your Android test device.</li><li>If prompted, allow installation from this browser or file manager. Follow your device or organisation policy.</li><li>Install and open GBSSCHOOL. Select “Explore preview dashboard”.</li><li>Use “Exit preview” to return to Login. Turn off installation permission afterwards if you enabled it.</li></ol><p>No automatic calls, messages or uploads are made by this preview.</p><h2>Scan QR to download</h2><p>Production QR pending approved domain deployment. No localhost QR is published. The official download-page QR will be added after the domain is approved and verified.</p></section>
    <section><h2>Login preview</h2><img className="app-login-preview" src="/downloads/android/login.png" alt="Actual Android Login preview"/><h2>Verify your download</h2>{release && <><p>Package: <code>{release.packageId}</code></p><p>SHA-256</p><code className="app-checksum">{release.sha256}</code><p>{release.bytes.toLocaleString()} bytes · {release.buildType}</p></>}<p>School logo artwork is provisional until the school supplies its approved identity.</p></section></div>
    <footer>GBSSCHOOL · Test distribution only · Not published to Google Play</footer>
  </main>;
}
