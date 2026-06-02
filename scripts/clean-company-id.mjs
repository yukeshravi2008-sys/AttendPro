import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// --- CONFIG ----------------------------------------------
// Path to your Firebase service account key JSON file.
// Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
const SERVICE_ACCOUNT_PATH = resolve('./service-account-key.json');

// Characters safe from l/1/O/0 ambiguity
const CLEAN_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// ----------------------------------------------------------

function generateCleanId(length = 12) {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += CLEAN_CHARS[Math.floor(Math.random() * CLEAN_CHARS.length)];
  }
  return id;
}

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`\n  Service account key not found at: ${SERVICE_ACCOUNT_PATH}`);
  console.error('  Download it from Firebase Console → Project Settings → Service Accounts');
  console.error('  Then re-run this script.\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function main() {
  console.log('\n=== Step 1: Read existing companies ===');
  const companiesSnap = await db.collection('companies').get();
  const companies = [];
  companiesSnap.forEach(doc => companies.push({ id: doc.id, ...doc.data() }));
  console.log(`  Found ${companies.length} company document(s):`);
  companies.forEach(c => console.log(`    - ${c.id}  "${c.company_name || '(no name)'}"`));

  if (companies.length === 0) {
    console.log('  No companies to migrate. Done.\n');
    return;
  }

  console.log('\n=== Step 2: Create companies with clean IDs ===');
  const idMap = {}; // oldId → newId

  for (const company of companies) {
    const newId = generateCleanId(12);
    idMap[company.id] = newId;

    const { id, ...data } = company;
    console.log(`  ${company.id}  →  ${newId}  "${data.company_name || '(no name)'}"`);

    // Create new doc
    await db.collection('companies').doc(newId).set(data);

    // Delete old doc
    await db.collection('companies').doc(company.id).delete();
  }

  console.log('\n=== Step 3: Update user documents ===');
  const usersSnap = await db.collection('users').get();
  let userUpdates = 0;
  const batch = db.batch();
  usersSnap.forEach(doc => {
    const data = doc.data();
    const oldId = data.company_id || data.companyId;
    if (oldId && idMap[oldId]) {
      batch.update(doc.ref, { company_id: idMap[oldId], companyId: idMap[oldId] });
      userUpdates++;
    }
  });
  if (userUpdates > 0) {
    await batch.commit();
    console.log(`  Updated ${userUpdates} user document(s)`);
  } else {
    console.log('  No user documents needed updating');
  }

  console.log('\n=== Step 4: Update attendance records ===');
  let attendanceUpdates = 0;
  const attendanceSnap = await db.collection('attendance').get();
  const attBatch = db.batch();
  attendanceSnap.forEach(doc => {
    const data = doc.data();
    if (data.company_id && idMap[data.company_id]) {
      attBatch.update(doc.ref, { company_id: idMap[data.company_id] });
      attendanceUpdates++;
    }
  });
  if (attendanceUpdates > 0) {
    await attBatch.commit();
    console.log(`  Updated ${attendanceUpdates} attendance record(s)`);
  } else {
    console.log('  No attendance records needed updating');
  }

  console.log('\n=== Step 5: Update leave_requests ===');
  let leaveUpdates = 0;
  const leaveSnap = await db.collection('leave_requests').get();
  const leaveBatch = db.batch();
  leaveSnap.forEach(doc => {
    const data = doc.data();
    if (data.company_id && idMap[data.company_id]) {
      leaveBatch.update(doc.ref, { company_id: idMap[data.company_id] });
      leaveUpdates++;
    }
  });
  if (leaveUpdates > 0) {
    await leaveBatch.commit();
    console.log(`  Updated ${leaveUpdates} leave request(s)`);
  } else {
    console.log('  No leave requests needed updating');
  }

  console.log('\n=== Step 6: Update shifts ===');
  let shiftUpdates = 0;
  const shiftsSnap = await db.collection('shifts').get();
  const shiftBatch = db.batch();
  shiftsSnap.forEach(doc => {
    const data = doc.data();
    if (data.company_id && idMap[data.company_id]) {
      shiftBatch.update(doc.ref, { company_id: idMap[data.company_id] });
      shiftUpdates++;
    }
  });
  if (shiftUpdates > 0) {
    await shiftBatch.commit();
    console.log(`  Updated ${shiftUpdates} shift(s)`);
  } else {
    console.log('  No shifts needed updating');
  }

  console.log('\n=== Step 7: Update holidays ===');
  let holidayUpdates = 0;
  const holidaysSnap = await db.collection('holidays').get();
  const holidayBatch = db.batch();
  holidaysSnap.forEach(doc => {
    const data = doc.data();
    if (data.company_id && idMap[data.company_id]) {
      holidayBatch.update(doc.ref, { company_id: idMap[data.company_id] });
      holidayUpdates++;
    }
  });
  if (holidayUpdates > 0) {
    await holidayBatch.commit();
    console.log(`  Updated ${holidayUpdates} holiday(s)`);
  } else {
    console.log('  No holidays needed updating');
  }

  // Summary
  console.log('\n=============== MIGRATION COMPLETE ===============');
  console.log('Old ID → New ID mapping:');
  for (const [oldId, newId] of Object.entries(idMap)) {
    console.log(`  ${oldId}  →  ${newId}`);
  }
  console.log(`\n  Users updated:     ${userUpdates}`);
  console.log(`  Attendance updated: ${attendanceUpdates}`);
  console.log(`  Leaves updated:     ${leaveUpdates}`);
  console.log(`  Shifts updated:     ${shiftUpdates}`);
  console.log(`  Holidays updated:   ${holidayUpdates}`);
  console.log('==================================================\n');
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
