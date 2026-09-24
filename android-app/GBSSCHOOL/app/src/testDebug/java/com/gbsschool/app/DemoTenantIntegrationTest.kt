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
class DemoTenantIntegrationTest {
 private fun <T> await(task:Task<T>):T {val until=System.currentTimeMillis()+15000;while(!task.isComplete&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)};check(task.isComplete);return task.getResult(Exception::class.java)}
 private fun students(repository:DemoServerRepository):List<Map<String,Any>>{
  var rows:List<Map<String,Any>>?=null;var failure:Exception?=null
  val close=repository.watch("students",{rows=it},{failure=it});val until=System.currentTimeMillis()+15000
  while(rows==null&&failure==null&&System.currentTimeMillis()<until){shadowOf(Looper.getMainLooper()).idle();Thread.sleep(20)}
  close();failure?.let{throw it};return checkNotNull(rows)
 }
 @Test fun twoUdiseLoginsReadOnlyOwnWebImportsAndWriteBackIndependently(){
  val tenantIds=mutableSetOf<String>()
  for(index in 0..1){
   val repository=DemoServerRepository();val member=await(repository.login("admin","TEST-school-$index-password!","DEMO00000${index+1}"));tenantIds.add(member["schoolId"].toString())
   val rows=students(repository);assertEquals(1,rows.size)
   val record=rows.single()
   @Suppress("UNCHECKED_CAST") val data=record["data"] as Map<String,Any>
   assertEquals("TEST Tenant $index",data["name"]);assertEquals(member["schoolId"],data["tenantId"])
   await(repository.mutate(SchoolMutation(collection="students",id=record["id"].toString(),classId="8:A",expectedVersion=(record["version"] as Number).toLong(),data=data+mapOf("name" to "TEST Android Tenant $index"))))
   await(repository.mutate(SchoolMutation(collection="attendance",id="TEST-tenant-mark-$index",classId="8:A",expectedVersion=0,data=mapOf("studentId" to record["id"].toString(),"date" to "2026-09-25","academicYear" to "2026-27","status" to if(index==0)"Present" else "Absent"))))
   repository.logout()
  }
  assertEquals(2,tenantIds.size)
 }
}
