// Monetary changes keep the original receipt and its complete revision history.
export function reviseFee(rows, id, patch, reason, actor, now) {
  if(!actor)throw Error('Verified user required.');
  const before=rows.find(row=>row.id===id);
  if(!before||before.voidedAt)throw Error('Choose an active fee record.');
  if(!reason?.trim())throw Error('A correction or void reason is required.');
  const allowed=['type','total','paid','receipt','date'];
  if(Object.keys(patch).some(key=>!allowed.includes(key)&&key!=='voidedAt'))throw Error('Student and receipt identity cannot change.');
  const after={...before,...patch};
  const current=new Date(now);
  const today=`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,"0")}-${String(current.getDate()).padStart(2,"0")}`;
  const parsedDate=new Date(after.date);
  if(!after.type?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(after.date||'')||!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==after.date||after.date>today)throw Error('Valid fee type and date required.');
  if(!Number.isFinite(Number(after.total))||!Number.isFinite(Number(after.paid))||Number(after.total)<0||Number(after.paid)<0||Number(after.paid)>Number(after.total))throw Error('Payment must be between zero and the total.');
  if(!/^\d+(\.\d{1,2})?$/.test(String(after.total))||!/^\d+(\.\d{1,2})?$/.test(String(after.paid)))throw Error('Use at most two decimal places.');
  after.receipt=String(after.receipt||'').trim();
  if(Number(after.paid)>0&&!after.receipt)throw Error('Receipt number required.');
  if(after.receipt&&rows.some(row=>row.id!==id&&String(row.receipt||'').toLowerCase()===after.receipt.toLowerCase()))throw Error('Receipt number already exists.');
  after.total=Number(after.total);after.paid=Number(after.paid);
  const {revisions:ignored,...snapshot}=before;void ignored;
  after.revisions=[...(before.revisions||[]),{before:snapshot,reason:reason.trim(),actor,at:now,action:patch.voidedAt?'Void':'Correction'}];
  after.updatedAt=now;
  return rows.map(row=>row.id===id?after:row);
}
