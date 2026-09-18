package com.gbsschool.app.data.firebase

import com.google.android.gms.tasks.Task
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import java.util.UUID

/** Shared protocol: shared/school-data-schema.json. No separate Android student IDs. */
data class SchoolMutation(
    val collection: String,
    val id: String,
    val classId: String,
    val expectedVersion: Long,
    val data: Map<String, Any?>,
    val deleted: Boolean = false,
    val mutationId: String = UUID.randomUUID().toString(),
)

class SharedSchoolRepository(private val backend: FirebaseBackend, val schoolId: String) {
    companion object {
        val collections = setOf("students", "parents", "teachers", "attendance", "academic_years", "homework", "exams", "results", "fees", "library", "sports", "scholarships", "trips", "certificates", "notifications", "communication_logs", "settings")
    }
    init { require(schoolId.isNotBlank() && !schoolId.contains('/')) }
    private val root = "schools/$schoolId"
    private var membership: Map<String, Any?>? = null
    private var verifiedUid: String? = null
    private fun uid() = requireNotNull(backend.auth.currentUser?.uid) { "Sign in to your school account." }
    private fun record(collection: String, id: String) = backend.firestore.document("$root/$collection/$id")

    fun loadMembership(): Task<Map<String, Any?>> {
        val user = uid()
        return record("members", user).get().continueWith { task ->
            val data = requireNotNull(task.result.data) { "No school membership." }
            check(data["active"] == true) { "School membership is inactive." }
            membership = data
            verifiedUid = user
            data
        }
    }

    /** Rules enforce both module permission and scope; errors must stay visible in the UI. */
    fun watch(collection: String, onRows: (List<Map<String, Any>>) -> Unit, onError: (Exception) -> Unit): () -> Unit {
        require(collection in collections)
        check(verifiedUid == uid()) { "Refresh school membership." }
        val member = requireNotNull(membership)
        val base = backend.firestore.collection("$root/$collection")
        val queries = mutableListOf<Query>()
        if (member["role"] in listOf("Admin", "Super Admin")) queries.add(base)
        else {
            if (collection in listOf("academic_years", "notifications", "settings") || (collection == "library" && member["role"] == "Library Staff")) queries.add(base.whereEqualTo("class_id", ""))
            (member["classIds"] as? List<*>)?.filterIsInstance<String>()?.chunked(30)?.forEach { queries.add(base.whereIn("class_id", it)) }
            (member["studentIds"] as? List<*>)?.filterIsInstance<String>()?.chunked(30)?.forEach { queries.add(base.whereIn(if (collection == "students") "id" else "data.studentId", it)) }
        }
        val buckets = mutableMapOf<Int, List<Map<String, Any>>>()
        val registrations = mutableListOf<ListenerRegistration>()
        if (queries.isEmpty()) onRows(emptyList())
        queries.forEachIndexed { index, query ->
            registrations.add(query.addSnapshotListener { snapshot, error ->
                if (error != null) onError(error)
                else if (snapshot != null) {
                    buckets[index] = snapshot.documents.mapNotNull { it.data }
                    onRows(buckets.values.flatten().associateBy { it["id"] }.values.filter { it["deleted"] != true })
                }
            })
        }
        return { registrations.forEach { it.remove() } }
    }

    /** Online transaction only. Offline callers must retain the original expectedVersion. */
    fun mutate(change: SchoolMutation): Task<Void> {
        require(change.collection in collections && change.id.isNotBlank() && !change.id.contains('/'))
        require(change.expectedVersion >= 0)
        val user = uid()
        check(verifiedUid == user) { "Refresh school membership." }
        return backend.firestore.runTransaction { transaction ->
            val target = record(change.collection, change.id)
            val previous = transaction.get(target)
            val version = previous.getLong("version") ?: 0L
            if (version != change.expectedVersion) {
                if (version == change.expectedVersion + 1) {
                    val audit = transaction.get(record("audit_logs", "${change.collection}_${change.id}_$version"))
                    if (audit.getString("mutation_id") == change.mutationId) return@runTransaction null
                }
                error("Sync conflict: record changed on another device. Pending change retained.")
            }
            var newGr: com.google.firebase.firestore.DocumentReference? = null
            if (change.collection == "students") {
                require(change.data["id"] == change.id)
                val gr = change.data["grNo"] as? String ?: error("GR number required.")
                require(gr.matches(Regex("^[A-Za-z0-9._-]{1,100}$")))
                val index = record("student_gr", gr.lowercase(java.util.Locale.ROOT))
                val existing = transaction.get(index)
                check(!existing.exists() || existing.getString("student_id") == change.id) { "GR number already belongs to another student." }
                check(!previous.exists() || previous.getString("data.grNo") == gr) { "GR number is immutable." }
                if (!existing.exists()) newGr = index
            }
            transaction.set(target, mapOf("id" to change.id, "class_id" to change.classId, "version" to version + 1, "updated_at" to FieldValue.serverTimestamp(), "updated_by" to user, "deleted" to change.deleted, "data" to change.data))
            newGr?.let { transaction.set(it, mapOf("student_id" to change.id)) }
            transaction.set(record("audit_logs", "${change.collection}_${change.id}_${version + 1}"), mapOf("collection" to change.collection, "record_id" to change.id, "version" to version + 1, "actor" to user, "at" to FieldValue.serverTimestamp(), "mutation_id" to change.mutationId, "after" to change.data))
            null
        }
    }

    fun download(path: String): Task<ByteArray> {
        uid()
        require(path.startsWith("$root/students/")) { "File belongs to another school." }
        return backend.storage.reference.child(path).getBytes(10L * 1024 * 1024)
    }
}
