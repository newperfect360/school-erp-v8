package com.gbsschool.app.data.firebase

import com.gbsschool.app.BuildConfig
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.util.concurrent.Executors

/** Same public tenant resolver as web. Passwords go only to Firebase Auth. */
object TenantAuthentication {
    private val executor = Executors.newFixedThreadPool(2)
    fun request(action: String, udise: String, identifier: String? = null, token: String? = null): Task<JSONObject> = Tasks.call(executor) {
        require(udise.matches(Regex("[0-9]{11}"))) { "Enter the school's 11-digit UDISE." }
        val uri = URI(BuildConfig.TENANT_AUTH_URL)
        require(uri.scheme == "https") { "Secure school authentication configuration is required." }
        val connection = uri.toURL().openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 20000
            connection.readTimeout = 20000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            token?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
            val body = JSONObject().put("action",action).put("udise",udise)
            identifier?.let { body.put("identifier",it) }
            connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val success = connection.responseCode in 200..299
            val result = (if(success) connection.inputStream else connection.errorStream)?.bufferedReader(Charsets.UTF_8)?.use { JSONObject(it.readText()) } ?: JSONObject()
            check(success) { result.optString("error","School authentication is unavailable.") }
            result
        } finally { connection.disconnect() }
    }
}
