export default function AttendanceMarkDetails({student,details,disabled,onChange}){
 if(!['Late','Permission Leave','Early Leave'].includes(student.status))return null;
 const timeKey=student.status==='Late'?'arrivalTime':'outTime';
 return <div className="attendance-detail-fields"><label>{timeKey==='arrivalTime'?'Arrival time':'Out time'}<input disabled={disabled} aria-label={`Arrival time for ${student.name}`} type="time" value={details[timeKey]||''} onChange={e=>onChange({[timeKey]:e.target.value})}/></label><label>Reason<input disabled={disabled} aria-label={`Attendance reason for ${student.name}`} value={details.reason||''} onChange={e=>onChange({reason:e.target.value})}/></label><label>Teacher remark<input disabled={disabled} aria-label={`Teacher remark for ${student.name}`} value={details.remark||''} onChange={e=>onChange({remark:e.target.value})}/></label></div>;
}
