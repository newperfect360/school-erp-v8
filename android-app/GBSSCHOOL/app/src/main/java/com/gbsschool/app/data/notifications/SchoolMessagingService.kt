package com.gbsschool.app.data.notifications

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Token registration and notification display will follow the approved backend contract. */
class SchoolMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Never log tokens. Bind to the verified user and school on the server in phase two.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // Do not display student data from an unvalidated payload.
    }
}
