package com.gbsschool.app

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.feature.auth.LoginScreen
import com.gbsschool.app.navigation.SchoolApp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h915dp-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SchoolUiTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test fun previewNavigationAndModuleNotice() {
        compose.setContent { SchoolTheme { SchoolApp() } }
        capture("login")
        compose.onNodeWithText("Explore preview dashboard").performScrollTo().performClick()
        compose.onNodeWithText("DESIGN PREVIEW · SAMPLE DATA").assertIsDisplayed()
        capture("dashboard")
        compose.onNode(hasText("Students") and hasClickAction()).performScrollTo().performClick()
        compose.onNodeWithText("This module is planned for the next phase. This milestone includes the Login and Dashboard design only.").assertIsDisplayed()
        compose.onNodeWithText("Got it").performClick()
        compose.onNodeWithContentDescription("Exit preview").performScrollTo().performClick()
        compose.onNodeWithText("Welcome back").assertIsDisplayed()
    }

    @Test fun signInDoesNotPretendToAuthenticate() {
        compose.setContent { SchoolTheme { LoginScreen(false, {}) } }
        compose.onNodeWithText("Explore preview dashboard").assertDoesNotExist()
        compose.onNodeWithText("School email or mobile").performTextInput("teacher@example.test")
        compose.onNodeWithText("Password").performTextInput("preview-only")
        compose.onNodeWithText("Sign in", useUnmergedTree = true).performScrollTo().performClick()
        compose.onNodeWithText("School sign-in is not connected").assertIsDisplayed()
    }

    @Test
    @Config(sdk = [35], qualifiers = "w360dp-h640dp-mdpi")
    fun compactPhoneKeepsPreviewAndExitReachable() {
        compose.setContent { SchoolTheme { SchoolApp() } }
        compose.onNodeWithText("Explore preview dashboard").performScrollTo().performClick()
        compose.onNodeWithContentDescription("Exit preview").assertIsDisplayed().performClick()
        compose.onNodeWithText("Welcome back").performScrollTo().assertIsDisplayed()
    }

    private fun capture(name: String) {
        compose.waitForIdle()
        val directory = File("../artifacts").apply { mkdirs() }
        File(directory, "$name.png").outputStream().use {
            compose.runOnUiThread {
                val view = compose.activity.window.decorView
                val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
                view.draw(Canvas(bitmap))
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
                bitmap.recycle()
            }
        }
    }
}
