# Shared storage contract — proposed, inactive

Use a tenant prefix and stable Student Master IDs, never a student's display name or parent number as a path key:

```
schools/{schoolId}/students/{studentId}/photos/{fileId}
schools/{schoolId}/students/{studentId}/documents/{fileId}
schools/{schoolId}/certificates/{certificateId}/{fileId}
schools/{schoolId}/idcards/{studentId}/{fileId}
schools/{schoolId}/audio/{communicationId}/{fileId}
schools/{schoolId}/trip/{tripId}/{fileId}
schools/{schoolId}/sports/{eventId}/{fileId}
schools/{schoolId}/library/{recordId}/{fileId}
schools/{schoolId}/notices/{noticeId}/{fileId}
```

The server chooses IDs, checks verified user membership/role/class scope, enforces upload MIME/size quotas and stores actor/version/retention metadata. Do not use permanent public links for private school files; downloads require verified access. Resolve a file through the same school/student identity as the record, not a filename guess.

Draft rules still deny all access. These paths are a proposed contract, not created buckets or deployed rules. Before enabling access, emulator-test anonymous, cross-school, revoked-user, wrong-class and wrong-role denial; permitted reads/writes; file type/size rejection; and archival retention behavior. Back up object contents together with record manifests and verify a staging restore before migration.
