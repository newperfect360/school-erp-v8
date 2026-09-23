package com.gbsschool.app.feature.auth

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
import com.gbsschool.app.feature.operations.SchoolWorkspace

@Composable
fun SchoolEntry() {
    if (!BuildConfig.DEV_ADMIN_LOGIN) { ProductionSignIn(); return }
    var production by remember { mutableStateOf(false) }
    if (production) {
        Column { TextButton(onClick={production=false}) { Text("Development Admin Login") }; ProductionSignIn() }
        return
    }
    var signedIn by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var show by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val repository = remember(signedIn) { DevelopmentRepository() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        SchoolBrand()
        Text("DEVELOPMENT / TEST MODE",style=MaterialTheme.typography.titleMedium)
        if (!signedIn) {
            Text("Development Admin Login",style=MaterialTheme.typography.headlineSmall)
            Text("Local debug access. No internet or Firebase account required.")
            OutlinedTextField(username,{username=it},label={Text("Username / Email")},singleLine=true)
            OutlinedTextField(password,{password=it},label={Text("Password")},singleLine=true,visualTransformation=if(show) VisualTransformation.None else PasswordVisualTransformation())
            TextButton(onClick={show=!show}) { Text(if(show) "Hide password" else "Show password") }
            Button(onClick={
                if(username.trim().lowercase() in listOf("admin","dilippawar2207@gmail.com") && password=="admin1234") { signedIn=true; password="";error="" }
                else { error="Invalid development username or password.";password="" }
            }) { Text("Sign in") }
            if(error.isNotBlank()) Text(error)
            TextButton(onClick={production=true}) { Text("Firebase production sign-in") }
        } else {
            Text("School ERP Dashboard",style=MaterialTheme.typography.headlineSmall)
            Text("Role: SUPER_ADMIN")
            Text("Offline development session. Test records are isolated in memory and cleared on logout; they are not production or synchronized data.")
            Button(onClick={signedIn=false;username="";password=""}) { Text("Logout") }
            SchoolWorkspace(listOf("Students","Teachers","Staff","Attendance","Fees","Notices","AcademicYears","Homework","Results","Library","Sports","Trips","Communications"),repository,"development-admin")
        }
    }
}
