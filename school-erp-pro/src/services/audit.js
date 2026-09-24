import {schoolStorage} from '../backend/demoClient';
import { localDate, readStored, writeStored } from "../storage";

export function recordAudit(action, details = {}) {
  const logs = readStored("erp_pro_audit", []);
  return writeStored("erp_pro_audit", [...logs, {
    id: crypto.randomUUID(),
    action,
    details,
    date: localDate(),
    time: new Date().toLocaleTimeString(),
    user: "admin",
  }]);
}

export function createBackup() {
  const data = {};
  for (let index = 0; index < schoolStorage.length; index += 1) {
    const key = schoolStorage.key(index);
    if (key) data[key] = schoolStorage.getItem(key);
  }
  return { version: 1, createdAt: new Date().toISOString(), data };
}
