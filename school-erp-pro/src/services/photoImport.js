const key = value => String(value ?? '').trim().normalize('NFKC').toLowerCase();
export function matchPhotos(students, files, field='photoNumber') {
 const allowed=new Set(['photoNumber','grNo','admissionNo','id']);if(!allowed.has(field))throw Error('Invalid photo matching field.');
 const index=new Map();for(const s of students.filter(s=>!s.archivedAt)){const value=key(s[field]);if(value){const list=index.get(value)||[];list.push(s);index.set(value,list)}}
 const counts=new Map();for(const f of files){const stem=key(f.name.replace(/\.[^.]+$/,''));counts.set(stem,(counts.get(stem)||0)+1)}
 const rows=files.map((file,i)=>{const stem=key(file.name.replace(/\.[^.]+$/,'')),matches=index.get(stem)||[];let error='';if(!/\.(jpe?g|png|webp)$/i.test(file.name)||!['image/jpeg','image/png','image/webp'].includes(file.type))error='Incorrect format';else if(file.size>5*1024*1024)error='Invalid file: larger than 5 MB';else if(counts.get(stem)>1)error='Duplicate photos: same identifier';else if(matches.length>1)error='Duplicate Student Master identifiers';else if(!matches.length)error='No matching active student';return{index:i,name:file.name,student:matches.length===1?matches[0]:null,error,status:error||'Matched',existing:Boolean(matches[0]?.photo)}});
 const matched=new Set(rows.filter(r=>!r.error).map(r=>String(r.student.id)));
 return{rows,missing:students.filter(s=>!s.archivedAt&&!matched.has(String(s.id)))};
}
