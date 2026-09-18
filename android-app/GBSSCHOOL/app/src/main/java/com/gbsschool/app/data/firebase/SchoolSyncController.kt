package com.gbsschool.app.data.firebase

/** Flush explicitly on reconnect/Sync Now; one in-flight transaction per controller. */
class SchoolSyncController(
    private val repository: SharedSchoolRepository,
    private val pending: PendingSchoolChanges,
    private val online: () -> Boolean,
    private val onStatus: (String) -> Unit,
) {
    private var running = false
    private var stopped = false

    fun enqueue(change: SchoolMutation) {
        check(!stopped) { "This school session has ended." }
        pending.enqueue(change)
        onStatus(pending.status(online()))
        syncNow()
    }

    fun syncNow() {
        if (running || stopped) return
        if (!online()) { onStatus(pending.status(false)); return }
        val next = pending.items().firstOrNull()
        if (next == null || next.error != null) { onStatus(pending.status(true)); return }
        running = true
        try {
            repository.mutate(next.change).addOnCompleteListener { result ->
                running = false
                if (result.isSuccessful) pending.acknowledged(next.change.mutationId)
                else if (online()) pending.failed(next.change.mutationId, result.exception?.message ?: "Sync failed; pending entry retained.")
                if (!stopped) {
                    onStatus(pending.status(online()))
                    if (result.isSuccessful) syncNow()
                }
            }
        } catch (error: Exception) {
            running = false
            pending.failed(next.change.mutationId, error.message ?: "Sync failed; pending entry retained.")
            onStatus(pending.status(online()))
        }
    }

    fun retry() { pending.retry(); syncNow() }
    /** Sign-out does not delete pending work; its original account must resume it. */
    fun stop() { stopped = true }
}
