package com.gbsschool.app
import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.feature.auth.ProductionSignIn
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h915dp-mdpi")
class SchoolUiTest {
 @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()
 private fun login(scale: Float = 1f) {
  compose.setContent { CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, scale)) { SchoolTheme { ProductionSignIn(configurationAvailable = false) } } }
 }
 @Test fun officialIdentityIsRetained() {
  login()
  compose.onNodeWithText(compose.activity.getString(R.string.school_name_mr)).assertExists()
  compose.onNodeWithText(compose.activity.getString(R.string.institution_name_mr)).assertExists()
 }
 @Test @Config(sdk = [35], qualifiers = "w360dp-h640dp-mdpi")
 fun compactPhoneCanReachFieldsAndPasswordControls() {
  login()
  compose.onNodeWithText("School email").performScrollTo().performTextInput("TEST@example.invalid")
  compose.onNodeWithText("Password", substring = false).performScrollTo().performTextInput("test-only-input")
  compose.onNodeWithText("Show passwords").performScrollTo().performClick()
  compose.onNodeWithText("Hide passwords").assertIsDisplayed()
  compose.onNodeWithText("Sign in", substring = false).performScrollTo().assertIsNotEnabled()
 }
 @Test @Config(sdk = [35], qualifiers = "w480dp-h1040dp-xxhdpi")
 fun enlargedTextKeepsRecoveryReachable() {
  login(1.5f)
  compose.onNodeWithText("Forgot Password / Reset Password").performScrollTo().assertIsDisplayed().assertIsNotEnabled()
  compose.onNodeWithText("Explore preview dashboard").assertDoesNotExist()
 }
}
