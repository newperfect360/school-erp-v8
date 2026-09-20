import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { cloudEnabled, schoolFirebase } from './firebaseClient';

export default function useSchoolSession() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(cloudEnabled ? 'Checking sign-in…' : 'School sign-in configuration is required. Contact your administrator.');
  useEffect(() => {
    if (!cloudEnabled) return;
    let client;
    try { client = schoolFirebase(); } catch { setStatus('School sign-in configuration is incomplete.'); return; }
    let stopMember = () => {};
    const stopAuth = onAuthStateChanged(client.auth, user => {
      stopMember(); setSession(null);
      if (!user) { setStatus(''); return; }
      stopMember = onSnapshot(doc(client.db, 'schools', client.schoolId, 'members', user.uid), { includeMetadataChanges: true }, snapshot => {
        const member = snapshot.data();
        // Never trust cached membership after a role change or revocation.
        if (snapshot.metadata.fromCache) { setSession(null); setStatus('Connect to verify school access.'); return; }
        if (!member?.active || !Array.isArray(member.modules) || member.passwordSetupComplete !== true) {
          setSession(null); setStatus('Your account requires school administrator activation or password setup. Use Forgot Password if directed by your administrator.'); return;
        }
        setSession({ uid: user.uid, email: user.email, role: member.role, modules: member.modules, resources: member.resources || [] }); setStatus('');
      }, () => { setSession(null); setStatus('School access could not be verified.'); });
    });
    return () => { stopMember(); stopAuth(); };
  }, []);
  const uid = session?.uid;
  useEffect(() => {
    if (!uid) return;
    const started = Date.now(); let activity = started;
    const expire = () => { if (Date.now() - activity >= 15 * 60_000 || Date.now() - started >= 8 * 60 * 60_000) { setSession(null); void signOut(schoolFirebase().auth); } };
    const touch = () => { expire(); activity = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, touch));
    window.addEventListener('focus', expire);
    const timer = setInterval(expire, 1000);
    return () => { clearInterval(timer); events.forEach(event => window.removeEventListener(event, touch)); window.removeEventListener('focus', expire); };
  }, [uid]);
  return { session, status, logout: async () => { setSession(null); if (cloudEnabled) await signOut(schoolFirebase().auth); } };
}
