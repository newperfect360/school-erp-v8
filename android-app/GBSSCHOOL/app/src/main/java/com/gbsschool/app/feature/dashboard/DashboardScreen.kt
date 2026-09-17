package com.gbsschool.app.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.FactCheck
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.gbsschool.app.core.designsystem.*
import com.gbsschool.app.data.PreviewSchoolData

private data class Module(val title: String, val icon: ImageVector)
private val modules = listOf(
    Module("Students", Icons.Outlined.Groups), Module("Attendance", Icons.AutoMirrored.Outlined.FactCheck),
    Module("Homework", Icons.AutoMirrored.Outlined.MenuBook), Module("Results", Icons.Outlined.BarChart),
    Module("Educational Trip", Icons.Outlined.DirectionsBus), Module("Sports", Icons.Outlined.SportsSoccer),
    Module("Library", Icons.Outlined.LocalLibrary), Module("Certificates", Icons.Outlined.WorkspacePremium),
    Module("Notifications", Icons.Outlined.Notifications), Module("Profile", Icons.Outlined.Person),
)

@Composable
fun DashboardScreen(onExit: () -> Unit) {
    var selectedModule by remember { mutableStateOf<String?>(null) }
    val summary = PreviewSchoolData.summary
    Scaffold(
        containerColor = Canvas,
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(selected = true, onClick = {}, icon = { Icon(Icons.Outlined.Home, null) }, label = { Text("Home") })
                NavigationBarItem(selected = false, onClick = { selectedModule = "Notifications" }, icon = { Icon(Icons.Outlined.Notifications, null) }, label = { Text("Updates") })
                NavigationBarItem(selected = false, onClick = { selectedModule = "Profile" }, icon = { Icon(Icons.Outlined.Person, null) }, label = { Text("Profile") })
            }
        },
    ) { insets ->
        Box(Modifier.fillMaxSize().padding(insets), contentAlignment = Alignment.TopCenter) {
            LazyColumn(Modifier.widthIn(max = 840.dp).fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(22.dp)) {
                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        SchoolBrand()
                        IconButton(onClick = onExit) { Icon(Icons.AutoMirrored.Outlined.Logout, "Exit preview") }
                    }
                }
                item {
                    Surface(color = Gold.copy(alpha = .22f), shape = RoundedCornerShape(8.dp)) {
                        Text("DESIGN PREVIEW · SAMPLE DATA", Modifier.padding(horizontal = 12.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium)
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Welcome, Teacher", style = MaterialTheme.typography.headlineLarge)
                        Text("Let’s make today a great day to learn.", color = Muted)
                    }
                }
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = Navy)) {
                        Column(Modifier.fillMaxWidth().padding(22.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Your classroom overview", color = Color.White, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                                Icon(Icons.Outlined.School, null, tint = Gold)
                            }
                            Row(Modifier.fillMaxWidth()) {
                                Metric("${summary.students}", "Students", Modifier.weight(1f))
                                Metric("${summary.classes}", "Classes", Modifier.weight(1f))
                                Metric("${summary.present * 100 / summary.students}%", "Attendance", Modifier.weight(1f))
                            }
                            HorizontalDivider(color = Color.White.copy(alpha = .16f))
                            Text("Every student. Every opportunity.", color = Color.White.copy(alpha = .75f), style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Today’s attendance", style = MaterialTheme.typography.titleLarge)
                        Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("${summary.present} present", color = Color(0xFF376F60))
                                    Text("${summary.absent} absent", color = Color(0xFFAE614B))
                                }
                                LinearProgressIndicator(progress = { summary.present.toFloat() / summary.students }, modifier = Modifier.fillMaxWidth().height(8.dp), color = Color(0xFF649E8B), trackColor = Color(0xFFF0DCD4))
                                Text("Example overview across your assigned classes", style = MaterialTheme.typography.bodySmall, color = Muted)
                            }
                        }
                    }
                }
                item { Text("School workspace", style = MaterialTheme.typography.titleLarge) }
                items(modules.chunked(2).size) { index ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        modules.chunked(2)[index].forEach { module ->
                            Card(onClick = { selectedModule = module.title }, modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                                Column(Modifier.fillMaxWidth().padding(18.dp).heightIn(min = 76.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Icon(module.icon, null, tint = MaterialTheme.colorScheme.secondary)
                                    Text(module.title, style = MaterialTheme.typography.titleMedium)
                                }
                            }
                        }
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("School noticeboard", style = MaterialTheme.typography.titleLarge)
                        Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                            Row(Modifier.padding(18.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                Icon(Icons.Outlined.Campaign, null, tint = MaterialTheme.colorScheme.secondary)
                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("A space for school announcements", style = MaterialTheme.typography.titleMedium)
                                    Text("Circulars, events and important updates will appear here when your school is connected.", color = Muted, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                }
                item { Text("GBS SCHOOL  •  Learning together", color = Muted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 8.dp)) }
            }
        }
    }
    selectedModule?.let { title ->
        AlertDialog(onDismissRequest = { selectedModule = null }, title = { Text(title) },
            text = { Text("This module is planned for the next phase. This milestone includes the Login and Dashboard design only.") },
            confirmButton = { TextButton(onClick = { selectedModule = null }) { Text("Got it") } })
    }
}

@Composable
private fun Metric(value: String, label: String, modifier: Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(value, style = MaterialTheme.typography.headlineMedium, color = Color.White)
        Text(label, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = .7f))
    }
}

@Preview(showBackground = true, widthDp = 411, heightDp = 915)
@Composable
private fun DashboardPreview() { SchoolTheme { DashboardScreen({}) } }
