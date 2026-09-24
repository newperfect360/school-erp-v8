package com.gbsschool.app

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.navigation.SchoolApp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk=[35],qualifiers="w411dp-h915dp-mdpi")
class DevelopmentLoginTest {
    @get:Rule val compose=createAndroidComposeRule<ComponentActivity>()
    @Test fun twoSchoolsSubmitUdiseInNativeLoginForm() {
        compose.setContent { SchoolTheme { SchoolApp() } }
        for(index in 0..1){
            compose.onNodeWithText("School UDISE Code").performScrollTo().performTextClearance()
            compose.onNodeWithText("School UDISE Code").performTextInput("DEMO00000${index+1}")
            compose.onNodeWithText("Username / Email").performTextInput("admin")
            compose.onNodeWithText("Password",substring=false).performTextInput("TEST-school-$index-password!")
            compose.onNodeWithText("Sign in",substring=false).performScrollTo().performClick()
            compose.waitUntil(15000) { runCatching { compose.onNodeWithText("School ERP Dashboard").assertExists() }.isSuccess }
            compose.onNodeWithText("UDISE: DEMO00000${index+1}",substring=true).assertExists()
            compose.onNodeWithText("Logout",substring=false).performScrollTo().performClick()
        }
    }
    @Test fun submittedLocalCredentialsOpenDashboardWithoutFirebase() {
        // Real local demo server is required; production Firebase is never initialized.
        compose.setContent { SchoolTheme { SchoolApp() } }
        compose.onNodeWithText("Username / Email").performTextInput("dilippawar2207@gmail.com")
        compose.onNodeWithText("Password",substring=false).performTextInput("incorrect")
        compose.onNodeWithText("Sign in",substring=false).performScrollTo().performClick()
        compose.waitUntil(15000) { runCatching { compose.onNodeWithText("Invalid development username or password.").assertExists() }.isSuccess }
        compose.onNodeWithText("Invalid development username or password.").assertExists()
        compose.onNodeWithText("School ERP Dashboard").assertDoesNotExist()
        compose.onNodeWithText("Password",substring=false).performScrollTo().performTextInput("admin1234")
        compose.onNodeWithText("Sign in",substring=false).performScrollTo().performClick()
        compose.waitUntil(15000) { runCatching { compose.onNodeWithText("School ERP Dashboard").assertExists() }.isSuccess }
        compose.onNodeWithText("School ERP Dashboard").assertExists()
        compose.onNodeWithText("Role: SUPER_ADMIN").assertExists()
        compose.onNodeWithText("DEVELOPMENT / TEST MODE").assertExists()
        compose.waitUntil(10000) { runCatching { compose.onNodeWithText("Add record").assertIsEnabled() }.isSuccess }
        compose.onNodeWithText("Logout",substring=false).performScrollTo().performClick()
        compose.onNodeWithText("Development Admin Login").assertExists()
        compose.onNodeWithText("School ERP Dashboard").assertDoesNotExist()
    }
}
