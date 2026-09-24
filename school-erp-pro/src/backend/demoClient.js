// Runtime token/cache only. This client is enabled by the development-only auth entry.
let token='',snapshot={},enabled=false,revision=-1;
export const demoActive=()=>enabled;
export const demoKey=key=>enabled&&key!=='erp_pro_language'&&/^(erp_pro_[A-Za-z0-9_]+|schoolSettings)$/.test(key);
export const demoRead=key=>Object.hasOwn(snapshot,key)?JSON.stringify(snapshot[key]):null;
export async function demoRequest(action,body={}){
 const response=await fetch('/__school_demo/'+action,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'Demo server unavailable.'),{status:response.status});return result;
}
export function startDemo(result){token=result.token;enabled=true;snapshot=result.data;revision=result.revision;}
export function stopDemo(){token='';enabled=false;snapshot={};revision=-1;}
export async function refreshDemo(){if(!enabled)return;const currentToken=token,result=await demoRequest('snapshot');if(currentToken!==token||result.revision<revision)return;const changed=JSON.stringify(snapshot)!==JSON.stringify(result.data);snapshot=result.data;revision=result.revision;if(changed)window.dispatchEvent(new Event('school-data-changed'));return result.user;}
export function demoCommit(entries,expected){
 // Existing form/lifecycle transactions are synchronous. The local development
 // server acknowledges the complete batch before any UI reports Save success.
 const request=new XMLHttpRequest();request.open('POST','/__school_demo/commit',false);request.setRequestHeader('Content-Type','application/json');request.setRequestHeader('Authorization','Bearer '+token);
 request.send(JSON.stringify({entries,expected:expected||Object.fromEntries(Object.keys(entries).map(k=>[k,snapshot[k]??null]))}));
 const result=JSON.parse(request.responseText||'{}');if(request.status!==200)throw Error(result.error||'Demo server unavailable; no local copy was saved.');snapshot=result.data;revision=result.revision;window.dispatchEvent(new Event('school-data-changed'));
}
export const schoolStorage={
 getItem:key=>demoKey(key)?demoRead(key):localStorage.getItem(key),
 setItem:(key,value)=>{if(demoKey(key))demoCommit({[key]:JSON.parse(value)});else localStorage.setItem(key,value);},
 removeItem:key=>{if(demoKey(key))demoCommit({[key]:null});else localStorage.removeItem(key);},
 get length(){return this.keys().length;},key(index){return this.keys()[index]??null;},
 keys:()=>[...new Set([...Object.keys(localStorage).filter(k=>!demoKey(k)),...Object.keys(snapshot)])],
};
