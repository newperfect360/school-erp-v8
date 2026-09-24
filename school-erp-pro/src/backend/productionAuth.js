import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import { schoolFirebase } from './firebaseClient';
import {tenantAuthEnabled,tenantRequest,selectSchool} from './tenantAuth';

export const authMessage = error => error?.code === 'auth/too-many-requests'
  ? 'Too many attempts. Please wait before trying again.'
  : 'Unable to complete this request. Check your details or contact the school administrator.';

export async function signIn(email, password, udise='') {
  const { auth } = schoolFirebase();
  if(tenantAuthEnabled){
    const resolved=await tenantRequest('identifier',udise.trim(),email);
    if(auth.currentUser)await signOut(auth);
    selectSchool(resolved.school);email=resolved.email;
  }
  await setPersistence(auth, browserSessionPersistence);
  const credential=await signInWithEmailAndPassword(auth, email.trim(), password);
  if(tenantAuthEnabled)try{await tenantRequest('session',udise.trim());}catch(error){await signOut(auth);throw error;}
  return credential;
}
export async function forgotPassword(email) {
  const { auth } = schoolFirebase();
  try { await sendPasswordResetEmail(auth, email.trim()); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
}
function checkPassword(password) {
  if (password.length < 12 || password.length > 128) throw Error('Use a password between 12 and 128 characters.');
  // Firebase enforces the configured server-side policy on update/reset.
}
export async function resetPassword(code, password) {
  const { auth } = schoolFirebase();
  checkPassword(password);
  await verifyPasswordResetCode(auth, code);
  await confirmPasswordReset(auth, code, password);
}
export async function changePassword(current, next) {
  const { auth } = schoolFirebase();
  if (!auth.currentUser?.email) throw Error('Sign in again.');
  checkPassword(next);
  if (current === next) throw Error('Choose a different password.');
  await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, current));
  await updatePassword(auth.currentUser, next);
  await signOut(auth);
}
