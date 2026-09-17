package com.gbsschool.app.feature.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.gbsschool.app.core.designsystem.*

@Composable
fun LoginScreen(allowPreview: Boolean, onPreview: () -> Unit) {
    var identity by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var visible by remember { mutableStateOf(false) }
    var attempted by remember { mutableStateOf(false) }
    var showSetup by remember { mutableStateOf(false) }

    Surface(Modifier.fillMaxSize(), color = Canvas) {
      Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Column(
            Modifier.widthIn(max = 560.dp).fillMaxWidth().safeDrawingPadding().imePadding().verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { SchoolBrand() }
            Spacer(Modifier.height(20.dp))
            CampusIllustration(Modifier.widthIn(max = 400.dp))
            Spacer(Modifier.height(20.dp))
            Text("A brighter school day.", style = MaterialTheme.typography.headlineMedium)
            Text("Your school community, connected.", color = Muted, modifier = Modifier.padding(top = 8.dp, bottom = 24.dp))
            Card(Modifier.widthIn(max = 480.dp).fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Welcome back", style = MaterialTheme.typography.titleLarge)
                    Text("Sign in with your school account", color = Muted, style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(
                        value = identity, onValueChange = { identity = it }, label = { Text("School email or mobile") },
                        singleLine = true, modifier = Modifier.fillMaxWidth(),
                        isError = attempted && identity.isBlank(),
                        supportingText = if (attempted && identity.isBlank()) ({ Text("Enter your school email or mobile") }) else null,
                    )
                    OutlinedTextField(
                        value = password, onValueChange = { password = it }, label = { Text("Password") },
                        singleLine = true, modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = attempted && password.isBlank(),
                        trailingIcon = { IconButton(onClick = { visible = !visible }) {
                            Icon(if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                if (visible) "Hide password" else "Show password")
                        } },
                    )
                    Button(onClick = {
                        attempted = true
                        if (identity.isNotBlank() && password.isNotBlank()) showSetup = true
                    }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)) { Text("Sign in") }
                    Text("School sign-in will be enabled when your administrator connects the backend.",
                        style = MaterialTheme.typography.bodySmall, color = Muted)
                }
            }
            if (allowPreview) {
                OutlinedButton(onClick = onPreview, modifier = Modifier.padding(top = 20.dp).heightIn(min = 48.dp)) {
                    Text("Explore preview dashboard")
                }
                Text("Design preview · No account required", style = MaterialTheme.typography.bodySmall, color = Muted)
            }
            Spacer(Modifier.height(28.dp))
            Text("ज्ञान • संस्कार • प्रगती", color = Muted, style = MaterialTheme.typography.bodyMedium)
        }
      }
    }
    if (showSetup) AlertDialog(
        onDismissRequest = { showSetup = false }, title = { Text("School sign-in is not connected") },
        text = { Text("This first build is a UI preview. Your details have not been sent or saved. Authentication and OTP will be connected in the next phase.") },
        confirmButton = { TextButton(onClick = { showSetup = false }) { Text("Got it") } },
    )
}

@Preview(showBackground = true, widthDp = 411, heightDp = 915)
@Composable
private fun LoginPreview() { SchoolTheme { LoginScreen(true, {}) } }
