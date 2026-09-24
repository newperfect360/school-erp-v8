package com.gbsschool.app.feature.auth

import android.os.SystemClock
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import com.gbsschool.app.data.firebase.TenantAuthentication
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.google.firebase.FirebaseApp
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.gbsschool.app.BuildConfig
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import kotlinx.coroutines.delay
import com.gbsschool.app.feature.operations.SchoolWorkspace

/** Uses the same Firebase Auth users and schools/{school}/members/{uid} as web. */
@Composable
fun ProductionSignIn(configurationAvailable: Boolean = true) {
    val context = LocalContext.current
    val requested = configurationAvailable && BuildConfig.FIREBASE_CONFIGURED && BuildConfig.TENANT_AUTH_URL.isNotBlank()
    val auth = remember(requested) { if(requested) runCatching { FirebaseApp.initializeApp(context); FirebaseAuth.getInstance() }.getOrNull() else null }
    val configured = requested && auth != null
    var udise by rememberSaveable { mutableStateOf("") }
    var schoolId by rememberSaveable { mutableStateOf("") }
    var schoolName by rememberSaveable { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var nextPassword by remember { mutableStateOf("") }
    var visible by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var role by remember { mutableStateOf<String?>(null) }
    var modules by remember { mutableStateOf(listOf<String>()) }
    DisposableEffect(auth, schoolId) {
        var membership: ListenerRegistration? = null
        var school: ListenerRegistration? = null
        var live = true
        val listener = FirebaseAuth.AuthStateListener { provider ->
            membership?.remove(); school?.remove(); role = null; modules = emptyList()
            val user = provider.currentUser
            if (user != null && schoolId.isNotBlank()) {
                user.getIdToken(false).continueWithTask { token ->
                    TenantAuthentication.request("session", udise.trim(), token = token.result.token)
                }.addOnCompleteListener { verified ->
                    if (live && provider.currentUser?.uid == user.uid) {
                        if (!verified.isSuccessful || verified.result.getJSONObject("school").optString("id") != schoolId) {
                            message = "This account has no verified access to the selected school."
                        } else {
                            var schoolActive = false
                            var memberRole: String? = null
                            var memberModules = listOf<String>()
                            fun publish() { if(live) { role = if(schoolActive) memberRole else null; modules = if(role != null) memberModules else emptyList() } }
                            school = FirebaseFirestore.getInstance().document("schools/$schoolId")
                                .addSnapshotListener(MetadataChanges.INCLUDE) { snapshot, error ->
                                    schoolActive = error == null && snapshot != null && !snapshot.metadata.isFromCache && snapshot.getString("status") == "ACTIVE"
                                    publish()
                                }
                            membership = FirebaseFirestore.getInstance().document("schools/$schoolId/members/${user.uid}")
                                .addSnapshotListener(MetadataChanges.INCLUDE) { snapshot, error ->
                                    if(error != null || snapshot == null || snapshot.metadata.isFromCache || snapshot.getBoolean("active") != true || snapshot.getBoolean("passwordSetupComplete") != true) {
                                        memberRole = null; memberModules = emptyList()
                                    } else {
                                        memberRole = snapshot.getString("role")
                                        memberModules = (snapshot.get("modules") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                                        message = ""
                                    }
                                    publish()
                                }
                        }
                    }
                }
            }
        }
        auth?.addAuthStateListener(listener)
        onDispose { live = false; auth?.removeAuthStateListener(listener); membership?.remove(); school?.remove() }
    }
    // Conservative maximum session lifetime, including time spent in background.
    LaunchedEffect(role) {
        if (role != null) {
            val started = SystemClock.elapsedRealtime()
            while (SystemClock.elapsedRealtime() - started < 15 * 60 * 1000L) delay(1000)
            auth?.signOut(); message = "Session expired. Sign in again."
        }
    }
    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.safeDrawingPadding().imePadding().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Perfect Education", style = MaterialTheme.typography.headlineMedium)
            Text("School Management Platform")
            if (!configured) Text("School sign-in configuration is required. Contact your administrator.")
            Text(if (role == null) "School sign-in" else "Account security", style = MaterialTheme.typography.headlineMedium)
            if (role == null) {
                OutlinedTextField(udise, { udise = it; schoolId = ""; schoolName = "" }, label = { Text("School UDISE Code") }, singleLine = true)
                OutlinedTextField(email, { email = it }, label = { Text("User ID / Email / Mobile") }, singleLine = true)
                OutlinedTextField(password, { password = it }, label = { Text("Password") }, singleLine = true,
                    visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation())
                Button(enabled = configured && !busy && email.isNotBlank() && password.isNotBlank(), onClick = {
                    busy = true
                    message = ""
                    TenantAuthentication.request("identifier", udise.trim(), email.trim()).addOnCompleteListener { resolved ->
                        if(!resolved.isSuccessful) { busy = false; message = resolved.exception?.message ?: "School could not be identified." }
                        else {
                            val result = resolved.result
                            val school = result.getJSONObject("school")
                            auth!!.signOut()
                            schoolId = school.getString("id")
                            schoolName = school.optString("schoolName")
                            auth.signInWithEmailAndPassword(result.getString("email"), password).addOnCompleteListener {
                                busy = false; password = ""
                                if(!it.isSuccessful) message = "Sign-in failed. Check your details or try again later."
                            }
                        }
                    }
                }) { Text("Sign in") }
                TextButton(enabled = configured && !busy && email.isNotBlank(), onClick = {
                    busy = true
                    auth!!.sendPasswordResetEmail(email.trim()).addOnCompleteListener {
                        busy = false; message = "If this account is eligible, a password reset link will be sent. Check your email or contact the school administrator."
                    }
                }) { Text("Forgot Password / Reset Password") }
            } else {
                Text("Role: $role")
                Text("Assigned modules: ${modules.joinToString()}")
                Text("$schoolName | UDISE: $udise | Tenant: $schoolId")
                key(schoolId) { SchoolWorkspace(modules, schoolId = schoolId) }
                OutlinedTextField(password, { password = it }, label = { Text("Current password") }, visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation())
                OutlinedTextField(nextPassword, { nextPassword = it }, label = { Text("New password (12+ characters)") }, visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation())
                Button(enabled = !busy && password.isNotBlank() && nextPassword.length in 12..128 && password != nextPassword, onClick = {
                    val user = auth?.currentUser
                    if (user?.email != null) {
                        busy = true
                        user.reauthenticate(EmailAuthProvider.getCredential(user.email!!, password)).addOnCompleteListener { reauth ->
                            if (!reauth.isSuccessful) { busy = false; message = "Current password could not be verified." }
                            else user.updatePassword(nextPassword).addOnCompleteListener { changed ->
                                busy = false; password = ""; nextPassword = ""
                                if (changed.isSuccessful) { auth.signOut(); message = "Password changed. Sign in again." }
                                else message = "Password change failed. Check the school password policy."
                            }
                        }
                    }
                }) { Text("Change Password") }
            }
            TextButton(onClick = { visible = !visible }) { Text(if (visible) "Hide passwords" else "Show passwords") }
            if (auth?.currentUser != null) TextButton(onClick = { auth.signOut(); password = ""; nextPassword = "" }) { Text("Logout") }
            if (message.isNotBlank()) Text(message)
        }
    }
}
