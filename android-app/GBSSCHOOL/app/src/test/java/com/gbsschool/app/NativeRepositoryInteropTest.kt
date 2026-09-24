package com.gbsschool.app

import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.feature.operations.SchoolWorkspace
import com.gbsschool.app.data.firebase.FirebaseBackend
import com.gbsschool.app.data.firebase.SharedSchoolRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.google.android.gms.tasks.Task
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

/** Runs real Android Firebase SDK/repository against isolated emulators, not a JS substitute. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class NativeRepositoryInteropTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()
    private fun <T> await(task: Task<T>): T {
        val deadline = System.currentTimeMillis() + 60000
        while (!task.isComplete && System.currentTimeMillis() < deadline) {
            shadowOf(Looper.getMainLooper()).idle()
            Thread.sleep(20)
        }
        check(task.isComplete) { "Emulator request timed out" }
        return task.getResult(Exception::class.java)
    }
    @Test fun webTeacherReadNativeUpdateAndCreate() {
        assumeTrue(System.getenv("SCHOOL_NATIVE_INTEROP") == "demo-gbs-school")
        val options = FirebaseOptions.Builder().setProjectId("demo-gbs-school")
            .setApplicationId("1:123456:android:emulator")
            .setApiKey("AIzaSyEmulatorTestOnlyNotAProductionSecret")
            .setStorageBucket("demo-gbs-school.appspot.com").build()
        val app = FirebaseApp.initializeApp(ApplicationProvider.getApplicationContext(), options, "native-interop")
        val auth = FirebaseAuth.getInstance(app)
        val db = FirebaseFirestore.getInstance(app)
        val storage = FirebaseStorage.getInstance(app)
        auth.useEmulator("127.0.0.1",9099)
        db.useEmulator("127.0.0.1",8080)
        storage.useEmulator("127.0.0.1",9199)
        try {
            await(auth.signInWithEmailAndPassword(requireNotNull(System.getenv("SCHOOL_TEST_EMAIL")),requireNotNull(System.getenv("SCHOOL_TEST_PASSWORD"))))
            val repo = SharedSchoolRepository(FirebaseBackend(auth,db,storage),"gbs-school")
            await(repo.loadMembership())
            val id = requireNotNull(System.getenv("SCHOOL_TEST_TEACHER_ID"))
            val row = await(db.document("schools/gbs-school/teachers/$id").get())
            assertEquals("TEST Web Teacher",row.getString("data.name"))
            @Suppress("UNCHECKED_CAST")
            val data = (row.get("data") as Map<String,Any?>).toMutableMap()
            data["name"] = "TEST Android Updated"
            await(repo.mutate(SchoolMutation("teachers",id,"",row.getLong("version")!!,data)))
            await(repo.mutate(SchoolMutation("teachers","TEST-native-teacher","",0,mapOf("id" to "TEST-native-teacher","name" to "TEST Native Created","subject" to "Math","mobile" to "9000000102"))))
            assertEquals("TEST Android Updated",await(db.document("schools/gbs-school/teachers/$id").get()).getString("data.name"))
            val studentId = requireNotNull(System.getenv("SCHOOL_TEST_STUDENT_ID"))
            val student = await(db.document("schools/gbs-school/students/"+studentId).get())
            assertEquals("TEST Web Student",student.getString("data.name"))
            @Suppress("UNCHECKED_CAST")
            val studentData = (student.get("data") as Map<String,Any?>).toMutableMap()
            studentData["fatherMobile"] = "9000000199"
            await(repo.mutate(SchoolMutation("students",studentId,"5:A",student.getLong("version")!!,studentData)))
            for (collection in listOf("fees","results")) {
                val record = await(db.collection("schools/gbs-school/"+collection).get()).documents.single()
                @Suppress("UNCHECKED_CAST")
                val values = (record.get("data") as Map<String,Any?>).toMutableMap()
                assertEquals(studentId,values["studentId"])
                if (collection == "fees") values["paid"] = 60.0
                else { values["obtainedMarks"] = 85.0; values["percentage"] = 85.0; values["grade"] = "A"; values["pass"] = true }
                await(repo.mutate(SchoolMutation(collection,record.id,"5:A",record.getLong("version")!!,values)))
            }

            val attendance = await(db.collection("schools/gbs-school/attendance").get()).documents.single()
            @Suppress("UNCHECKED_CAST")
            val attendanceData = (attendance.get("data") as Map<String,Any?>).toMutableMap()
            assertEquals(studentId,attendanceData["studentId"])
            assertEquals("Absent",attendanceData["status"])
            attendanceData["status"] = "Present"
            await(repo.mutate(SchoolMutation("attendance",attendance.id,"5:A",attendance.getLong("version")!!,attendanceData)))
            val staff = await(db.collection("schools/gbs-school/teachers").whereEqualTo("data.kind","staff").get()).documents.single()
            @Suppress("UNCHECKED_CAST")
            val staffData=(staff.get("data") as Map<String,Any?>).toMutableMap()
            staffData["name"]="TEST Native Staff"
            await(repo.mutate(SchoolMutation("teachers",staff.id,"",staff.getLong("version")!!,staffData)))
            for (collection in listOf("notifications","library","sports","trips")) {
                val record=await(db.collection("schools/gbs-school/"+collection).get()).documents.single()
                @Suppress("UNCHECKED_CAST")
                val values=(record.get("data") as Map<String,Any?>).toMutableMap()
                values[if(collection=="notifications") "title" else "name"] = if(collection=="notifications") "TEST Native Notice" else "TEST Native "+collection
                await(repo.mutate(SchoolMutation(collection,record.id,record.getString("class_id") ?: "",record.getLong("version")!!,values)))
            }
            for(collection in listOf("homework","parents")) {
                val record=await(db.collection("schools/gbs-school/"+collection).get()).documents.single()
                @Suppress("UNCHECKED_CAST")
                val values=(record.get("data") as Map<String,Any?>).toMutableMap()
                val key=if(collection=="homework") "details" else "purpose"
                assertEquals(if(collection=="homework") "TEST Web Homework" else "TEST Web meeting",values[key])
                values[key]=if(collection=="homework") "TEST Native Homework" else "TEST Native meeting"
                await(repo.mutate(SchoolMutation(collection,record.id,record.getString("class_id") ?: "",record.getLong("version")!!,values)))
            }
            val imported = await(db.collection("schools/gbs-school/students").whereEqualTo("data.grNo","TEST-IMPORT-CLOUD").get()).documents.single()
            assertEquals("TEST Cloud Import",imported.getString("data.name"))
            val year = await(db.document("schools/gbs-school/academic_years/2027-28").get())
            @Suppress("UNCHECKED_CAST")
            val yearData=(year.get("data") as Map<String,Any?>).toMutableMap()
            yearData["status"]="Closed"
            await(repo.mutate(SchoolMutation("academic_years",year.id,"",year.getLong("version")!!,yearData)))
            compose.setContent { SchoolTheme { Column(Modifier.verticalScroll(rememberScrollState())) { SchoolWorkspace(listOf("Teachers","Classwork"),repo) } } }
            compose.waitUntil(60000) { runCatching { compose.onNodeWithText("Add record").assertIsEnabled() }.isSuccess }
            compose.onNodeWithText("Add record").performScrollTo().performClick()
            compose.onNodeWithText("name",substring=false).performScrollTo().performTextInput("TEST Native UI Teacher")
            compose.onNodeWithText("subject",substring=false).performScrollTo().performTextInput("TEST Mathematics")
            compose.onNodeWithText("mobile",substring=false).performScrollTo().performTextInput("9000000198")
            compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
            compose.waitUntil(60000) { compose.onAllNodesWithText("name: TEST Native UI Teacher").fetchSemanticsNodes().isNotEmpty() }
            compose.onNodeWithText("name: TEST Native UI Teacher").performScrollTo().assertIsDisplayed()
            compose.onNodeWithText("Teachers",substring=false).performScrollTo().performClick()
            compose.onNodeWithText("Classwork",substring=false).performClick()
            compose.onNodeWithText("Add record").performScrollTo().performClick()
            for((field,value) in mapOf("className" to "5","division" to "A","subject" to "TEST Native Subject","date" to "2026-09-24","classwork" to "TEST Native classwork")) compose.onNodeWithText(field,substring=false).performScrollTo().performTextInput(value)
            compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
            compose.waitUntil(60000) { compose.onAllNodesWithText("classwork: TEST Native classwork").fetchSemanticsNodes().isNotEmpty() }

        } finally {
            auth.signOut()
            await(db.terminate())
            app.delete()
        }
    }
}
