package com.gbsschool.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.gbsschool.app.core.designsystem.SchoolTheme
import com.gbsschool.app.navigation.SchoolApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { SchoolTheme { SchoolApp() } }
    }
}
