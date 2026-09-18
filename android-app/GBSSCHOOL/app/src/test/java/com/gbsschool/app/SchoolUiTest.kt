package com.gbsschool.app

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
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

    @Test fun officialIdentityAndSplashDrawable() {
        compose.setContent { SchoolTheme { SchoolApp() } }
        compose.onNodeWithText(compose.activity.getString(R.string.school_name_mr)).assertExists()
        compose.onNodeWithText(compose.activity.getString(R.string.institution_name_mr)).assertExists()
        val bitmap = Bitmap.createBitmap(411, 915, Bitmap.Config.ARGB_8888)
        val drawable = compose.activity.getDrawable(R.drawable.official_splash)!!
        drawable.setBounds(0, 0, bitmap.width, bitmap.height)
        drawable.draw(Canvas(bitmap))
        val directory = File("../artifacts").apply { mkdirs() }
        File(directory, "splash-resource.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) }
        bitmap.recycle()
    }

    @Test
    @Config(sdk = [35], qualifiers = "w480dp-h1040dp-xxhdpi")
    fun largePhoneWithEnlargedTextKeepsNavigationReachable() {
        compose.setContent {
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, 1.5f)) {
                SchoolTheme { SchoolApp() }
            }
        }
        compose.onNodeWithText("Explore preview dashboard").performScrollTo().performClick()
        compose.onNodeWithText("DESIGN PREVIEW · SAMPLE DATA").assertIsDisplayed()
        capture("dashboard-large-font")
        compose.onNode(hasScrollToIndexAction()).performScrollToNode(hasText("Educational Trip") and hasClickAction())
        compose.onNode(hasText("Educational Trip") and hasClickAction()).performClick()
        compose.onNodeWithText("Got it").performClick()
        compose.onNode(hasScrollToIndexAction()).performScrollToIndex(0)
        compose.onNodeWithContentDescription("Exit preview").performScrollTo().performClick()
        compose.onNodeWithText("Welcome back").performScrollTo().assertIsDisplayed()
    }

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
