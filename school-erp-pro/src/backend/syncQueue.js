/** Durable, user-and-school scoped outbox. A failed mutation stays until reviewed. */
export function createSyncQueue({storage,key,send,onStatus=()=>{}}){
 let running=false,stopped=false;
 function read(){const raw=storage.getItem(key);if(!raw)return [];const value=JSON.parse(raw);if(!Array.isArray(value))throw Error('Pending sync storage is unreadable. It has not been replaced.');return value}
 function save(rows){storage.setItem(key,JSON.stringify(rows))}
 function status(){const rows=read();return {state:rows.some(r=>r.error)?'Sync Failed':rows.length?'Pending Sync':'Synced',pending:rows.length,items:rows}}
 function emit(){onStatus(status())}
 function enqueue(mutation){const rows=read();const prior=rows.filter(r=>r.collection===mutation.collection&&r.id===mutation.id).at(-1);const item={...mutation,expectedVersion:prior?prior.expectedVersion+1:mutation.expectedVersion,mutationId:crypto.randomUUID(),queuedAt:new Date().toISOString(),error:null};save([...rows,item]);emit();return item}
 async function flush(){if(running||stopped)return;running=true;try{while(!stopped){const item=read()[0];if(!item||item.error)break;try{await send(item);save(read().filter(row=>row.mutationId!==item.mutationId));emit()}catch(error){save(read().map(row=>row.mutationId===item.mutationId?{...row,error:error.message,code:error.code||'sync/failed'}:row));emit();break}}}finally{running=false}}
 function retry(){save(read().map(row=>({...row,error:null,code:null})));emit();return flush()}
 function discard(mutationId){const rows=read(),target=rows.find(r=>r.mutationId===mutationId);if(rows.some(r=>target&&r.collection===target.collection&&r.id===target.id&&r.expectedVersion>target.expectedVersion))throw Error('Review later pending changes to this record before discarding its earlier change.');save(rows.filter(r=>r.mutationId!==mutationId));emit()}
 return {enqueue,flush,retry,discard,status,stop(){stopped=true}};
}
