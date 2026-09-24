package com.gbsschool.app
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.feature.auth.DemoServerRepository
import com.gbsschool.app.feature.operations.SchoolWorkspace
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
@RunWith(RobolectricTestRunner::class)
@Config(sdk=[35],qualifiers="w411dp-h915dp-mdpi")
class DemoStudentWorkflowTest {
 @get:Rule val compose=createAndroidComposeRule<ComponentActivity>()
 @Test fun nativeStudentCreateEditArchiveAndDeviceIntents(){
  val repository=DemoServerRepository();val login=repository.login("dilippawar2207@gmail.com","admin1234")
  val until=System.currentTimeMillis()+15000;while(!login.isComplete&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)};assertTrue(login.isSuccessful)
  compose.setContent { SchoolTheme { Column(Modifier.verticalScroll(rememberScrollState())) { SchoolWorkspace(listOf("Students"),repository,"development-admin") } } }
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("Add record").assertIsEnabled()}.isSuccess}
  val name="TEST Native Student "+System.currentTimeMillis()
  compose.onNodeWithText("Add record").performScrollTo().performClick()
  compose.onNodeWithText("name",substring=false).performScrollTo().performTextInput(name)
  compose.onNodeWithText("grNo",substring=false).performScrollTo().performTextInput("TEST"+System.nanoTime())
  compose.onNodeWithText("className",substring=false).performScrollTo().performTextInput("8")
  compose.onNodeWithText("division",substring=false).performScrollTo().performTextInput("A")
  compose.onNodeWithText("fatherMobile",substring=false).performScrollTo().performTextInput("9000000101")
  compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("name: $name").assertExists()}.isSuccess}
  compose.onNodeWithText("Search records").performScrollTo().performTextInput(name)
  compose.onNodeWithText("Edit",substring=false).performScrollTo().performClick()
  compose.onNodeWithText("motherMobile",substring=false).performScrollTo().performTextReplacement("9000000102")
  compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("motherMobile: 9000000102").assertExists()}.isSuccess}
  compose.onNodeWithText("SMS Father",substring=false).performScrollTo().performClick()
  val sms=shadowOf(compose.activity).nextStartedActivity
  assertEquals(android.content.Intent.ACTION_SENDTO,sms.action)
  assertEquals("smsto:9000000101",sms.data.toString())
  compose.onNodeWithText("WhatsApp Mother",substring=false).performScrollTo().performClick()
  val whatsapp=shadowOf(compose.activity).nextStartedActivity
  assertTrue(whatsapp.data.toString().startsWith("https://wa.me/919000000102?text="))
  compose.onNodeWithText("Archive",substring=false).performScrollTo().performClick()
  compose.onAllNodesWithText("Archive",substring=false).onLast().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("name: $name").assertDoesNotExist()}.isSuccess}
  repository.logout()
 }
}
