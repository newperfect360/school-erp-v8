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
class DemoTeacherWorkflowTest {
 @get:Rule val compose=createAndroidComposeRule<ComponentActivity>()
 @Test fun nativeTeacherCreateEditAndSearch(){
  val repository=DemoServerRepository();val login=repository.login("dilippawar2207@gmail.com","admin1234")
  val until=System.currentTimeMillis()+15000;while(!login.isComplete&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)};assertTrue(login.isSuccessful)
  compose.setContent { SchoolTheme { Column(Modifier.verticalScroll(rememberScrollState())) { SchoolWorkspace(listOf("Teachers"),repository,"development-admin") } } }
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("Add record").assertIsEnabled()}.isSuccess}
  val name="TEST Native Teacher "+System.currentTimeMillis()
  compose.onNodeWithText("Add record").performScrollTo().performClick()
  compose.onNodeWithText("name",substring=false).performScrollTo().performTextInput(name)
  compose.onNodeWithText("subject",substring=false).performScrollTo().performTextInput("गणित")
  compose.onNodeWithText("mobile",substring=false).performScrollTo().performTextInput("9000000101")
  compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("name: $name").assertExists()}.isSuccess}
  compose.onNodeWithText("Search records").performScrollTo().performTextInput(name)
  compose.onNodeWithText("Edit",substring=false).performScrollTo().performClick()
  compose.onNodeWithText("subject",substring=false).performScrollTo().performTextReplacement("विज्ञान")
  compose.onNodeWithText("Save",substring=false).performScrollTo().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("subject: विज्ञान").assertExists()}.isSuccess}
  compose.onNodeWithText("Archive",substring=false).performScrollTo().performClick()
  compose.onAllNodesWithText("Archive",substring=false).onLast().performClick()
  compose.waitUntil(15000){runCatching{compose.onNodeWithText("name: $name").assertDoesNotExist()}.isSuccess}
  repository.logout()
 }
}
