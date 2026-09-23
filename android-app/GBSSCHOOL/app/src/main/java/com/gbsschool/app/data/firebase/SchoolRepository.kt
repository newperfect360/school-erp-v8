package com.gbsschool.app.data.firebase

import com.google.android.gms.tasks.Task

interface SchoolRepository {
    fun loadMembership(): Task<Map<String, Any?>>
    fun watch(collection: String, onRows: (List<Map<String, Any>>) -> Unit, onError: (Exception) -> Unit): () -> Unit
    fun mutate(change: SchoolMutation): Task<Void>
}
