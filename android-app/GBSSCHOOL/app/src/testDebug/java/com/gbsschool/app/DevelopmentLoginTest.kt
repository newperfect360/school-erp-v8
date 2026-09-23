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
    @Test fun submittedLocalCredentialsOpenDashboardWithoutFirebase() {
        // Deliberately no FirebaseApp initialization, network, or membership fixture.
        compose.setContent { SchoolTheme { SchoolApp() } }
        compose.onNodeWithText("Username / Email").performTextInput("admin")
        compose.onNodeWithText("Password",substring=false).performTextInput("incorrect")
        compose.onNodeWithText("Sign in",substring=false).performScrollTo().performClick()
        compose.onNodeWithText("Invalid development username or password.").assertExists()
        compose.onNodeWithText("School ERP Dashboard").assertDoesNotExist()
        compose.onNodeWithText("Password",substring=false).performScrollTo().performTextInput("admin1234")
        compose.onNodeWithText("Sign in",substring=false).performScrollTo().performClick()
        compose.onNodeWithText("School ERP Dashboard").assertExists()
        compose.onNodeWithText("Role: SUPER_ADMIN").assertExists()
        compose.onNodeWithText("DEVELOPMENT / TEST MODE").assertExists()
        compose.waitUntil(10000) { runCatching { compose.onNodeWithText("Add record").assertIsEnabled() }.isSuccess }
        compose.onNodeWithText("Logout",substring=false).performScrollTo().performClick()
        compose.onNodeWithText("Development Admin Login").assertExists()
        compose.onNodeWithText("School ERP Dashboard").assertDoesNotExist()
    }
}
