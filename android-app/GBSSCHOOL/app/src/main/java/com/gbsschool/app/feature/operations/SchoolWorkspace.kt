package com.gbsschool.app.feature.operations

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.gbsschool.app.BuildConfig
import com.gbsschool.app.data.firebase.FirebaseBackend
import com.gbsschool.app.data.firebase.SharedSchoolRepository
import com.gbsschool.app.data.firebase.SchoolRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import java.util.UUID

private data class Screen(val module: String, val title: String, val collection: String, val fields: List<String>, val kind: String? = null)
private val screens = listOf(
    Screen("Students", "Students / विद्यार्थी", "students", listOf("name","student_name_mr","grNo","className","division","rollNo","academicYear","fatherName","fatherMobile","motherName","motherMobile","emergencyName","emergencyContact")),
    Screen("Teachers", "Teachers", "teachers", listOf("name","designation","subject","mobile","email"),"teacher"),
    Screen("Staff", "Staff", "teachers", listOf("employeeId","name","designation","subject","mobile","joiningDate"),"staff"),
    Screen("Attendance", "Attendance / उपस्थिती", "attendance", listOf("studentId","date","academicYear","status","arrivalTime","outTime","reason","remark")),
    Screen("Staff", "Staff Attendance", "teachers", listOf("employeeId","employeeName","date","status","inTime","outTime","correctionReason","remark"), "staff_attendance"),
    Screen("Fees", "Fees / शुल्क", "fees", listOf("studentId","type","total","paid","receipt","date")),
    Screen("Notices", "Notices / सूचना", "notifications", listOf("title","audience","text","date","channel"),"notice"),
    Screen("AcademicYears", "Academic years", "academic_years", listOf("name","startDate","endDate","status")),
    Screen("Homework", "Homework", "homework", listOf("title","className","division","subject","date","details"),"homework"),
    Screen("Classwork", "Classwork", "homework", listOf("className","division","subject","date","teacher","classwork"),"classwork"),
    Screen("Meetings", "Parent meetings", "parents", listOf("studentId","parent","teacher","date","time","purpose","discussion","outcome","followup"),"meeting"),
    Screen("Visits", "Parent visits", "parents", listOf("studentId","parent","teacher","date","time","purpose","discussion","outcome","followup"),"visit"),
    Screen("Results", "Results / निकाल", "results", listOf("studentId","exam","subject","maxMarks","obtainedMarks","academicYear")),
    Screen("Library", "Library / ग्रंथालय", "library", listOf("bookId","name","author","copies","shelf"),"book"),
    Screen("Sports", "Sports", "sports", listOf("name","sport","quantity","condition"),"equipment"),
    Screen("Trips", "Educational trips", "trips", listOf("name","destination","startDate","returnDate","inCharge")),
    Screen("Communications", "Communication history", "communication_logs", listOf("studentId","channel","calledPerson","mobile","initiatedBy","date","time","outcome","remark")),
)

/** Live repository UI. Save succeeds only after the Firestore transaction acknowledges it. */
@Composable
fun SchoolWorkspace(modules: List<String>, repository: SchoolRepository? = null, sessionActorUid: String? = null, schoolId: String = BuildConfig.SCHOOL_TENANT_ID) {
    val context = LocalContext.current
    val repo = remember(repository, schoolId) { repository ?: SharedSchoolRepository(FirebaseBackend(FirebaseAuth.getInstance(), FirebaseFirestore.getInstance(), FirebaseStorage.getInstance()), schoolId) }
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
    val audioPicker=rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if(uri!=null)try { context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply { type="audio/*";putExtra(Intent.EXTRA_STREAM,uri);addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) },"Share school audio notice")) } catch(_:Exception){message="No application can share this audio file."}
    }
    DisposableEffect(repo) {
        var live = true
        var stop: (() -> Unit)? = null
        repo.loadMembership().addOnCompleteListener { result ->
            if (live) {
                ready = result.isSuccessful
                if (!result.isSuccessful) message = result.exception?.message ?: "Membership verification failed."
                else if (allowed.any { "studentId" in it.fields } || "Students" in modules || "Trips" in modules) stop = repo.watch("students", { students = it }, { message = it.message ?: "Student access failed." })
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
        selected?.kind?.let { values["kind"] = it }
        val linked = students.find { it["id"] == values["studentId"] }
        var classId = row?.get("class_id")?.toString() ?: ""
        if(values.containsKey("className") && values.containsKey("division")) classId = "${values["className"]}:${values["division"]}"
        if (!deleted) {
            if(screen.collection == "homework") {
                val content = if(screen.kind == "classwork") "classwork" else "details"
                if(listOf("className","division","subject","date",content).any { values[it]?.toString().isNullOrBlank() }) { message = "Class, division, subject, date and lesson details are required."; return }
            }
            if(screen.collection == "parents" && screen.kind in listOf("meeting","visit") && listOf("parent","teacher","date","time","purpose").any { values[it]?.toString().isNullOrBlank() }) { message = "Parent, teacher, date, time and purpose are required."; return }
            if (screen.fields.any { it in listOf("name","title","studentId") && values[it]?.toString().isNullOrBlank() }) { message = "Complete the required name, title or student field."; return }
            if (screen.collection == "teachers" && screen.kind == "teacher") {
                if (values["subject"].toString().isBlank() || !Regex("[0-9]{10}").matches(values["mobile"].toString())) { message = "Teacher subject and a 10-digit mobile number required."; return }
                val emailValue = values["email"].toString()
                if (emailValue.isNotBlank() && !android.util.Patterns.EMAIL_ADDRESS.matcher(emailValue).matches()) { message = "Enter a valid email address."; return }
            }
            if (screen.collection == "teachers" && screen.kind == "staff" && values["employeeId"].toString().isBlank()) { message = "Staff employee ID required."; return }
            if(screen.kind == "staff_attendance") {
                if(values["employeeId"].toString().isBlank() || values["status"] !in listOf("Present","Absent","Late","On Leave","Half Day","Official Duty","Early Leave")) { message = "Select staff ID and a valid attendance status."; return }
                val date = values["date"].toString()
                val format = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.ROOT).apply { isLenient = false }
                val valid = try { format.format(format.parse(date)!!) == date && date <= format.format(java.util.Date()) } catch(_:Exception) { false }
                if(!valid) { message = "Enter a valid non-future date."; return }
                if(row != null && values["correctionReason"].toString().isBlank()) { message = "Enter the correction reason."; return }
                if(row == null) id = "staff_" + date + "_" + values["employeeId"].toString()
            }
            if (screen.collection in listOf("library","sports")) {
                val field = if (screen.collection == "library") "copies" else "quantity"
                val quantity = values[field].toString().toIntOrNull()
                if (quantity == null || quantity <= 0) { message = "Enter a positive whole-number stock quantity."; return }
                values[field] = quantity
                if (screen.collection == "library" && values["bookId"].toString().isBlank()) { message = "Book ID required."; return }
            }
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
                val statuses = listOf("Present","Absent","Late","Permission Leave","Early Leave","Approved Leave","Sick Leave","Half Day","Official Duty")
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
                val percentage=kotlin.math.round(obtained/maximum*10000)/100
                values["percentage"]=percentage;values["pass"]=percentage>=35
                values["grade"]=when { percentage>=90->"A+";percentage>=75->"A";percentage>=60->"B";percentage>=45->"C";percentage>=35->"D";else->"F" }
                values["component"]=values["component"] ?: "Theory"
            }
            if (screen.collection == "trips") {
                val ids = (form?.get("participantIds") ?: "").split(",").filter { it.isNotBlank() }
                if (ids.isEmpty() || ids.any { id -> students.none { it["id"] == id } }) { message = "Select at least one enrolled student."; return }
                if (listOf("destination","startDate","inCharge").any { values[it].toString().isBlank() }) { message = "Destination, start date and in-charge required."; return }
                val old = values["participants"] as? List<*> ?: emptyList<Any>()
                values["participants"] = ids.map { id -> old.filterIsInstance<Map<*,*>>().find { it["studentId"] == id } ?: mapOf("studentId" to id,"consent" to "Pending","boarding" to "Not recorded") }
                values.remove("participantIds")
                if (values["status"] == null) values["status"] = "Planned"
                if (values["updates"] == null) values["updates"] = emptyList<Any>()
            }
            if (screen.collection == "academic_years") {
                val year = values["name"].toString()
                if (!Regex("[0-9]{4}-[0-9]{2}").matches(year) || year.takeLast(2).toInt() != (year.take(4).toInt()+1)%100) { message = "Enter a consecutive academic year, for example 2026-27."; return }
                if (row == null) id = year
                if (id != year) { message = "The academic year identity cannot be renamed."; return }
                values["id"] = id
                if (values["status"].toString() !in listOf("Open","Closed","Archived")) { message = "Choose Open, Closed or Archived."; return }
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
            if (selected?.collection == "trips") {
                Text("Participating students")
                val ids = current["participantIds"].orEmpty().split(",").filter { it.isNotBlank() }
                students.forEach { student ->
                    val id = student["id"].toString()
                    Row { Checkbox(id in ids, { checked -> form = current + ("participantIds" to (if (checked) ids + id else ids - id).distinct().joinToString(",")) }); Text(data(student)["name"].toString()) }
                }
            }
            selected!!.fields.forEach { field ->
                if (field == "status" && selected?.collection == "attendance") {
                    var chooseStatus by remember { mutableStateOf(false) }
                    Box {
                        OutlinedButton(onClick = { chooseStatus = true }, enabled = !busy) { Text(current[field]?.ifBlank { "Select attendance status" } ?: "Select attendance status") }
                        DropdownMenu(chooseStatus, { chooseStatus = false }) { listOf("Present","Absent","Late","Permission Leave","Early Leave","Approved Leave","Sick Leave","Half Day","Official Duty").forEach { status -> DropdownMenuItem(text = { Text(status) }, onClick = { form = current + (field to status); chooseStatus = false }) } }
                    }
                } else if (field == "employeeId" && selected?.kind == "staff_attendance") {
                    var pickEmployee by remember { mutableStateOf(false) }
                    Box {
                        OutlinedButton(onClick = { pickEmployee = true }, enabled = !busy && editing == null) { Text(current["employeeName"]?.ifBlank { "Select employee" } ?: "Select employee") }
                        DropdownMenu(pickEmployee, { pickEmployee = false }) { rows.filter { (data(it)["kind"] ?: "teacher") in listOf("teacher","staff") }.forEach { employee -> DropdownMenuItem(text = { Text(data(employee)["name"].toString()) }, onClick = { form = current + mapOf("employeeId" to employee["id"].toString(), "employeeName" to data(employee)["name"].toString()); pickEmployee = false }) } }
                    }
                } else if (field == "status" && selected?.kind == "staff_attendance") {
                    var pickStatus by remember { mutableStateOf(false) }
                    Box {
                        OutlinedButton(onClick = { pickStatus = true }, enabled = !busy) { Text(current[field]?.ifBlank { "Select status" } ?: "Select status") }
                        DropdownMenu(pickStatus, { pickStatus = false }) { listOf("Present","Absent","Late","On Leave","Half Day","Official Duty","Early Leave").forEach { value -> DropdownMenuItem(text = { Text(value) }, onClick = { form = current + (field to value); pickStatus = false }) } }
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
        rows.filter { selected?.kind == null || (data(it)["kind"] ?: when(selected?.collection) { "teachers" -> "teacher"; "library" -> "book"; "sports" -> "equipment"; "notifications" -> "notice"; "homework" -> "homework"; else -> null }) == selected?.kind }.filter { data(it).values.joinToString(" ").contains(search,ignoreCase=true) }.forEach { row ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(12.dp)) {
                selected?.fields?.forEach { key -> Text("$key: ${data(row)[key] ?: ""}") }
                Row { TextButton(onClick = { editing = row; form = selected!!.fields.associateWith { data(row)[it]?.toString() ?: "" } + ("participantIds" to ((data(row)["participants"] as? List<*>)?.filterIsInstance<Map<*,*>>()?.mapNotNull { it["studentId"]?.toString() }?.joinToString(",") ?: "")) }, enabled = !busy) { Text("Edit") }; TextButton(onClick = { deleting = row }, enabled = !busy && selected?.kind != "staff_attendance") { Text("Archive") } }
                val contact = if (selected?.collection == "students") row else students.find { it["id"] == data(row)["studentId"] }
                if (contact != null && selected?.collection in listOf("students","attendance")) {
                    TextButton(onClick={audioPicker.launch("audio/*")}) { Text("Audio message — choose file") }
                    listOf("Father" to "fatherMobile","Mother" to "motherMobile","Emergency" to "emergencyContact").forEach { (title,key) ->
                        val phone = data(contact)[key]?.toString()?.replace(Regex("[^+0-9]"),"") ?: ""
                        if (Regex("\\+?[0-9]{7,15}").matches(phone)) {
                            val date=data(row)["date"]?.toString() ?: java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(java.util.Date())
                            val text=if(selected?.collection=="attendance")"Your child ${data(contact)["name"]}, Class ${data(contact)["className"]}/${data(contact)["division"]}, is marked ${data(row)["status"]} on $date. Please contact the school if required." else "Regarding your child ${data(contact)["name"]}, Class ${data(contact)["className"]}/${data(contact)["division"]}: please contact the school."
                            Row {
                                listOf("SMS","WhatsApp").forEach { channel -> TextButton(onClick={
                                    try {
                                        val digits=phone.removePrefix("+").let { if(it.length==10)"91$it" else it }
                                        val intent=if(channel=="SMS")Intent(Intent.ACTION_SENDTO,Uri.parse("smsto:$phone")).putExtra("sms_body",text) else Intent(Intent.ACTION_VIEW,Uri.parse("https://wa.me/$digits?text=${Uri.encode(text)}"))
                                        context.startActivity(intent)
                                        val log=mapOf<String,Any?>("studentId" to contact["id"],"channel" to channel.lowercase(),"calledPerson" to title,"parentMobile" to phone,"mobile" to phone,"message" to text,"date" to date,"initiatedAt" to java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.ROOT).format(java.util.Date()),"initiatedBy" to sessionActorUid,"status" to "Composer requested — delivery unverified")
                                        repo.mutate(SchoolMutation("communication_logs",UUID.randomUUID().toString(),contact["class_id"].toString(),0,log)).addOnFailureListener { message="Composer opened; history was not saved: ${it.message}" }
                                    }catch(_:Exception){message="No compatible application is installed for $channel."}
                                }) { Text("$channel $title") } }
                            }
                        }
                        if (Regex("\\+?[0-9]{7,15}").matches(phone)) OutlinedButton(onClick = {
                            try {
                                context.startActivity(Intent(Intent.ACTION_DIAL,Uri.parse("tel:$phone")))
                                // Dialing never waits for a messaging API or the history write.
                                val now = java.util.Date()
                                val call = mapOf<String,Any?>("studentId" to contact["id"],"channel" to "call","calledPerson" to title,"contactType" to title.lowercase(),"parentName" to (data(contact)[when(title) { "Father" -> "fatherName"; "Mother" -> "motherName"; else -> "emergencyName" }] ?: title),"parentMobile" to phone,"mobile" to phone,"attendanceDate" to (if (selected?.collection == "attendance") data(row)["date"] else java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(now)),"initiatedAt" to java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.ROOT).format(now),"status" to "Dialer requested","initiatedBy" to (sessionActorUid ?: FirebaseAuth.getInstance().currentUser?.uid),"date" to java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(now),"time" to java.text.SimpleDateFormat("HH:mm:ss",java.util.Locale.ROOT).format(now),"outcome" to "Dialer opened","remark" to "Call connection and duration are not verified.")
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
