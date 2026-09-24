export function studentReference(id,tenantId){return tenantId?`perfectedu:student:v2:${encodeURIComponent(tenantId)}:${encodeURIComponent(id)}`:`schoolerp:student:v1:${encodeURIComponent(id)}`;}
export function resolveReference(reference,students,tenantId,{includeArchived=false}={}){
 const value=String(reference||'').trim();let id='';
 try{
  if(value.startsWith('perfectedu:student:v2:')){const parts=value.slice('perfectedu:student:v2:'.length).split(':');if(parts.length!==2||!tenantId||decodeURIComponent(parts[0])!==tenantId)return null;id=decodeURIComponent(parts[1]);}
  else if(value.startsWith('schoolerp:student:v1:')){if(tenantId&&tenantId!=='gbs-school')return null;id=decodeURIComponent(value.slice('schoolerp:student:v1:'.length));}
 }catch{return null;}
 const matches=students.filter(s=>(includeArchived||!s.archivedAt)&&(id?String(s.id)===id:String(s.grNo)===value));return matches.length===1?matches[0]:null;
}
