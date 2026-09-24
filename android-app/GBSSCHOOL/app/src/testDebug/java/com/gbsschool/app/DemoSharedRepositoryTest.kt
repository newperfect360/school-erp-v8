package com.gbsschool.app

import android.os.Looper
import com.gbsschool.app.feature.auth.DemoServerRepository
import com.gbsschool.app.data.firebase.SchoolMutation
import com.google.android.gms.tasks.Task
import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk=[35])
class DemoSharedRepositoryTest {
 private fun <T> await(task:Task<T>):T {val until=System.currentTimeMillis()+15000;while(!task.isComplete&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)};check(task.isComplete);return task.getResult(Exception::class.java)}
 @Test fun nativeReadsWebStudentAndWritesBackToSharedStore(){
  val repository=DemoServerRepository();assertEquals("SUPER_ADMIN",await(repository.login("dilippawar2207@gmail.com","admin1234"))["role"])
  var rows=emptyList<Map<String,Any>>();var error:Exception?=null
  val stop=repository.watch("students",{rows=it},{error=it})
  val until=System.currentTimeMillis()+15000
  while(rows.none{it["id"]=="TEST-DEMO-WEB"}&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)}
  error?.let{throw it};val row=rows.first{it["id"]=="TEST-DEMO-WEB"}
  @Suppress("UNCHECKED_CAST") val original=row["data"] as Map<String,Any>
  assertEquals("TEST Web विद्यार्थी",original["name"])
  await(repository.mutate(SchoolMutation(collection="students",id="TEST-DEMO-WEB",classId="8:A",expectedVersion=(row["version"] as Number).toLong(),data=original+mapOf("name" to "TEST Android विद्यार्थी"))))
  fun read(collection:String,id:String):Map<String,Any>{
   var values=emptyList<Map<String,Any>>();var problem:Exception?=null
   val close=repository.watch(collection,{values=it},{problem=it});val deadline=System.currentTimeMillis()+15000
   while(values.none{it["id"]==id}&&problem==null&&System.currentTimeMillis()<deadline){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)}
   close();problem?.let{throw it};return values.first{it["id"]==id}
  }
  val attendance=read("attendance","TEST-DEMO-WEB_2026-09-24_2026-27")
  @Suppress("UNCHECKED_CAST") val mark=attendance["data"] as Map<String,Any>
  assertEquals("Present",mark["status"])
  await(repository.mutate(SchoolMutation(collection="attendance",id=attendance["id"].toString(),classId="8:A",expectedVersion=(attendance["version"] as Number).toLong(),data=mark+mapOf("status" to "Absent"))))
  @Suppress("UNCHECKED_CAST") val fee=read("fees","TEST-DEMO-FEE")["data"] as Map<String,Any>
  assertEquals(100,(fee["amount"] as Number).toInt())
  @Suppress("UNCHECKED_CAST") val notice=read("notifications","TEST-DEMO-NOTICE")["data"] as Map<String,Any>
  assertEquals("TEST shared notice",notice["title"])
  stop();repository.logout()
 }
}
