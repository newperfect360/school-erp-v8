import schema from '../../../shared/school-data-schema.json' with {type:'json'};

export const collections=schema.collections.filter(name=>name!=='audit_logs');
export const classId=student=>`${String(student.className||'').trim()}:${String(student.division||'').trim()}`;
export function recordId(value){const id=String(value||'');if(!id||id.includes('/')||id.length>300)throw Error('A stable, valid record ID is required.');return id}
export function validateMutation(mutation){
 if(!collections.includes(mutation.collection))throw Error('Unknown school collection.');
 recordId(mutation.id);
 if(!Number.isInteger(mutation.expectedVersion)||mutation.expectedVersion<0)throw Error('Expected version is required. Refresh before saving.');
 if(!mutation.data||typeof mutation.data!=='object'||Array.isArray(mutation.data))throw Error('Record data is required.');
 if(mutation.collection==='students'){
  if(mutation.data.id!==mutation.id)throw Error('Student ID cannot change.');
  if(!mutation.data.name?.trim()||!mutation.data.grNo?.trim())throw Error('Student name and GR number are required.');
  if(!/^[A-Za-z0-9._-]{1,100}$/.test(mutation.data.grNo))throw Error('Cloud GR numbers must contain letters, digits, dot, underscore or hyphen. Review other formats before migration.');
 }
 if(mutation.collection==='attendance'&&!schema.attendanceStatuses.includes(mutation.data.status))throw Error('Invalid attendance status.');
 return mutation;
}
export function conflictError(){const error=Error('This record changed on another device. Your pending change is retained. Refresh and review before retrying.');error.code='sync/conflict';return error}
