package com.gbsschool.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.navigation.SchoolApp
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { SchoolTheme {
            var showBrand by rememberSaveableBrand()
            LaunchedEffect(Unit) { delay(600); showBrand = false }
            if (showBrand) Surface(Modifier.fillMaxSize()) {
                Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(stringResource(R.string.app_name), style = MaterialTheme.typography.headlineLarge)
                    Text(stringResource(R.string.app_subtitle), style = MaterialTheme.typography.bodyLarge)
                }
            } else SchoolApp()
        } }
    }
}

@Composable
private fun rememberSaveableBrand() = androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(true) }
