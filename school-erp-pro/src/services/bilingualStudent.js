// Deliberately limited offline spelling suggestions. Unknown names require manual correction;
// a general transliteration provider is not claimed or silently contacted.
const names={shantanu:'शांतनु',sunil:'सुनील',pawar:'पवार',aditi:'अदिती',deshmukh:'देशमुख',asha:'आशा',rahul:'राहुल',patil:'पाटील',sneha:'स्नेहा',amit:'अमित',anita:'अनिता',sanjay:'संजय',suresh:'सुरेश',ramesh:'रमेश',pooja:'पूजा',priya:'प्रिया',shinde:'शिंदे',jadhav:'जाधव'};
export function suggestMarathiName(value){const words=String(value||'').trim().split(/\s+/);return words.length&&words.every(w=>names[w.toLowerCase()])?words.map(w=>names[w.toLowerCase()]).join(' '):'';}
export function bilingualStudent(s){return{...s,student_name_en:s.name||s.student_name_en||'',father_name_en:s.fatherName||s.father_name_en||'',mother_name_en:s.motherName||s.mother_name_en||'',address_en:s.address||s.address_en||''};}
