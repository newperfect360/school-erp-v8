import {useEffect,useRef,useState} from 'react';
import {developmentEnabled} from '@development-auth';
import {cloudEnabled,schoolFirebase} from './firebaseClient';
import {createFirebaseRepository} from './firebaseRepository';
import {useStoredState} from '../storage';
import {notify} from '../components/Feedback';
import {demoActive} from './demoClient';

/** Existing forms await this setter. Firebase mode never writes an operational local copy. */
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const defaultKinds={teachers:"teacher",library:"book",sports:"equipment",notifications:"notice",homework:'homework'};
export function useSharedRecords(collection,localKey,options={}) {
 const kind=options.kind||defaultKinds[collection]||"",aliasKey=JSON.stringify(options.aliases||{});
 const local=useStoredState(localKey,[]);
 const shared=!!collection&&cloudEnabled&&!developmentEnabled;
 const [rows,setRows]=useState([]),[status,setStatus]=useState(shared?'Loading school records…':''),[busy,setBusy]=useState(false);
 const repository=useRef(null),records=useRef(new Map()),saving=useRef(false);
 useEffect(()=>{
  if(!shared)return;
  let live=true,stop=()=>{};
  const repo=createFirebaseRepository(schoolFirebase());
  repo.membership().then(()=>{
   if(!live)return;
   repository.current=repo;
   stop=repo.watch(collection,items=>{
    if(!live)return;
    items=items.filter(item=>!kind||(item.data.kind||defaultKinds[collection])===kind);
    records.current=new Map(items.map(item=>[item.id,item]));
    setRows(items.map(item=>({...item.data,...Object.fromEntries(Object.entries(JSON.parse(aliasKey)).map(([label,key])=>[label,item.data[key]??item.data[label]??""])),id:item.id,__version:item.version})));
    setStatus('');
   },error=>{if(live){repository.current=null;setStatus(error.message);}});
  }).catch(error=>{if(live)setStatus(error.message);});
  return()=>{live=false;repository.current=null;records.current=new Map();stop();};
 },[shared,collection,kind,aliasKey]);
 async function save(next) {
  if(!shared){
   if(!demoActive())return local[1](next);
   const updated=typeof next==='function'?next(local[0]):next;
   return local[1](updated.map(item=>{const row={...item};for(const [label,key]of Object.entries(JSON.parse(aliasKey))){row[key]=row[label]??row[key]??'';if(label!==key)delete row[label];}if(kind)row.kind=kind;return row;}));
  }
  if(!repository.current||saving.current){notify('Wait for the school connection or current save.');return false;}
  saving.current=true;setBusy(true);setStatus('Saving to the school database...');
  try{
   const repo=repository.current,updates=typeof next==='function'?next(rows):next;
   if(!Array.isArray(updates)||new Set(updates.map(row=>row.id)).size!==updates.length)throw Error('Every record needs one unique ID.');
   const changed=[];
   for(const item of updates){
    const {__version,...data}=item,previous=records.current.get(item.id);
    for(const [label,key]of Object.entries(JSON.parse(aliasKey))){data[key]=data[label]??data[key]??"";if(label!==key)delete data[label];}
    if(kind)data.kind=kind;
    const before=previous?{...previous.data,id:previous.id}:null;
    if(before){if(kind&&!before.kind)before.kind=kind;for(const [label,key]of Object.entries(JSON.parse(aliasKey))){before[key]=before[key]??before[label]??"";if(label!==key)delete before[label];}}
    if(!previous||stable(before)!==stable(data)){
     let classId=typeof data.className==='string'&&typeof data.division==='string'?data.className+':'+data.division:previous?.class_id||'';
     if(data.studentId)classId=(await repo.read('students',data.studentId)).class_id;
     changed.push({collection,id:item.id,classId,expectedVersion:__version??0,data,mutationId:crypto.randomUUID()});
    }
   }
   for(const previous of rows)if(!updates.some(row=>row.id===previous.id)){const original=records.current.get(previous.id);if(!original||original.version!==previous.__version)throw Error('Record changed. Refresh and review before deleting.');changed.push({collection,id:previous.id,classId:original.class_id,expectedVersion:previous.__version,data:original.data,deleted:true,mutationId:crypto.randomUUID()});}
   if(changed.length)await repo.mutateMany(changed);
   setStatus('Saved to the school database.');return true;
  }catch(error){setStatus(error.message);notify(error.message);return false;}
  finally{saving.current=false;setBusy(false);}
 }
 const localRows=demoActive()?local[0].map(item=>({...item,...Object.fromEntries(Object.entries(JSON.parse(aliasKey)).map(([label,key])=>[label,item[key]??item[label]??'']))})):local[0];
 return [shared?rows:localRows,save,{shared,busy,status},()=>{if(!shared)local[2]();}];
}
