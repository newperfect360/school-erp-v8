package com.gbsschool.app.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import com.gbsschool.app.BuildConfig
import com.gbsschool.app.feature.auth.LoginScreen
import com.gbsschool.app.feature.dashboard.DashboardScreen

@Composable
fun SchoolApp() {
    var dashboard by rememberSaveable { mutableStateOf(false) }
    val previewOpen = BuildConfig.DEBUG && dashboard
    BackHandler(enabled = previewOpen) { dashboard = false }
    if (previewOpen) DashboardScreen(onExit = { dashboard = false })
    else LoginScreen(allowPreview = BuildConfig.DEBUG, onPreview = { dashboard = true })
}
