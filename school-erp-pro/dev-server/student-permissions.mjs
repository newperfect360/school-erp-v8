export const studentActions = ['add', 'edit', 'archive', 'restore', 'delete'];
const archived = row => Boolean(row?.archivedAt || row?.status === 'Archived');
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);

// Check the actual record delta, never an action supplied by the client.
export function checkStudentPermissions(user, before, after) {
  if (user.role === 'SUPER_ADMIN') return;
  const grants = user.studentActions ?? ['add', 'edit', 'archive', 'restore'];
  const requireAction = action => {
    if (action === 'delete' || !grants.includes(action)) {
      throw Object.assign(Error(`Student ${action} permission required.`), {status: 403});
    }
  };
  if (!Array.isArray(after)) requireAction('delete');
  const previous = new Map((before || []).map(row => [String(row.id), row]));
  for (const row of after) {
    const old = previous.get(String(row.id));
    if (!old) requireAction('add');
    else if (canonical(old) !== canonical(row)) {
      if (archived(old) !== archived(row)) requireAction(archived(row) ? 'archive' : 'restore');
      // Archive permissions cannot be used to smuggle unrelated edits.
      const withoutArchive = record => Object.fromEntries(Object.entries(record).filter(([key]) =>
        !['archivedAt', 'archivePriorStatus', 'status', 'updatedAt'].includes(key)));
      if (archived(old) === archived(row) || canonical(withoutArchive(old)) !== canonical(withoutArchive(row))) requireAction('edit');
    }
    previous.delete(String(row.id));
  }
  if (previous.size) requireAction('delete');
}
