package com.gbsschool.app.feature.auth

import com.gbsschool.app.data.firebase.SchoolRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.gbsschool.app.data.firebase.SharedSchoolRepository
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks

/** Debug session only. Never reads/writes Firebase or existing device school records. */
class DevelopmentRepository : SchoolRepository {
    private val records = mutableMapOf<String, MutableMap<String, Map<String, Any>>>()
    private val listeners = mutableMapOf<String, MutableSet<(List<Map<String, Any>>) -> Unit>>()
    override fun loadMembership(): Task<Map<String, Any?>> = Tasks.forResult(mapOf("role" to "SUPER_ADMIN", "active" to true))
    private fun rows(collection: String) = records[collection]?.values?.filter { it["deleted"] != true } ?: emptyList()
    override fun watch(collection: String, onRows: (List<Map<String, Any>>) -> Unit, onError: (Exception) -> Unit): () -> Unit {
        listeners.getOrPut(collection) { mutableSetOf() }.add(onRows)
        onRows(rows(collection))
        return { listeners[collection]?.remove(onRows) }
    }
    override fun mutate(change: SchoolMutation): Task<Void> {
        return try {
            require(change.collection in SharedSchoolRepository.collections)
            val bucket = records.getOrPut(change.collection) { mutableMapOf() }
            val old = bucket[change.id]
            check((old?.get("version") as? Long ?: 0L) == change.expectedVersion) { "Record changed. Reopen before saving." }
            if (change.collection == "students") {
                check(bucket.values.none { it["id"] != change.id && (it["data"] as? Map<*,*>)?.get("grNo")?.toString()?.lowercase() == change.data["grNo"]?.toString()?.lowercase() }) { "Duplicate GR number." }
            }
            bucket[change.id] = mapOf("id" to change.id,"class_id" to change.classId,"version" to change.expectedVersion+1,"deleted" to change.deleted,"data" to change.data,"updated_by" to "development-admin")
            listeners[change.collection]?.toList()?.forEach { it(rows(change.collection)) }
            Tasks.forResult(null)
        } catch (error: Exception) { Tasks.forException(error) }
    }
}
