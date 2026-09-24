package com.gbsschool.app.feature.auth

import android.os.Handler
import android.os.Looper
import com.gbsschool.app.data.firebase.SchoolRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import org.json.JSONObject
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/** Debug-only shared Web/Android store; no device-local operational database. */
@Suppress("UNCHECKED_CAST")
class DemoServerRepository(private val baseUrl: String = "http://127.0.0.1:5178") : SchoolRepository {
    private val executor = Executors.newSingleThreadExecutor()
    private var token = ""
    private var user = emptyMap<String, Any?>()
    private var cache = emptyMap<String, Any?>()
    private var revision = 0L
    private var versions = emptyMap<String,Any?>()
    private fun version(key:String)=(versions[key] as? Number)?.toLong() ?: 1L
    private val keys = mapOf("students" to listOf("erp_pro_students"),"teachers" to listOf("erp_pro_teachers","erp_pro_staff"),"attendance" to listOf("erp_pro_attendance"),"fees" to listOf("erp_pro_fee_ledger"),"notifications" to listOf("erp_pro_notices"),"academic_years" to listOf("erp_pro_academic_years"),"homework" to listOf("erp_pro_homework"),"results" to listOf("erp_pro_results"),"library" to listOf("erp_pro_library_books","erp_pro_library_loans"),"sports" to listOf("erp_pro_sports_equipment","erp_pro_sports_athletes","erp_pro_equipment_loans"),"trips" to listOf("erp_pro_trips"),"communication_logs" to listOf("erp_pro_absence_communications"))
    private fun decode(value: Any?): Any? = when(value) {
        JSONObject.NULL -> null
        is JSONObject -> value.keys().asSequence().associateWith { decode(value.get(it)) }
        is JSONArray -> (0 until value.length()).map { decode(value.get(it)) }
        else -> value
    }
    private fun request(action: String, body: Map<String, Any?> = emptyMap()): Map<String, Any?> {
        require(baseUrl in listOf("http://127.0.0.1:5178","http://10.0.2.2:5178")) { "Use USB reverse or the emulator address." }
        val connection = URL("$baseUrl/__school_demo/$action").openConnection() as HttpURLConnection
        try {
            connection.requestMethod="POST";connection.connectTimeout=5000;connection.readTimeout=10000;connection.doOutput=true
            connection.setRequestProperty("Content-Type","application/json");connection.setRequestProperty("Authorization","Bearer $token")
            connection.outputStream.use { it.write(JSONObject(body).toString().toByteArray(Charsets.UTF_8)) }
            val ok=connection.responseCode==200
            val text=(if(ok) connection.inputStream else connection.errorStream).bufferedReader().use { it.readText() }
            val result=decode(JSONObject(text)) as Map<String,Any?>
            check(ok) { result["error"]?.toString() ?: "Demo request failed." };return result
        } finally { connection.disconnect() }
    }
    private fun accept(result: Map<String,Any?>) { cache=result["data"] as? Map<String,Any?> ?: cache;revision=(result["revision"] as? Number)?.toLong() ?: revision;versions=result["versions"] as? Map<String,Any?> ?: versions }
    fun login(username: String, password: String,udise:String=""): Task<Map<String,Any?>> = Tasks.call(executor) {
        val result=request("login",mapOf("username" to username,"password" to password,"udise" to udise));token=result["token"].toString();user=(result["user"] as Map<String,Any?>)+mapOf("school" to result["school"]);accept(result);user
    }
    fun logout() { executor.execute { try { request("logout") } catch (_:Exception) {} finally { token="";cache=emptyMap() } } }
    fun users():Task<List<Map<String,Any?>>> = Tasks.call(executor) { request("users")["users"] as List<Map<String,Any?>> }
    fun saveUser(record:Map<String,Any?>,password:String):Task<Void> = Tasks.call(executor) { request("save-user",mapOf("user" to record,"password" to password));null }
    fun changePassword(current:String,next:String):Task<Void> = Tasks.call(executor) { request("password",mapOf("current" to current,"next" to next));null }
    override fun loadMembership(): Task<Map<String, Any?>> = Tasks.call(executor) { check(token.isNotBlank()) { "Connect to the demo server first." };user }
    private fun rows(collection: String): List<Map<String,Any>> {
        if(collection=="attendance") {
            val days=cache["erp_pro_attendance"] as? Map<String,Any?> ?: emptyMap()
            val years=cache["erp_pro_attendance_years"] as? Map<String,Any?> ?: emptyMap()
            val records=days.flatMap { (date,entries) -> (entries as? Map<String,Any?> ?: emptyMap()).map { (id,status) ->
                val year=years[date]?.toString() ?: "2026-27"
                mapOf("id" to "${id}_${date}_$year","version" to version("erp_pro_attendance"),"class_id" to "","data" to mapOf("studentId" to id,"date" to date,"academicYear" to year,"status" to (status ?: "Not Marked")))
            } }.associateBy { it["id"].toString() }.toMutableMap()
            val drafts=cache["erp_pro_attendance_drafts"] as? Map<String,Any?> ?: emptyMap()
            drafts.forEach { (key,value) ->
                val parts=JSONArray(key);val year=parts.getString(0);val date=parts.getString(1);val student=parts.getString(2)
                val id="${student}_${date}_$year"
                records[id]=mapOf("id" to id,"version" to version("erp_pro_attendance_drafts"),"class_id" to "","data" to ((value as? Map<String,Any> ?: emptyMap())+mapOf("studentId" to student,"date" to date,"academicYear" to year)))
            }
            return records.values.toList()
        }
        return (keys[collection] ?: emptyList()).flatMapIndexed { index,key ->
            (cache[key] as? List<Map<String,Any?>> ?: emptyList()).filter { it["archivedAt"]==null }.map { source ->
                val row=source.filterValues { it!=null }.mapValues { it.value!! }.toMutableMap()
                if(collection=="teachers")row["kind"]=if(index==0)"teacher" else "staff"
                if(collection=="library")row["kind"]=if(index==0)"book" else "loan"
                if(collection=="sports")row["kind"]=listOf("equipment","athlete","loan")[index]
                mapOf("id" to row["id"].toString(),"version" to version(key),"class_id" to "${row["className"] ?: ""}:${row["division"] ?: ""}","data" to row)
            }
        }
    }
    override fun watch(collection: String,onRows:(List<Map<String,Any>>)->Unit,onError:(Exception)->Unit):()->Unit {
        val handler=Handler(Looper.getMainLooper());var live=true
        val poll=object:Runnable { override fun run(){if(!live)return
            Tasks.call(executor) { val result=request("snapshot");accept(result);rows(collection) }.addOnCompleteListener { result ->
                if(live){if(result.isSuccessful)onRows(result.result) else onError(result.exception ?: Exception("Demo connection failed"));handler.postDelayed(this,2000)}
            }
        }}
        handler.post(poll);return { live=false;handler.removeCallbacks(poll) }
    }
    override fun mutate(change:SchoolMutation):Task<Void> = Tasks.call(executor) {
        val entries=mutableMapOf<String,Any?>()
        if(change.collection=="attendance") {
            val date=change.data["date"].toString();val id=change.data["studentId"].toString()
            val year=change.data["academicYear"].toString()
            val student=(cache["erp_pro_students"] as? List<Map<String,Any?>> ?: emptyList()).firstOrNull{it["id"]==id} ?: error("Student no longer exists.")
            check(student["academicYear"]==year) { "Select the student's enrolled academic year." }
            val group=JSONArray(listOf(year,student["className"],student["division"] ?: "")).toString()
            val submissions=cache["erp_pro_attendance_submissions"] as? List<Map<String,Any?>> ?: emptyList()
            check(submissions.none{it["date"]==date&&it["groupKey"]==group}) { "Finalized attendance: use Full Web workspace for a reviewed correction." }
            val academicYears=cache["erp_pro_academic_years"] as? List<Map<String,Any?>> ?: emptyList()
            check(academicYears.none{it["id"]==year&&it["status"]!="Open"}) { "Academic year is closed." }
            val drafts=(cache["erp_pro_attendance_drafts"] as? Map<String,Any?> ?: emptyMap()).toMutableMap()
            val key=JSONArray(listOf(year,date,id)).toString()
            check(change.expectedVersion==0L||change.expectedVersion==version("erp_pro_attendance_drafts")) { "Attendance changed; reopen it before saving." }
            if(change.deleted)drafts.remove(key) else drafts[key]=(drafts[key] as? Map<String,Any?> ?: emptyMap())+change.data
            entries["erp_pro_attendance_drafts"]=drafts
        } else {
            val group=keys[change.collection] ?: error("Unsupported demo collection")
            val index=if(change.collection=="sports")when(change.data["kind"]){"athlete"->1;"loan"->2;else->0} else when(change.data["kind"]){"staff","loan"->1;else->0}
            val key=group[index.coerceAtMost(group.lastIndex)]
            check(change.expectedVersion==0L||change.expectedVersion==version(key)) { "Record changed; reopen it before saving." }
            val old=cache[key] as? List<Map<String,Any?>> ?: emptyList()
            check(change.expectedVersion!=0L||old.none { it["id"].toString()==change.id }) { "Record already exists; reopen it before editing." }
            val saved=change.data.toMutableMap().apply { put("id",change.id);if(change.deleted){put("archivedAt",java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.ROOT).format(java.util.Date()));if(change.collection=="students")put("status","Archived")} }
            entries[key]=old.filter { it["id"].toString()!=change.id } + listOf(saved)
        }
        accept(request("commit",mapOf("entries" to entries,"expected" to entries.keys.associateWith { cache[it] })));null
    }
}
