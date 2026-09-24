package com.gbsschool.app.feature.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun DemoUsers(repository:DemoServerRepository){
 var users by remember { mutableStateOf(emptyList<Map<String,Any?>>()) }
 var editing by remember { mutableStateOf<Map<String,Any?>?>(null) }
 var password by remember { mutableStateOf("") }
 var search by remember { mutableStateOf("") }
 var message by remember { mutableStateOf("") }
 var busy by remember { mutableStateOf(false) }
 val modules=listOf("Students","Teachers","Staff","Attendance","Communications","Notices","AcademicYears","Fees","Homework","Results","Library","Sports","Trips","Settings","AccessSetup","Certificates","IDCard","Formats","Reports","Backup")
 fun load(){repository.users().addOnSuccessListener { users=it }.addOnFailureListener { message=it.message ?: "User access failed." }}
 fun save(record:Map<String,Any?>){busy=true;repository.saveUser(record,password).addOnCompleteListener { result -> busy=false;if(result.isSuccessful){editing=null;password="";message="Demo user saved.";load()}else message=result.exception?.message ?: "Save failed." }}
 LaunchedEffect(repository){load()}
 Text("Users & Permissions",style=MaterialTheme.typography.titleLarge)
 Text("Demo accounts only. Production Firebase accounts remain unchanged. OTP: API REQUIRED.")
 Button(onClick={password="";editing=mapOf("role" to "TEACHER","active" to true,"modules" to listOf("Students","Attendance","Communications","Notices"),"writeModules" to listOf("Attendance","Communications"),"academicYear" to "2026-27")},enabled=!busy){Text("Add User")}
 OutlinedTextField(search,{search=it},label={Text("Search users")})
 editing?.let { form ->
  listOf("name","marathiName","employeeId","mobile","whatsapp","email","username","assignedClass","division","academicYear").forEach { key -> OutlinedTextField(form[key]?.toString() ?: "",{editing=form+(key to it)},label={Text(key)},modifier=Modifier.fillMaxWidth(),enabled=!busy) }
  var expanded by remember { mutableStateOf(false) }
  Box { OutlinedButton(onClick={expanded=true}){Text(form["role"].toString())};DropdownMenu(expanded,{expanded=false}){listOf("SUPER_ADMIN","ADMIN","HEADMASTER","TEACHER","CLASS_TEACHER","SPORTS_TEACHER","CLERK","ACCOUNTANT","LIBRARIAN","STAFF","VIEW_ONLY").forEach { role -> DropdownMenuItem(text={Text(role)},onClick={editing=form+("role" to role);expanded=false}) }} }
  OutlinedTextField(password,{password=it},label={Text("Temporary password (12+ characters)")},visualTransformation=PasswordVisualTransformation(),enabled=!busy)
  Text("Leave password blank when editing to keep the existing password.")
  Row { Checkbox(form["active"]!=false,{editing=form+("active" to it)});Text("Active") }
  for(permission in listOf("modules","writeModules")){
   Text(if(permission=="modules")"Module access" else "Create / Edit / Archive permission")
   val selected=(form[permission] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
   modules.forEach { module -> Row { Checkbox(module in selected,{checked->editing=form+(permission to if(checked)selected+module else selected-module)});Text(module) } }
  }
  Button(onClick={save(form)},enabled=!busy){Text("Save User")};TextButton(onClick={editing=null;password=""}){Text("Cancel")}
 }
 Text(message)
 users.filter { listOf(it["name"],it["email"],it["username"]).joinToString(" ").contains(search,true) }.forEach { user ->
  Card(Modifier.fillMaxWidth()){Column(Modifier.padding(12.dp)){
   Text("${user["name"]} · ${user["email"]}");Text("${user["role"]} · ${if(user["archived"]==true)"Archived" else if(user["active"]==true)"Active" else "Inactive"}")
   if(user["uid"]!="development-admin"){
    TextButton(onClick={password="";editing=user}){Text("Edit / Reset Password")}
    TextButton(onClick={password="";save(user+("active" to (user["active"]!=true)))},enabled=!busy){Text(if(user["active"]==true)"Disable" else "Activate")}
    TextButton(onClick={password="";save(user+mapOf("archived" to (user["archived"]!=true),"active" to false))},enabled=!busy){Text(if(user["archived"]==true)"Restore" else "Archive")}
   }
  }}
 }
}
