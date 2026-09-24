// Run only with the owner's explicit platform authority approval and a verified backup.
const fs=require('node:fs'),crypto=require('node:crypto');
const {getGlobalDefaultAccount}=require('firebase-tools/lib/auth');
const {requireAuth}=require('firebase-tools/lib/requireAuth');
const {Client}=require('firebase-tools/lib/apiv2');
(async()=>{
 const project='school-managment-8c102',email=String(process.argv[2]||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Supply the explicitly authorized existing owner email.');
 const raw=fs.readFileSync('platform-backup-report.local');
 const report=JSON.parse(raw.toString(raw[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
 const bytes=fs.readFileSync(report.backup);if(crypto.createHash('sha256').update(bytes).digest('hex')!==report.sha256)throw Error('Backup checksum mismatch.');
 const backup=JSON.parse(bytes);if(backup.project!==project)throw Error('Wrong backup project.');
 await requireAuth({...getGlobalDefaultAccount(),project});
 const auth=new Client({urlPrefix:'https://identitytoolkit.googleapis.com',apiVersion:'v1'}),db=new Client({urlPrefix:'https://firestore.googleapis.com',apiVersion:'v1'});
 const users=(await auth.post(`projects/${project}/accounts:lookup`,{email:[email]})).body.users||[];
 if(users.length!==1||users[0].disabled||users[0].email.toLowerCase()!==email)throw Error('Existing owner account is not verified.');
 const uid=users[0].localId,root=`projects/${project}/databases/(default)/documents`;
 const tenant=(await db.get(`${root}/schools/gbs-school`)).body;
 if(tenant.fields.udise?.stringValue!=='27190113523')throw Error('Unexpected existing school.');
 // Confirm protected school records still match the snapshot before adding authority.
 for(const old of backup.documents.filter(d=>!d.name.includes('/platform_rate_limits/'))){const now=(await db.get(old.name)).body;if(now.updateTime!==old.updateTime)throw Error('Data changed since backup: '+old.name);}
 const name=`${root}/platform_members/${uid}`;let existing;
 try{existing=(await db.get(name)).body;}catch(e){if(e.status!==404&&e.context?.response?.statusCode!==404&&!String(e.message).includes('404'))throw e;}
 if(existing){if(existing.fields.role?.stringValue!=='PLATFORM_SUPER_ADMIN'||existing.fields.active?.booleanValue!==true)throw Error('Existing platform membership requires review.');console.log('Existing platform owner verified.');return;}
 await db.post(`${root}:commit`,{writes:[{update:{name,fields:{role:{stringValue:'PLATFORM_SUPER_ADMIN'},active:{booleanValue:true},email:{stringValue:email}}},currentDocument:{exists:false}}]});
 console.log(JSON.stringify({uid,email,platformRole:'PLATFORM_SUPER_ADMIN',active:true,existingSchoolUnmodified:true,backupVerified:true,passwordChanged:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
