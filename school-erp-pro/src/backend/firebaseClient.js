import {initializeApp,getApps} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
import {getStorage,connectStorageEmulator} from 'firebase/storage';

export const cloudEnabled=import.meta.env.VITE_SCHOOL_DATA_MODE==='firebase';
let client;
export function schoolFirebase(){
 if(client)return client;
 if(!cloudEnabled)throw Error('Shared backend is not configured.');
 const emulator=import.meta.env.VITE_FIREBASE_EMULATORS==='true';
 const config={projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,apiKey:import.meta.env.VITE_FIREBASE_API_KEY,appId:import.meta.env.VITE_FIREBASE_APP_ID,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET};
 if(!config.projectId||!config.apiKey||!config.appId)throw Error('Complete the approved public Firebase client configuration.');
 const schoolId=import.meta.env.VITE_SCHOOL_ID;
 if(!schoolId||schoolId.includes('/'))throw Error('A valid school tenant ID is required.');
 if(emulator&&!config.projectId.startsWith('demo-'))throw Error('Local emulator mode requires a demo- project ID, never a live school project.');
 const app=getApps().find(a=>a.name==='shared-school')||initializeApp(config,'shared-school');
 const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
 if(emulator){const host=import.meta.env.VITE_FIREBASE_EMULATOR_HOST||'127.0.0.1';connectAuthEmulator(auth,`http://${host}:9099`,{disableWarnings:true});connectFirestoreEmulator(db,host,8080);connectStorageEmulator(storage,host,9199)}
 client={app,auth,db,storage,schoolId,projectId:config.projectId,emulator};
 return client;
}
export async function signInSchool(email,password){const {auth}=schoolFirebase();return signInWithEmailAndPassword(auth,email.trim(),password)}
export async function signOutSchool(){return signOut(schoolFirebase().auth)}
