import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {tenantAuthEnabled,tenantRequest,selectedUdise,selectSchool} from './tenantAuth';
import { cloudEnabled, schoolFirebase } from './firebaseClient';
import {developmentEnabled,getDevelopmentSession,subscribeDevelopment,developmentLogout} from '@development-auth';

export default function useSchoolSession() {
  const [session, setSession] = useState(getDevelopmentSession);
  const [status, setStatus] = useState(cloudEnabled ? 'Checking sign-in…' : 'School sign-in configuration is required. Contact your administrator.');
  useEffect(() => {
    if (developmentEnabled) { setStatus('Local development login enabled. Firebase access is disabled in this mode.'); return subscribeDevelopment(setSession); }
    if (!cloudEnabled) return;
    let client;
    try { client = schoolFirebase(); } catch { setStatus('School sign-in configuration is incomplete.'); return; }
    let stopMember = () => {},stopSchool=()=>{},generation=0;
    const stopAuth = onAuthStateChanged(client.auth, async user => {
      const current=++generation;stopMember();stopSchool();setSession(null);let school=null;
      if (!user) { setStatus(''); return; }
      if(tenantAuthEnabled){try{const verified=await tenantRequest('session',selectedUdise());if(current!==generation)return;school=verified.school;selectSchool(school);}catch{if(current===generation){setStatus('Select your school and sign in with an authorized account.');await signOut(client.auth);}return;}}
      let schoolReady=!school,currentMember=null;
      const publish=()=>{
        if(current!==generation)return;
        const member=currentMember;
        if(!schoolReady||!member?.active||!Array.isArray(member.modules)||member.passwordSetupComplete!==true){setSession(null);setStatus('Connecting to verify your school and permissions.');return;}
        setSession({uid:user.uid,email:user.email,schoolId:client.schoolId,udise:school?.udise||'',school,schoolRole:['SUPER_ADMIN','SCHOOL_SUPER_ADMIN','Super Admin'].includes(member.role)?'SCHOOL_SUPER_ADMIN':member.role,role:['SUPER_ADMIN','SCHOOL_SUPER_ADMIN'].includes(member.role)?'Super Admin':member.role==='SCHOOL_ADMIN'?'Admin':member.role,modules:member.modules,resources:member.resources||[]});setStatus('');
      };
      if(school)stopSchool=onSnapshot(doc(client.db,'schools',school.id),{includeMetadataChanges:true},snapshot=>{schoolReady=!snapshot.metadata.fromCache&&snapshot.data()?.status==='ACTIVE';publish();},()=>{schoolReady=false;publish();setStatus('School access could not be verified.');});
      stopMember=onSnapshot(doc(client.db,'schools',client.schoolId,'members',user.uid),{includeMetadataChanges:true},snapshot=>{currentMember=snapshot.metadata.fromCache?null:snapshot.data();publish();},()=>{currentMember=null;publish();setStatus('School membership could not be verified.');});
    });
    return () => { generation++;stopMember();stopSchool();stopAuth(); };
  }, []);
  const uid = session?.uid;
  useEffect(() => {
    if (!uid || developmentEnabled) return;
    const started = Date.now(); let activity = started;
    const expire = () => { if (Date.now() - activity >= 15 * 60_000 || Date.now() - started >= 8 * 60 * 60_000) { setSession(null); void signOut(schoolFirebase().auth); } };
    const touch = () => { expire(); activity = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, touch));
    window.addEventListener('focus', expire);
    const timer = setInterval(expire, 1000);
    return () => { clearInterval(timer); events.forEach(event => window.removeEventListener(event, touch)); window.removeEventListener('focus', expire); };
  }, [uid]);
  return { session, status, logout: async () => { setSession(null); if (developmentEnabled) { developmentLogout(); return; } if (cloudEnabled) await signOut(schoolFirebase().auth); } };
}
