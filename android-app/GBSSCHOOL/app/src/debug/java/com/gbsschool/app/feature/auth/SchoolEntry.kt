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
    var udise by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var show by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var emulator by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var member by remember { mutableStateOf<Map<String,Any?>>(emptyMap()) }
    var usersScreen by remember { mutableStateOf(false) }
    var webWorkspace by remember { mutableStateOf(false) }
    val repository = remember(emulator) { DemoServerRepository(if(emulator) "http://10.0.2.2:5178" else "http://127.0.0.1:5178") }
    if(webWorkspace){DemoWebWorkspace(emulator){webWorkspace=false};return}
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        Text("Perfect Education",style=MaterialTheme.typography.headlineMedium)
        Text("www.perfectedu.co.in")
        Text("DEVELOPMENT / TEST MODE",style=MaterialTheme.typography.titleMedium)
        if (!signedIn) {
            Text("Development Admin Login",style=MaterialTheme.typography.headlineSmall)
            Text("Perfect Education DEMO / TEST BUILD. Uses the same computer demo server as Web. For a USB phone run: adb reverse tcp:5178 tcp:5178. No Firebase account is needed.")
            Row { Checkbox(emulator,{emulator=it},enabled=!busy);Text("Android emulator connection") }
            OutlinedTextField(udise,{udise=it},label={Text("School UDISE Code")},singleLine=true)
            OutlinedTextField(username,{username=it},label={Text("Username / Email")},singleLine=true)
            OutlinedTextField(password,{password=it},label={Text("Password")},singleLine=true,visualTransformation=if(show) VisualTransformation.None else PasswordVisualTransformation())
            TextButton(onClick={show=!show}) { Text(if(show) "Hide password" else "Show password") }
            Button(enabled=!busy,onClick={
                busy=true;error=""
                repository.login(username.trim(),password,udise.trim()).addOnCompleteListener { result ->
                    busy=false;password=""
                    if(result.isSuccessful){member=result.result;signedIn=true}else error=result.exception?.message ?: "Connect to the running Web demo server."
                }
            }) { Text("Sign in") }
            if(error.isNotBlank()) Text(error)
            TextButton(onClick={production=true}) { Text("Firebase production sign-in") }
        } else {
            Text("School ERP Dashboard",style=MaterialTheme.typography.headlineSmall)
            Text("Role: ${member["role"]}")
            val school=member["school"] as? Map<*,*>
            Text("${school?.get("schoolNameEn").toString().ifBlank{school?.get("schoolNameMr").toString()}} · UDISE: ${member["udise"]} · Tenant: ${member["schoolId"]}")
            Button(onClick={webWorkspace=true}){Text("Full Web workspace / Documents / Excel")}
            Button(onClick={repository.logout();signedIn=false;username="";password=""}) { Text("Logout") }
            val all=listOf("Students","Teachers","Staff","Attendance","Fees","Notices","AcademicYears","Homework","Results","Library","Sports","Trips","Communications")
            val assigned=(member["modules"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            val granted=if("*" in assigned)all else assigned
            if(member["role"]=="SUPER_ADMIN")TextButton(onClick={usersScreen=!usersScreen}){Text(if(usersScreen)"Back to school modules" else "Users & Permissions")}
            if(usersScreen&&member["role"]=="SUPER_ADMIN")DemoUsers(repository) else SchoolWorkspace(granted,repository,member["uid"]?.toString())
        }
    }
}
