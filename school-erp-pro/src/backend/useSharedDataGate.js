import {useEffect,useState} from 'react';
import {createFirebaseRepository} from './firebaseRepository';
import {schoolFirebase} from './firebaseClient';
import {schoolResources} from './schoolRoles';
import {sharedOperationalEnabled,sharedKeys,publishSharedRows,clearSharedSnapshots,setSharedSchoolIdentity} from './sharedReadCache';

export function useSharedDataGate(session){
 const [loadedSession,setLoadedSession]=useState(null),[error,setError]=useState('');
 const [,refresh]=useState(0);
 const uid=session?.uid;
 useEffect(()=>{
  if(!sharedOperationalEnabled||!uid)return;
  let live=true,failed=false;const stops=[];setError("");clearSharedSnapshots();
  setSharedSchoolIdentity(session.school||{id:session.schoolId});
  const repo=createFirebaseRepository(schoolFirebase());
  repo.membership().then(member=>{
   if(!live)return;
   const names=Object.keys(sharedKeys).filter(name=>schoolResources(member).includes(name));
   const pending=new Set(names);
   for(const name of Object.keys(sharedKeys))publishSharedRows(name,[]);
   if(!names.length)setLoadedSession(session);
   for(const name of names)stops.push(repo.watch(name,rows=>{
    if(!live)return;publishSharedRows(name,rows);pending.delete(name);refresh(n=>n+1);
    if(!pending.size&&!failed)setLoadedSession(session);
   },failure=>{if(live){failed=true;setLoadedSession(null);setError(failure.message);}}));
  }).catch(failure=>{if(live)setError(failure.message);});
  return()=>{live=false;stops.forEach(stop=>stop());clearSharedSnapshots();};
 },[session,uid]);
 return {ready:!sharedOperationalEnabled||!uid||loadedSession===session,error};
}
