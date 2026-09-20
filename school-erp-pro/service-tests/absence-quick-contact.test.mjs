import test from 'node:test';
import assert from 'node:assert/strict';
import { parentContacts, communicationLink } from '../src/services/absenceCommunication.js';

test('primary contact ordering falls back to the next valid family contact', () => {
  const student = { fatherMobile: '9000000101', motherMobile: '9000000102', emergencyMobile: '9000000103' };
  assert.equal(parentContacts(student, 'mother').find(contact => contact.mobile).id, 'mother');
  assert.equal(parentContacts({ ...student, motherMobile: 'invalid' }, 'mother').find(contact => contact.mobile).id, 'father');
  assert.equal(parentContacts({ ...student, fatherMobile: '', motherMobile: '' }, 'father').find(contact => contact.mobile).id, 'emergency');
});

test('each parent has its own dial URI without messaging provider configuration', () => {
  const contacts = parentContacts({ fatherMobile: '9000000101', motherMobile: '9000000102', emergencyContact: '9000000103' });
  assert.deepEqual(contacts.map(contact => communicationLink('call', contact.mobile)), ['tel:+919000000101','tel:+919000000102','tel:+919000000103']);
  assert.equal(communicationLink('call', 'invalid'), '');
});
