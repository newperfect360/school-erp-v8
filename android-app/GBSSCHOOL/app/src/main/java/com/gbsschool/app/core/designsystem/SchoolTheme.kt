package com.gbsschool.app.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Navy = Color(0xFF203A55)
val Gold = Color(0xFFE6BC72)
val Muted = Color(0xFF68798B)
val Canvas = Color(0xFFF5F6F9)

@Composable
fun SchoolTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Navy, secondary = Color(0xFF49776D), tertiary = Gold,
            background = Canvas, surface = Color.White, onSurface = Navy,
            surfaceVariant = Color(0xFFEDF1F5), onSurfaceVariant = Muted,
            secondaryContainer = Color(0xFFE4EEE9), onSecondaryContainer = Navy,
        ),
        typography = Typography(
            headlineLarge = TextStyle(fontSize = 32.sp, lineHeight = 39.sp, fontWeight = FontWeight.Bold),
            headlineMedium = TextStyle(fontSize = 27.sp, lineHeight = 34.sp, fontWeight = FontWeight.Bold),
            titleLarge = TextStyle(fontSize = 21.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
            titleMedium = TextStyle(fontSize = 16.sp, lineHeight = 23.sp, fontWeight = FontWeight.SemiBold),
            bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
            bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 21.sp),
            labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
        ), content = content,
    )
}
