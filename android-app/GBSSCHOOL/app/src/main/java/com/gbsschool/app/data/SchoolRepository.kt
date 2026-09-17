package com.gbsschool.app.data

/** Stable school and student IDs must match the approved web backend contract. */
data class SchoolScope(val schoolId: String, val userId: String)
data class SchoolSummary(val students: Int, val present: Int, val absent: Int, val classes: Int)

interface SchoolRepository {
    suspend fun summary(scope: SchoolScope): SchoolSummary
}

/** UI fixtures only. Never used as an authentication or production data source. */
object PreviewSchoolData {
    val summary = SchoolSummary(students = 128, present = 121, absent = 7, classes = 4)
}
