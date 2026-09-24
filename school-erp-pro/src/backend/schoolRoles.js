// Preserve stored role values; normalize aliases only when interpreting permissions.
const aliases={SUPER_ADMIN:'Super Admin',SCHOOL_SUPER_ADMIN:'Super Admin',SCHOOL_ADMIN:'Admin',ADMIN:'Admin',HEADMASTER:'Headmaster',TEACHER:'Teacher',CLASS_TEACHER:'Class Teacher',SUBJECT_TEACHER:'Subject Teacher',CLERK:'Clerk',STAFF:'Office Staff',ACCOUNTANT:'Accounts Staff',LIBRARIAN:'Library Staff',SPORTS_TEACHER:'Sports Teacher',READ_ONLY:'Read Only',VIEW_ONLY:'Read Only'};
export const schoolRole=value=>aliases[value]||value;
export function schoolResources(member){
 const role=schoolRole(member.role),global=['academic_years','notifications','settings'];
 const scopes={Teacher:['students','parents','attendance','homework','exams','results','communication_logs','certificates'],'Class Teacher':['students','parents','attendance','homework','exams','results','communication_logs','certificates'],'Subject Teacher':['students','parents','attendance','homework','exams','results','communication_logs','certificates'],'Sports Teacher':['students','sports','communication_logs'],'Library Staff':['students','library','communication_logs'],'Accounts Staff':['students','fees','communication_logs'],'Trip In-charge':['students','trips','communication_logs']};
 if(['Super Admin','Admin','Headmaster','Clerk','Office Staff','Read Only'].includes(role))return member.resources||[];
 return (member.resources||[]).filter(resource=>[...global,...(scopes[role]||[])].includes(resource));
}
