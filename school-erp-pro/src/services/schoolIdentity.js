import {schoolStorage} from '../backend/demoClient';
import identity from '../../../assets/school-identity.json';
import logo from '../../../assets/school-logo.jpg?inline';

export const officialIdentity = {...identity,logo};
export function resolveSchoolSettings(saved={}) {
  if(saved.tenantId && saved.tenantId!=='gbs-school')return {...saved,schoolName:saved.schoolName||saved.schoolNameMr||saved.schoolNameEn||'',sansthaName:saved.sansthaName||saved.institutionNameMr||saved.institutionNameEn||'',address:saved.address||saved.addressMr||'',logo:saved.logo||''};
  const current=saved.identityRevision===identity.identityRevision;
  const schoolName=current?(saved.schoolName??saved.schoolNameMr??identity.schoolNameMr):identity.schoolNameMr;
  const sansthaName=current?(saved.sansthaName??saved.institutionNameMr??identity.institutionNameMr):identity.institutionNameMr;
  const address=current?(saved.address??saved.addressMr??identity.addressMr):identity.addressMr;
  return {...officialIdentity,...saved,identityRevision:identity.identityRevision,
    schoolName,schoolNameMr:schoolName,sansthaName,institutionNameMr:sansthaName,address,addressMr:address,
    schoolNameEn:current?(saved.schoolNameEn||''):'',institutionNameEn:current?(saved.institutionNameEn||''):'',addressEn:current?(saved.addressEn||''):'',
    logo:current?(saved.logo||logo):logo};
}
// One-time authorized identity correction. Preserve the exact previous settings,
// leave unrelated fields/records intact and never replace unreadable storage.
export function initializeSchoolIdentity() {
  try {
    const raw=schoolStorage.getItem('schoolSettings');
    if(raw===null)return;
    const saved=JSON.parse(raw);
    if(!saved||typeof saved!=='object'||Array.isArray(saved)||saved.identityRevision===identity.identityRevision)return;
    const backup='schoolSettings_before_'+identity.identityRevision;
    if(schoolStorage.getItem(backup)===null)schoolStorage.setItem(backup,raw);
    schoolStorage.setItem('schoolSettings',JSON.stringify(resolveSchoolSettings(saved)));
  } catch { /* Read-only defaults remain available; corrupt/full storage is not overwritten. */ }
}
