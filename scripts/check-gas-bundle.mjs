import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const codePath = path.join(root, 'apps-script', 'Code.gs');
const manifestPath = path.join(root, 'apps-script', 'appsscript.json');

const [code, manifestRaw] = await Promise.all([
  readFile(codePath, 'utf8'),
  readFile(manifestPath, 'utf8'),
]);

const requiredPatterns = [
  ['doGet', /\bfunction\s+doGet\s*\(/],
  ['doPost', /\bfunction\s+doPost\s*\(/],
  ['getData', /\bfunction\s+getData\s*\(/],
  ['jsonOut', /\bfunction\s+jsonOut\s*\(/],
];

for (const [name, pattern] of requiredPatterns) {
  if (!pattern.test(code)) {
    throw new Error(`apps-script/Code.gs is missing required function: ${name}`);
  }
}

const requiredActions = [
  'getData',
  'saveHS',
  'updateHS',
  'deleteHS',
  'saveClass',
  'updateClass',
  'deleteClass',
  'savePayment',
  'updatePayment',
  'deletePayment',
  'saveExpense',
  'updateExpense',
  'deleteExpense',
  'getRoomRental',
  'saveRentalBooking',
  'updateRentalBooking',
  'deleteRentalBooking',
  'saveRentalPayment',
  'getScores',
  'saveAssessment',
  'updateAssessment',
  'deleteAssessment',
  'saveScores',
  'reopenAssessment',
  'saveDiary',
  'updateDiary',
  'deleteDiary',
  'saveTeacher',
  'updateTeacher',
  'deleteTeacher',
];

for (const action of requiredActions) {
  if (!code.includes(`${action}: ${action}`)) {
    throw new Error(`apps-script/Code.gs is missing action mapping: ${action}`);
  }
}

let manifest;
try {
  manifest = JSON.parse(manifestRaw);
} catch (err) {
  throw new Error(`apps-script/appsscript.json is invalid JSON: ${err.message}`);
}

if (manifest.timeZone !== 'Asia/Ho_Chi_Minh') {
  throw new Error('appsscript.json must use Asia/Ho_Chi_Minh timezone');
}

if (manifest.runtimeVersion !== 'V8') {
  throw new Error('appsscript.json must use V8 runtime');
}

if (manifest.webapp?.executeAs !== 'USER_DEPLOYING') {
  throw new Error('appsscript.json webapp.executeAs must be USER_DEPLOYING');
}

if (manifest.webapp?.access !== 'ANYONE_ANONYMOUS') {
  throw new Error('appsscript.json webapp.access must be ANYONE_ANONYMOUS');
}

const forbiddenHints = [
  'refresh_token',
  'client_secret',
  'private_key',
  '-----BEGIN PRIVATE KEY-----',
];

for (const hint of forbiddenHints) {
  if (code.includes(hint) || manifestRaw.includes(hint)) {
    throw new Error(`Potential credential committed in Apps Script bundle: ${hint}`);
  }
}

console.log('Apps Script bundle check passed.');
