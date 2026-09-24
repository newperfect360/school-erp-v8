import {readStored} from '../storage';
import { useEffect, useState } from 'react';
import { SchoolMark } from '../design/SchoolUI';
import { useLanguage } from '../design/language';
import {currentSiteUrls} from '../config/siteUrls';
import './download-app.css';
import {developmentEnabled} from '@development-auth';

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
  if(developmentEnabled)return <section className="app-download-card" aria-label="Android app download"><span className="app-release-label">PerfectEdu DEMO / TEST BUILD</span><h2>PerfectEdu Android App</h2><p>Version 1.0.0-perfectedu-demo · Android 7.0+. Shared demo records with this computer; production Firebase is unchanged.</p><p>Connect the phone by USB and enable USB debugging, then run <code>adb reverse tcp:5178 tcp:5178</code>. Keep the Web development server running.</p><a className="app-download-button" href="/__school_demo/apk" download="GBSSCHOOL-demo-test.apk">Download current demo APK</a></section>;
  return <section className="app-download-card" aria-label="Android app download">
    <span className="app-release-label">ANDROID · TEST BUILD</span>
    <h2>GBSSCHOOL Android App</h2>
    <p>{t('Your school, ready for a first look on your phone.', 'आपल्या फोनवर शालेय ॲपचे पूर्वदृश्य पाहा.')}</p>
    {release && <p className="app-release-meta">v{release.versionName} · {(release.bytes / 1048576).toFixed(1)} MB · Android 7.0+<br/>Updated {release.releaseDate}</p>}
    <p>Login &amp; Dashboard preview. School sign-in is not connected.</p>
    <a className="app-download-button" href={currentSiteUrls().appDownloadUrl}>{t('Download Android App', 'Android ॲप डाउनलोड करा')} ↗</a>
  </section>;
}

export default function DownloadApp() {
  const settings=readStored("schoolSettings",{});
  const { release, error } = useRelease();
  if(developmentEnabled)return <main className="perfectedu-platform"><header><a href="/">PerfectEdu</a><a href="/login">School Login</a></header><DownloadAppCard/></main>;
  return <main className="app-download-page">
    <header><a href={currentSiteUrls().webBaseUrl + "/"} className="app-back">← School portal</a><div className="app-download-brand"><SchoolMark logo={settings.logo}/><div><small className="official-institution">{settings.sansthaName}</small><strong>{settings.schoolName}</strong><p>{settings.address}</p></div></div></header>
    <section className="app-download-hero">
      <div><span className="app-release-label">LEARNING · GROWING · TOGETHER</span><h1>Your school.<br/><em>Now on Android.</em></h1><p>A first look at the GBSSCHOOL mobile experience.</p><p className="app-test-notice"><strong>Test/debug APK — UI preview only.</strong> Explore Login and Dashboard with sample data. Real login, OTP, student records, attendance, contacts, uploads, scanner and notifications are not connected in this build. Do not enter real credentials.</p>
      {error ? <p role="alert">The release file is unavailable. Please try again later.</p> : !release ? <p role="status">Loading release details…</p> : <><dl className="app-release-facts"><div><dt>Version</dt><dd>{release.versionName} (code {release.versionCode})</dd></div><div><dt>File size</dt><dd>{(release.bytes / 1048576).toFixed(1)} MB</dd></div><div><dt>Released</dt><dd>{release.releaseDate}</dd></div><div><dt>Requires</dt><dd>Android 7.0+ (API {release.minSdk})</dd></div></dl><a className="app-download-button" href={'/downloads/android/' + release.file} download={release.file}>Download test APK · v{release.versionName}</a><p>Signed with a debug certificate. Device installation testing is pending.</p></>}
      </div><figure className="app-phone-preview"><img src="/downloads/android/dashboard.png" alt="Actual GBSSCHOOL Android dashboard showing sample data"/><figcaption>Actual Android UI test capture · sample data</figcaption></figure>
    </section>
    <div className="app-download-details"><section><h2>What’s included</h2><ul><li>Professional school Login and Dashboard preview.</li><li>Scrollable phone layouts and Android system bar insets.</li><li>Clear notices for modules awaiting backend connection.</li><li>Independent Kotlin and Jetpack Compose project.</li></ul><h2>Install for testing</h2><ol><li>Download the APK intentionally using the button above.</li><li>Open the downloaded file on your Android test device.</li><li>If prompted, allow installation from this browser or file manager. Follow your device or organisation policy.</li><li>Install and open GBSSCHOOL. Select “Explore preview dashboard”.</li><li>Use “Exit preview” to return to Login. Turn off installation permission afterwards if you enabled it.</li></ol><p>No automatic calls, messages or uploads are made by this preview.</p><h2>Scan QR to download</h2><p>A production download QR can use the current Vercel address once the production APK is ready. A custom domain is not required. The available APK remains a test build.</p></section>
    <section><h2>Login preview</h2><img className="app-login-preview" src="/downloads/android/login.png" alt="Actual Android Login preview"/><h2>Verify your download</h2>{release && <><p>Package: <code>{release.packageId}</code></p><p>SHA-256</p><code className="app-checksum">{release.sha256}</code><p>{release.bytes.toLocaleString()} bytes · {release.buildType}</p></>}<p>The school logo is the existing supplied image, displayed without redrawing or distortion.</p></section></div>
    <footer>{settings.schoolName} · {settings.address} · Test distribution only · Not published to Google Play</footer>
  </main>;
}
