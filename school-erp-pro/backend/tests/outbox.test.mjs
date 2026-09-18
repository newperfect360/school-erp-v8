import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSyncQueue} from '../../src/backend/syncQueue.js';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
const change={collection:'students',id:'stable-id',expectedVersion:2,data:{fatherMobile:'9000000001'}};
test('pending edits survive reload and successful sync clears only acknowledged edits',async()=>{
 const storage=memory();const first=createSyncQueue({storage,key:'school/user',send:async()=>{throw Error('offline')}});
 const item=first.enqueue(change);await first.flush();assert.equal(first.status().state,'Sync Failed');
 const sent=[];const reloaded=createSyncQueue({storage,key:'school/user',send:async row=>sent.push(row)});
 assert.equal(reloaded.status().pending,1);await reloaded.retry();assert.equal(sent[0].mutationId,item.mutationId);assert.equal(reloaded.status().state,'Synced');
});
test('conflict retains original version and blocks dependent edits',async()=>{
 const storage=memory();let calls=0;const queue=createSyncQueue({storage,key:'school/user',send:async()=>{calls++;throw Object.assign(Error('conflict'),{code:'sync/conflict'})}});
 const first=queue.enqueue(change);queue.enqueue({...change,data:{fatherMobile:'9000000002'}});await queue.flush();
 assert.equal(calls,1);assert.equal(queue.status().pending,2);assert.equal(queue.status().items[0].expectedVersion,2);assert.equal(queue.status().items[1].expectedVersion,3);
 assert.throws(()=>queue.discard(first.mutationId),/later pending/);await queue.retry();assert.equal(queue.status().items[0].expectedVersion,2);
});
test('storage failure never reports a queued write',()=>{
 const queue=createSyncQueue({key:'x',storage:{getItem:()=>null,setItem:()=>{throw Error('full')}},send:async()=>{}});
 assert.throws(()=>queue.enqueue(change),/full/);assert.equal(queue.status().pending,0);
});
