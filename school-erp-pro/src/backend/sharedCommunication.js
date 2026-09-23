import {createFirebaseRepository} from './firebaseRepository';
import {schoolFirebase} from './firebaseClient';

// A device dialer/composer must open synchronously; this independent promise records
// only the attempt, never a connected call or confirmed delivery.
export async function saveSharedCommunication(record){
 const repo=createFirebaseRepository(schoolFirebase());await repo.membership();
 const student=await repo.read('students',record.studentId);
 const {__version,...data}=record;
 return repo.mutate({collection:'communication_logs',id:record.id,classId:student.class_id,expectedVersion:__version||0,data,mutationId:crypto.randomUUID()});
}
