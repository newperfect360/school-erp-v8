export function availableUnits(item, loans, itemRef) {
  return Number(item.copies ?? item.quantity ?? 0) - loans.filter(l => !l.returned && (l.itemRef === itemRef || l.bookRef === itemRef)).reduce((sum, l) => sum + Number(l.quantity || 1), 0);
}
export function validateLoan({ studentId, itemRef, quantity, dueDate }, available, today) {
  if (!studentId || !itemRef || !dueDate) return "Student, item and due date are required.";
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0 || Number(quantity) > available) return "Quantity must be a whole number within available stock.";
  if (dueDate < today) return "Due date cannot be in the past.";
  return "";
}
