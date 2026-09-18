package com.gbsschool.app

import androidx.test.core.app.ApplicationProvider
import com.gbsschool.app.data.firebase.PendingSchoolChanges
import com.gbsschool.app.data.firebase.SchoolMutation
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class PendingSchoolChangesTest {
    @Test fun pendingAttendanceSurvivesRecreationAndConflictRetainsVersion() {
        val uid = UUID.randomUUID().toString()
        val queue = PendingSchoolChanges(ApplicationProvider.getApplicationContext(), "demo-gbs-school", "school-a", uid)
        val change = SchoolMutation("attendance", "student-date", "8:A", 3, mapOf("studentId" to "student-1", "status" to "Absent", "academicYear" to "2026-27"))
        val saved = queue.enqueue(change)
        assertEquals("Offline", queue.status(false))
        val reopened = PendingSchoolChanges(ApplicationProvider.getApplicationContext(), "demo-gbs-school", "school-a", uid)
        assertEquals(saved.mutationId, reopened.items().single().change.mutationId)
        assertEquals("Pending Sync", reopened.status(true))
        reopened.failed(saved.mutationId, "Version conflict")
        assertEquals("Sync Failed", reopened.status(true))
        reopened.retry()
        assertEquals(3L, reopened.items().single().change.expectedVersion)
        reopened.acknowledged(saved.mutationId)
        assertEquals("Synced", reopened.status(true))
    }

    @Test fun accountsAndSchoolsCannotSharePendingEntries() {
        val uid = UUID.randomUUID().toString()
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        val queue = PendingSchoolChanges(context, "demo-gbs-school", "school-a", uid)
        queue.enqueue(SchoolMutation("students", "student-1", "8:A", 0, mapOf("id" to "student-1")))
        assertTrue(PendingSchoolChanges(context, "demo-gbs-school", "school-b", uid).items().isEmpty())
        assertTrue(PendingSchoolChanges(context, "demo-gbs-school", "school-a", "$uid-other").items().isEmpty())
    }
}
