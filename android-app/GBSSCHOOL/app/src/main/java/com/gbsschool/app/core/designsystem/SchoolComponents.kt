package com.gbsschool.app.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.gbsschool.app.R

@Composable
fun SchoolBrand(modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Image(painterResource(R.drawable.official_school_logo), "Official school logo", Modifier.width(54.dp).height(59.dp), contentScale = ContentScale.Fit)
        Column {
            Text(stringResource(R.string.institution_name_mr), style = MaterialTheme.typography.labelSmall, color = Muted)
            Text(stringResource(R.string.school_name_mr), style = MaterialTheme.typography.titleMedium)
            Text(stringResource(R.string.school_address_mr), style = MaterialTheme.typography.bodySmall, color = Muted)
        }
    }
}

/** Resolution-independent campus artwork; no network or external image dependency. */
@Composable
fun CampusIllustration(modifier: Modifier = Modifier) {
    Canvas(modifier.fillMaxWidth().height(130.dp)) {
        val w = size.width
        val h = size.height
        drawCircle(Gold.copy(alpha = .32f), h * .32f, Offset(w * .79f, h * .32f))
        drawRoundRect(Color(0xFFE3EAF0), Offset(w * .1f, h * .85f), Size(w * .8f, h * .06f))
        drawRect(Color(0xFFDCE5ED), Offset(w * .19f, h * .38f), Size(w * .62f, h * .47f))
        drawRect(Navy, Offset(w * .4f, h * .25f), Size(w * .2f, h * .60f))
        val roof = Path().apply {
            moveTo(w * .35f, h * .26f); lineTo(w * .5f, h * .06f)
            lineTo(w * .65f, h * .26f); close()
        }
        drawPath(roof, Navy)
        for (x in listOf(.23f, .31f, .65f, .73f)) {
            for (y in listOf(.47f, .65f)) drawRect(Color.White, Offset(w * x, h * y), Size(w * .04f, h * .1f))
        }
        drawCircle(Gold, h * .06f, Offset(w * .5f, h * .36f))
        drawRect(Gold, Offset(w * .47f, h * .61f), Size(w * .06f, h * .24f))
        for (x in listOf(.13f, .87f)) {
            drawLine(Muted, Offset(w * x, h * .55f), Offset(w * x, h * .85f), 5f)
            drawCircle(Color(0xFF87AA9C), h * .12f, Offset(w * x, h * .53f))
        }
    }
}
