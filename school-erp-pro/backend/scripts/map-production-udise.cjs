// Owner-authorized, field-masked update of an existing tenant. No Auth writes.
const fs=require('node:fs');
const {getGlobalDefaultAccount}=require('firebase-tools/lib/auth');
const {requireAuth}=require('firebase-tools/lib/requireAuth');
const {Client}=require('firebase-tools/lib/apiv2');
async function main(){
 const [backupPath,udise]=process.argv.slice(2);
 if(!/^\d{11}$/.test(udise||''))throw Error('An owner-verified 11-digit UDISE is required.');
 const backup=JSON.parse(fs.readFileSync(backupPath,'utf8'));
 const project='school-managment-8c102',school='gbs-school';
 if(backup.project!==project||!backup.rules||!backup.documents?.length)throw Error('Verified project backup required.');
 await requireAuth({...getGlobalDefaultAccount(),project});
 const auth=new Client({urlPrefix:'https://identitytoolkit.googleapis.com',apiVersion:'v1'});
 const lookup=await auth.post(`projects/${project}/accounts:lookup`,{email:['dilippawar2207@gmail.com']});
 const users=lookup.body.users||[];
 if(users.length!==1||users[0].disabled||users[0].localId!=='F2k0InkD73eV9bDjXRNzl1Bw34j1')throw Error('Existing administrator identity verification failed.');
 const db=new Client({urlPrefix:'https://firestore.googleapis.com',apiVersion:'v1'});
 const root=`projects/${project}/databases/(default)/documents`;
 const name=`${root}/schools/${school}`;
 const member=(await db.get(`${name}/members/${users[0].localId}`)).body;
 if(member.fields?.active?.booleanValue!==true||member.fields?.role?.stringValue!=='SUPER_ADMIN')throw Error('Existing active SUPER_ADMIN membership required; do not silently rewrite its role.');
 let pageToken;
 do{const page=(await db.get(`${root}/schools`,{queryParams:{pageSize:100,...(pageToken?{pageToken}:{})}})).body;
  for(const row of page.documents||[])for(const key of ['udise','UDISE','udiseCode','udiseNumber']){
   const value=row.fields?.[key]?.stringValue||row.fields?.[key]?.integerValue;
   if(value===udise&&row.name!==name)throw Error('UDISE is already assigned to another school.');
   if(row.name===name&&value&&value!==udise)throw Error('Existing school UDISE differs.');
  }pageToken=page.nextPageToken;
 }while(pageToken);
 // Verify every backed-up record is unchanged before any write.
 for(const previous of backup.documents){const current=(await db.get(previous.name)).body;if(current.updateTime!==previous.updateTime)throw Error('Production changed since backup; take another backup before proceeding.');}
 const current=(await db.get(name)).body;
 const fields={tenantId:{stringValue:school},schoolId:{stringValue:school},udise:{stringValue:udise},status:{stringValue:'ACTIVE'}};
 await db.post(`${root}:commit`,{writes:[{update:{name,fields},updateMask:{fieldPaths:Object.keys(fields)},currentDocument:{updateTime:current.updateTime}}]});
 const result=(await db.get(name)).body;
 for(const [key,value]of Object.entries(fields))if(result.fields?.[key]?.stringValue!==value.stringValue)throw Error('Mapping readback failed.');
 for(const previous of backup.documents.filter(row=>row.name!==name)){const after=(await db.get(previous.name)).body;if(after.updateTime!==previous.updateTime)throw Error('Unrelated production record changed during verification.');}
 console.log(JSON.stringify({project,schoolId:school,udise,status:'ACTIVE',adminUid:users[0].localId,existingRole:member.fields.role.stringValue,otherDocumentsUnchanged:true,passwordChanged:false}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
