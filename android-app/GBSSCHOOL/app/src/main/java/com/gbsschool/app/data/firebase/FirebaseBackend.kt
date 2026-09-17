package com.gbsschool.app.data.firebase

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage

/**
 * Future injection boundary. Construct only after explicit Firebase initialization,
 * verified sign-in and a server-authorized school scope. No client role selection.
 * Keep service-account/provider secrets on a server, never inside the APK.
 */
data class FirebaseBackend(
    val auth: FirebaseAuth,
    val firestore: FirebaseFirestore,
    val storage: FirebaseStorage,
)
