package com.gbsschool.app.feature.auth

import android.os.SystemClock
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.gbsschool.app.BuildConfig
import com.gbsschool.app.core.designsystem.SchoolBrand
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import kotlinx.coroutines.delay

/** Uses the same Firebase Auth users and schools/{school}/members/{uid} as web. */
@Composable
fun ProductionSignIn() {
    val configured = BuildConfig.FIREBASE_CONFIGURED && BuildConfig.SCHOOL_TENANT_ID.isNotBlank()
    val auth = remember { if (configured) FirebaseAuth.getInstance() else null }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var nextPassword by remember { mutableStateOf("") }
    var visible by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var role by remember { mutableStateOf<String?>(null) }
    var modules by remember { mutableStateOf(listOf<String>()) }
    DisposableEffect(auth) {
        var membership: ListenerRegistration? = null
        val listener = FirebaseAuth.AuthStateListener { provider ->
            membership?.remove(); role = null; modules = emptyList()
            provider.currentUser?.let { user ->
                membership = FirebaseFirestore.getInstance().document("schools/${BuildConfig.SCHOOL_TENANT_ID}/members/${user.uid}")
                    .addSnapshotListener(MetadataChanges.INCLUDE) { snapshot, error ->
                        if (error != null || snapshot == null || snapshot.metadata.isFromCache ||
                            snapshot.getBoolean("active") != true || snapshot.getBoolean("passwordSetupComplete") != true || snapshot.get("modules") !is List<*>) {
                            role = null; modules = emptyList(); message = "School access requires online verification and administrator activation."
                        } else {
                            role = snapshot.getString("role")
                            modules = (snapshot.get("modules") as List<*>).filterIsInstance<String>()
                            message = ""
                        }
                    }
            }
        }
        auth?.addAuthStateListener(listener)
        onDispose { auth?.removeAuthStateListener(listener); membership?.remove() }
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
            SchoolBrand()
            if (!configured) Text("School sign-in configuration is required. Contact your administrator.")
            Text(if (role == null) "School sign-in" else "Account security", style = MaterialTheme.typography.headlineMedium)
            if (role == null) {
                OutlinedTextField(email, { email = it }, label = { Text("School email") }, singleLine = true)
                OutlinedTextField(password, { password = it }, label = { Text("Password") }, singleLine = true,
                    visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation())
                Button(enabled = configured && !busy && email.isNotBlank() && password.isNotBlank(), onClick = {
                    busy = true
                    auth!!.signInWithEmailAndPassword(email.trim(), password).addOnCompleteListener {
                        busy = false; password = ""
                        if (!it.isSuccessful) message = "Sign-in failed. Check your details or try again later."
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
                Text("School data screens still require shared-data integration before production use.")
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
