package com.gbsschool.app.feature.operations

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.gbsschool.app.BuildConfig
import com.gbsschool.app.data.firebase.FirebaseBackend
import com.gbsschool.app.data.firebase.SharedSchoolRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import java.util.UUID

private data class Screen(val module: String, val title: String, val collection: String, val fields: List<String>)
private val screens = listOf(
    Screen("Students", "Students / विद्यार्थी", "students", listOf("name","student_name_mr","grNo","className","division","rollNo","academicYear","fatherName","fatherMobile","motherName","motherMobile","emergencyName","emergencyContact")),
    Screen("Teachers", "Teachers / Staff", "teachers", listOf("name","designation","subject","mobile","email")),
    Screen("Attendance", "Attendance / उपस्थिती", "attendance", listOf("studentId","date","academicYear","status","arrivalTime","outTime","reason","remark")),
    Screen("Fees", "Fees / शुल्क", "fees", listOf("studentId","type","total","paid","receipt","date")),
    Screen("Notices", "Notices / सूचना", "notifications", listOf("title","text","date")),
    Screen("AcademicYears", "Academic years", "academic_years", listOf("name","startDate","endDate","status")),
    Screen("Homework", "Homework", "homework", listOf("title","className","division","subject","date","details")),
    Screen("Results", "Results / निकाल", "results", listOf("studentId","exam","subject","maxMarks","obtainedMarks","academicYear")),
    Screen("Library", "Library / ग्रंथालय", "library", listOf("bookId","name","author","copies","shelf")),
    Screen("Sports", "Sports", "sports", listOf("name","sport","quantity","condition")),
    Screen("Trips", "Educational trips", "trips", listOf("name","destination","startDate","returnDate","inCharge")),
    Screen("Communications", "Communication history", "communication_logs", listOf("studentId","channel","calledPerson","mobile","initiatedBy","date","time","outcome","remark")),
)

/** Live repository UI. Save succeeds only after the Firestore transaction acknowledges it. */
@Composable
fun SchoolWorkspace(modules: List<String>) {
    val context = LocalContext.current
    val repo = remember { SharedSchoolRepository(FirebaseBackend(FirebaseAuth.getInstance(), FirebaseFirestore.getInstance(), FirebaseStorage.getInstance()), BuildConfig.SCHOOL_TENANT_ID) }
    val allowed = screens.filter { it.module in modules }
    var selected by remember { mutableStateOf(allowed.firstOrNull()) }
    LaunchedEffect(modules) { if (selected !in allowed) selected = allowed.firstOrNull() }
    var ready by remember { mutableStateOf(false) }
    var rows by remember { mutableStateOf(emptyList<Map<String,Any>>()) }
    var students by remember { mutableStateOf(emptyList<Map<String,Any>>()) }
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var editing by remember { mutableStateOf<Map<String,Any>?>(null) }
    var form by remember { mutableStateOf<Map<String,String>?>(null) }
    var deleting by remember { mutableStateOf<Map<String,Any>?>(null) }
    var expanded by remember { mutableStateOf(false) }
    DisposableEffect(repo) {
        var live = true
        var stop: (() -> Unit)? = null
        repo.loadMembership().addOnCompleteListener { result ->
            if (live) {
                ready = result.isSuccessful
                if (!result.isSuccessful) message = result.exception?.message ?: "Membership verification failed."
                else if (allowed.any { "studentId" in it.fields } || "Students" in modules) stop = repo.watch("students", { students = it }, { message = it.message ?: "Student access failed." })
            }
        }
        onDispose { live = false; stop?.invoke() }
    }
    DisposableEffect(ready, selected) {
        rows = emptyList(); form = null; editing = null; search = ""
        val stop = if (ready && selected != null) repo.watch(selected!!.collection, { rows = it; message = "" }, { message = it.message ?: "Read failed. Check your connection and permissions." }) else null
        onDispose { stop?.invoke() }
    }
    fun data(row: Map<String,Any>): Map<*,*> = row["data"] as? Map<*,*> ?: emptyMap<String,Any>()
    fun commit(row: Map<String,Any>?, deleted: Boolean) {
        val screen = selected ?: return
        var id = row?.get("id")?.toString() ?: UUID.randomUUID().toString()
        val values = if (deleted) data(row!!).entries.associate { it.key.toString() to it.value }.toMutableMap() else data(row ?: emptyMap()).entries.associate { it.key.toString() to it.value }.toMutableMap().apply { putAll(form ?: emptyMap()) }
        val linked = students.find { it["id"] == values["studentId"] }
        var classId = row?.get("class_id")?.toString() ?: ""
        if (!deleted) {
            if (screen.fields.any { it in listOf("name","title","studentId") && values[it]?.toString().isNullOrBlank() }) { message = "Complete the required name, title or student field."; return }
            if (screen.collection == "students") {
                if (!Regex("[A-Za-z0-9._-]{1,100}").matches(values["grNo"].toString()) || values["className"].toString().isBlank() || values["division"].toString().isBlank()) { message = "Valid GR, class and division required."; return }
                val contacts = listOf("fatherMobile","motherMobile","emergencyContact").map { values[it]?.toString()?.trim() ?: "" }
                if (contacts.all { it.isBlank() } || contacts.any { it.isNotBlank() && !Regex("[+]?[0-9]{7,15}").matches(it.replace(Regex("[ ()-]"),"")) }) { message = "Provide a valid parent/emergency contact number."; return }
                values["id"] = id; classId = "${values["className"]}:${values["division"]}"
            } else if ("studentId" in screen.fields) {
                if (linked == null) { message = "Select an existing student."; return }
                classId = linked["class_id"].toString()
            }
            if (screen.collection == "attendance") {
                val statuses = listOf("Present","Absent","Late","Permission Leave","Early Leave","Approved Leave","Sick Leave","Official Duty")
                if (values["status"] !in statuses) { message = "Select a valid attendance status."; return }
                val date = values["date"]?.toString() ?: ""
                val format = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.ROOT).apply { isLenient = false }
                val validDate = try { Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}").matches(date) && format.format(format.parse(date)!!) == date && date <= format.format(java.util.Date()) } catch (_: Exception) { false }
                if (!validDate) { message = "Enter a valid non-future attendance date (YYYY-MM-DD)."; return }
                if (!Regex("[0-9]{4}-[0-9]{2}").matches(values["academicYear"].toString())) { message = "Select an academic year such as 2026-27."; return }
                if (row == null) id = values["studentId"].toString() + "_" + date + "_" + values["academicYear"].toString()
                val time = Regex("([01][0-9]|2[0-3]):[0-5][0-9]")
                if (values["status"] == "Late" && !time.matches(values["arrivalTime"].toString())) { message = "Late attendance needs arrival time (HH:MM)."; return }
                if (values["status"] in listOf("Permission Leave","Early Leave") && (!time.matches(values["outTime"].toString()) || values["reason"].toString().isBlank())) { message = "Permission/early leave needs out time and reason."; return }
            }
            if (screen.collection == "results") {
                if (listOf("exam","subject","academicYear").any { values[it].toString().isBlank() }) { message = "Exam, subject and academic year required."; return }
                val maximum = values["maxMarks"].toString().toDoubleOrNull()
                val obtained = values["obtainedMarks"].toString().toDoubleOrNull()
                if (maximum == null || obtained == null || !maximum.isFinite() || !obtained.isFinite() || maximum <= 0 || obtained < 0 || obtained > maximum) { message = "Marks must be between zero and the positive maximum."; return }
                values["maxMarks"] = maximum; values["obtainedMarks"] = obtained
            }
            if (screen.collection == "fees") {
                if (values["type"].toString().isBlank() || !Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}").matches(values["date"].toString())) { message = "Fee type and date required."; return }
                val total = values["total"].toString().toDoubleOrNull(); val paid = values["paid"].toString().toDoubleOrNull()
                if (total == null || paid == null || !total.isFinite() || !paid.isFinite() || total < 0 || paid < 0 || paid > total) { message = "Enter valid total and payment amounts."; return }
                if (paid > 0 && values["receipt"].toString().isBlank()) { message = "Receipt number required for a payment."; return }
                values["total"] = total; values["paid"] = paid
            }
        }
        busy = true; message = "Saving to school database…"
        try {
            repo.mutate(SchoolMutation(screen.collection,id,classId,(row?.get("version") as? Number)?.toLong() ?: 0,values,deleted)).addOnCompleteListener {
                busy = false
                if (it.isSuccessful) { form = null; editing = null; deleting = null; message = "Saved to school database." }
                else message = it.exception?.message ?: "Save failed. Your form is retained."
            }
        } catch (error: Exception) { busy = false; message = error.message ?: "Save failed." }
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("School workspace", style = MaterialTheme.typography.headlineSmall)
        if (allowed.isEmpty()) Text("No operational modules assigned.")
        Box {
            OutlinedButton(onClick = { expanded = true }, enabled = !busy) { Text(selected?.title ?: "Select module") }
            DropdownMenu(expanded, { expanded = false }) { allowed.forEach { screen -> DropdownMenuItem(text = { Text(screen.title) }, onClick = { selected = screen; expanded = false }) } }
        }
        OutlinedTextField(search, { search = it }, label = { Text("Search records") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = { editing = null; form = selected?.fields?.associateWith { if (it == "academicYear") "2026-27" else "" } }, enabled = ready && !busy && selected != null && selected?.collection != "communication_logs") { Text("Add record") }
        form?.let { current ->
            selected!!.fields.forEach { field ->
                if (field == "status" && selected?.collection == "attendance") {
                    var chooseStatus by remember { mutableStateOf(false) }
                    Box {
                        OutlinedButton(onClick = { chooseStatus = true }, enabled = !busy) { Text(current[field]?.ifBlank { "Select attendance status" } ?: "Select attendance status") }
                        DropdownMenu(chooseStatus, { chooseStatus = false }) { listOf("Present","Absent","Late","Permission Leave","Early Leave","Approved Leave","Sick Leave","Official Duty").forEach { status -> DropdownMenuItem(text = { Text(status) }, onClick = { form = current + (field to status); chooseStatus = false }) } }
                    }
                } else if (field == "studentId") {
                    var pick by remember { mutableStateOf(false) }
                    Box {
                        OutlinedButton(onClick = { pick = true }, enabled = !busy && !(editing != null && selected?.collection == "communication_logs")) { Text(students.find { it["id"] == current[field] }?.let { data(it)["name"].toString() } ?: "Select student") }
                        DropdownMenu(pick, { pick = false }) { students.forEach { student -> DropdownMenuItem(text = { Text("${data(student)["name"]} · ${data(student)["grNo"]}") }, onClick = { form = current + (field to student["id"].toString()); pick = false }) } }
                    }
                } else OutlinedTextField(current[field] ?: "", { form = current + (field to it) }, label = { Text(field) }, readOnly = editing != null && ((selected!!.collection == "students" && field == "grNo") || (selected!!.collection == "communication_logs" && field in listOf("calledPerson","mobile","initiatedBy","date","time","channel"))), enabled = !busy, modifier = Modifier.fillMaxWidth())
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { Button(onClick = { commit(editing,false) }, enabled = !busy) { Text("Save") }; TextButton(onClick = { form = null; editing = null }, enabled = !busy) { Text("Cancel") } }
        }
        rows.filter { data(it).values.joinToString(" ").contains(search,ignoreCase=true) }.forEach { row ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(12.dp)) {
                selected?.fields?.forEach { key -> Text("$key: ${data(row)[key] ?: ""}") }
                Row { TextButton(onClick = { editing = row; form = selected!!.fields.associateWith { data(row)[it]?.toString() ?: "" } }, enabled = !busy) { Text("Edit") }; TextButton(onClick = { deleting = row }, enabled = !busy) { Text("Archive") } }
                val contact = if (selected?.collection == "students") row else students.find { it["id"] == data(row)["studentId"] }
                if (contact != null && (selected?.collection == "students" || data(row)["status"] == "Absent")) {
                    listOf("Father" to "fatherMobile","Mother" to "motherMobile","Emergency" to "emergencyContact").forEach { (title,key) ->
                        val phone = data(contact)[key]?.toString()?.replace(Regex("[^+0-9]"),"") ?: ""
                        if (Regex("\\+?[0-9]{7,15}").matches(phone)) OutlinedButton(onClick = {
                            try {
                                context.startActivity(Intent(Intent.ACTION_DIAL,Uri.parse("tel:$phone")))
                                // Dialing never waits for a messaging API or the history write.
                                val now = java.util.Date()
                                val call = mapOf<String,Any?>("studentId" to contact["id"],"channel" to "Call","calledPerson" to title,"mobile" to phone,"initiatedBy" to FirebaseAuth.getInstance().currentUser?.uid,"date" to java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(now),"time" to java.text.SimpleDateFormat("HH:mm:ss",java.util.Locale.ROOT).format(now),"outcome" to "Dialer opened","remark" to "Call connection and duration are not verified.")
                                try {
                                    repo.mutate(SchoolMutation("communication_logs",UUID.randomUUID().toString(),contact["class_id"]?.toString() ?: "",0,call,false)).addOnCompleteListener { result -> message = if (result.isSuccessful) "Call attempt saved. Record the outcome in Communication history." else "Dialer opened, but call history was not saved. Check connection and permissions." }
                                } catch (_: Exception) { message = "Dialer opened, but call history was not saved. Check connection and permissions." }
                            } catch (_: Exception) { message = "No phone dialer is available on this device." }
                        }) { Text("Call $title") }
                    }
                }
            } }
        }
        if (message.isNotBlank()) Text(message)
    }
    deleting?.let { row -> AlertDialog(onDismissRequest = { if (!busy) deleting = null }, title = { Text("Archive this record?") }, text = { Text("The record and audit history are retained. It will be hidden from active lists.") }, confirmButton = { Button(onClick = { commit(row,true) },enabled=!busy) { Text("Archive") } }, dismissButton = { TextButton(onClick = { deleting = null },enabled=!busy) { Text("Cancel") } }) }
}
