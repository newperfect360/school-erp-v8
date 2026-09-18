package com.gbsschool.app.data.firebase

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Account-scoped intent queue. Never changes expectedVersion when retrying a conflict. */
class PendingSchoolChanges(context: Context, project: String, school: String, uid: String) {
    private val preferences = context.getSharedPreferences("pending-school-changes", Context.MODE_PRIVATE)
    private val key = listOf(project, school, uid).joinToString("/")
    data class Pending(val change: SchoolMutation, val error: String? = null)

    @Synchronized fun items(): List<Pending> {
        val rows = JSONArray(preferences.getString(key, "[]"))
        return (0 until rows.length()).map { index ->
            val row = rows.getJSONObject(index)
            Pending(SchoolMutation(row.getString("collection"), row.getString("id"), row.getString("classId"), row.getLong("expectedVersion"), decode(row.getJSONObject("data")), row.getBoolean("deleted"), row.getString("mutationId")), if (row.isNull("error")) null else row.getString("error"))
        }
    }
    private fun decode(json: JSONObject): Map<String, Any?> = json.keys().asSequence().associateWith { key -> decodeValue(json.get(key)) }
    private fun decodeValue(value: Any?): Any? = when (value) {
        JSONObject.NULL -> null
        is JSONObject -> decode(value)
        is JSONArray -> (0 until value.length()).map { decodeValue(value.get(it)) }
        else -> value
    }
    private fun save(rows: List<Pending>) {
        val array = JSONArray()
        rows.forEach { (change, error) -> array.put(JSONObject().put("collection", change.collection).put("id", change.id).put("classId", change.classId).put("expectedVersion", change.expectedVersion).put("data", JSONObject(change.data)).put("deleted", change.deleted).put("mutationId", change.mutationId).put("error", error ?: JSONObject.NULL)) }
        check(preferences.edit().putString(key, array.toString()).commit()) { "Pending change could not be stored. Keep this form open." }
    }
    @Synchronized fun enqueue(change: SchoolMutation): SchoolMutation {
        val rows = items()
        val previous = rows.lastOrNull { it.change.collection == change.collection && it.change.id == change.id }
        val next = change.copy(expectedVersion = previous?.change?.expectedVersion?.plus(1) ?: change.expectedVersion)
        save(rows + Pending(next))
        return next
    }
    @Synchronized fun acknowledged(mutationId: String) { save(items().filter { it.change.mutationId != mutationId }) }
    @Synchronized fun failed(mutationId: String, message: String) { save(items().map { if (it.change.mutationId == mutationId) it.copy(error = message) else it }) }
    @Synchronized fun retry() { save(items().map { it.copy(error = null) }) }
    fun status(online: Boolean): String {
        val rows = items()
        return when { rows.any { it.error != null } -> "Sync Failed"; !online -> "Offline"; rows.isNotEmpty() -> "Pending Sync"; else -> "Synced" }
    }
}
