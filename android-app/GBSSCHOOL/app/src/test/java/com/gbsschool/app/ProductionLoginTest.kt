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
@Config(sdk = [35], qualifiers = "w411dp-h915dp-mdpi")
class ProductionLoginTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test fun unconfiguredBuildCannotEnterWithoutAuthentication() {
        compose.setContent { SchoolTheme { SchoolApp() } }
        compose.onNodeWithText("School sign-in configuration is required. Contact your administrator.").assertExists()
        compose.onNodeWithText("Sign in", substring = false).performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText("Explore preview dashboard").assertDoesNotExist()
        compose.onNodeWithText("Show passwords").performScrollTo().performClick()
        compose.onNodeWithText("Hide passwords").assertExists()
    }
}
