// tests/verify-staging-operations.mjs
import assert from 'node:assert';

const API_BASE = 'http://localhost:8080/api/v1';
const PASSWORD = 'Staging@FAS2026!';

const results = {
  shifts: {
    query5Shifts: false,
    assignShift: false,
    deleteInUseShift409: false,
    details: {}
  },
  excuses: {
    queryExisting: false,
    submitNewExcuse: false,
    decideExcuse2: false,
    details: {}
  },
  payroll: {
    queryOctNov: false,
    lockNov2026: false,
    unlockValidationFailure: false,
    unlockWithReason: false,
    details: {}
  }
};

async function login(email) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data.data.accessToken;
}

async function run() {
  console.log('--- 1. Authenticating Personas ---');
  const hrToken = await login('hr.manager@fas.company.com');
  const devToken = await login('dev.an@fas.company.com');
  const adminToken = await login('staging-admin@fas.company.com');
  console.log('All personas authenticated successfully.');

  // ==========================================
  // WORKFLOW 1: SHIFTS
  // ==========================================
  console.log('\n--- 2. Verifying Workflow 1: Shifts ---');

  // 1.1 Query 5 pre-configured shifts
  const shiftsRes = await fetch(`${API_BASE}/admin/shifts`, {
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const shiftsData = await shiftsRes.json();
  assert.strictEqual(shiftsRes.status, 200, 'GET /admin/shifts should return 200');
  const shiftsList = shiftsData.data || [];
  console.log(`Found ${shiftsList.length} shifts in total.`);
  const requiredShifts = ['SHIFT-OFFICE', 'SHIFT-MORNING', 'SHIFT-AFTERNOON', 'SHIFT-NIGHT', 'SHIFT-FLEXI'];
  const foundShiftCodes = shiftsList.map(s => s.shiftCode);
  console.log('Available shift codes:', foundShiftCodes);

  const all5Found = requiredShifts.every(code => foundShiftCodes.includes(code));
  assert.strictEqual(all5Found, true, `All 5 pre-configured shifts must exist. Found: ${foundShiftCodes.join(', ')}`);
  results.shifts.query5Shifts = true;
  results.shifts.details.foundShifts = requiredShifts.map(code => {
    const s = shiftsList.find(x => x.shiftCode === code);
    return { id: s.id, code: s.shiftCode, name: s.shiftName, start: s.startTime, end: s.endTime, active: s.isActive };
  });
  console.log('Query 5 pre-configured shifts: PASS');

  // 1.2 Test assigning shift
  // Pick a future range after the existing 180-day window: 2027-07-01 to 2027-07-15
  const shiftOffice = shiftsList.find(s => s.shiftCode === 'SHIFT-OFFICE');
  const shiftAfternoon = shiftsList.find(s => s.shiftCode === 'SHIFT-AFTERNOON');
  assert.ok(shiftOffice, 'SHIFT-OFFICE exists');
  assert.ok(shiftAfternoon, 'SHIFT-AFTERNOON exists');

  const assignPayload = {
    userId: 7, // dev.an
    shiftId: shiftAfternoon.id,
    effectiveFrom: '2027-07-01',
    effectiveTo: '2027-07-15'
  };

  const assignRes = await fetch(`${API_BASE}/admin/employee-shifts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hrToken}`
    },
    body: JSON.stringify(assignPayload)
  });
  const assignData = await assignRes.json();
  console.log('Assign shift response status:', assignRes.status, assignData.code);
  let createdAssignmentId = null;
  assert.strictEqual(assignRes.status, 201, 'Assigning shift outside overlapping range should succeed with 201');
  createdAssignmentId = assignData.data.id;
  results.shifts.assignShift = true;
  results.shifts.details.createdAssignment = assignData.data;
  console.log('Assign shift: PASS (Created assignment ID:', createdAssignmentId, ')');

  // 1.3 Test deleting/deactivating an in-use shift and verify error code 'SHIFT_IN_USE' / HTTP 409
  // SHIFT-OFFICE is currently in active use by STG-ADM-001, STG-HR-001, etc.
  console.log(`Testing deactivation of in-use shift ${shiftOffice.shiftCode} (ID: ${shiftOffice.id})...`);
  const deactivateInUseRes = await fetch(`${API_BASE}/admin/shifts/${shiftOffice.id}/deactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const deactivateInUseData = await deactivateInUseRes.json();
  console.log('Deactivate in-use shift response:', deactivateInUseRes.status, deactivateInUseData);

  assert.strictEqual(deactivateInUseRes.status, 409, 'Deactivating in-use shift must return HTTP 409');
  assert.strictEqual(deactivateInUseData.code, 'SHIFT_IN_USE', 'Error code must be SHIFT_IN_USE');
  results.shifts.deleteInUseShift409 = true;
  results.shifts.details.deactivateInUseResponse = deactivateInUseData;
  console.log('Delete / Deactivate in-use shift error code SHIFT_IN_USE / HTTP 409: PASS');

  // Clean up assignment created for dev.an
  if (createdAssignmentId) {
    const unassignRes = await fetch(`${API_BASE}/admin/employee-shifts/${createdAssignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    console.log('Cleaned up test assignment:', unassignRes.status);
  }

  // ==========================================
  // WORKFLOW 2: EXCUSE REQUESTS
  // ==========================================
  console.log('\n--- 3. Verifying Workflow 2: Excuse Requests ---');

  // 2.1 Query existing requests (ID 1 APPROVED, ID 2 PENDING, ID 3 REJECTED)
  const excusesRes = await fetch(`${API_BASE}/admin/excuse-requests`, {
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const excusesData = await excusesRes.json();
  assert.strictEqual(excusesRes.status, 200, 'GET /admin/excuse-requests should return 200');
  const excuseItems = excusesData.data.content || excusesData.data.items || [];
  console.log(`Found ${excuseItems.length} excuse requests in total.`);
  for (const it of excuseItems) {
    console.log(`  - ID: ${it.id}, Status: ${it.status}, Employee: ${it.fullName} (${it.employeeCode}), Reason: ${it.reason.substring(0, 30)}...`);
  }

  const excuse1 = excuseItems.find(e => e.id === 1);
  const excuse2 = excuseItems.find(e => e.id === 2);
  const excuse3 = excuseItems.find(e => e.id === 3);

  assert.ok(excuse1, 'Excuse ID 1 must exist');
  assert.ok(excuse2, 'Excuse ID 2 must exist');
  assert.ok(excuse3, 'Excuse ID 3 must exist');

  assert.strictEqual(excuse1.status, 'APPROVED', 'Excuse ID 1 status must be APPROVED');
  assert.strictEqual(excuse2.status, 'PENDING', 'Excuse ID 2 status must be PENDING');
  assert.strictEqual(excuse3.status, 'REJECTED', 'Excuse ID 3 status must be REJECTED');

  results.excuses.queryExisting = true;
  results.excuses.details.seededRequests = {
    id1: { id: excuse1.id, status: excuse1.status, employee: excuse1.fullName },
    id2: { id: excuse2.id, status: excuse2.status, employee: excuse2.fullName },
    id3: { id: excuse3.id, status: excuse3.status, employee: excuse3.fullName }
  };
  console.log('Query existing requests (ID 1 APPROVED, ID 2 PENDING, ID 3 REJECTED): PASS');

  // 2.2 Test submitting new excuse request as EMPLOYEE (dev.an)
  const myLogsRes = await fetch(`${API_BASE}/employee/attendance/logs`, {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  const myLogsData = await myLogsRes.json();
  assert.strictEqual(myLogsRes.status, 200, 'GET /employee/attendance/logs should return 200');
  const logs = myLogsData.data.content || myLogsData.data.items || [];
  console.log(`dev.an has ${logs.length} personal attendance logs.`);
  assert.ok(logs.length > 0, 'dev.an must have attendance logs to submit excuse');

  const targetLog = logs[0];
  const targetLogId = targetLog.recordId || targetLog.id;
  console.log(`Targeting attendance log ID ${targetLogId} for submission`);

  const submitPayload = {
    attendanceLogId: targetLogId,
    reason: 'Đến muộn do kiểm tra sự cố mạng VPN nội bộ tại nhà trước khi tới cơ quan',
    requestedPunchTimestamp: targetLog.punchTimestamp
  };

  const submitRes = await fetch(`${API_BASE}/employee/excuse-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${devToken}`
    },
    body: JSON.stringify(submitPayload)
  });
  const submitData = await submitRes.json();
  console.log('Submit excuse response:', submitRes.status, submitData.code || submitData.status);

  if (submitRes.status === 201) {
    results.excuses.submitNewExcuse = true;
    results.excuses.details.newExcuse = submitData.data;
    console.log('Submit new excuse request: PASS (New excuse ID:', submitData.data.id, ')');
  } else if (submitRes.status === 409 && submitData.code === 'EXCUSE_ALREADY_PENDING') {
    results.excuses.submitNewExcuse = true;
    results.excuses.details.submitConflictVerified = true;
    console.log('Submit new excuse request: PASS (Verified EXCUSE_ALREADY_PENDING constraint)');
  } else {
    throw new Error(`Submit excuse failed: ${submitRes.status} ${JSON.stringify(submitData)}`);
  }

  // 2.3 Test approving/rejecting excuse #2 as HR_MANAGER
  console.log('Current status of excuse #2:', excuse2.status);
  const decideRes = await fetch(`${API_BASE}/admin/excuse-requests/2/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hrToken}`
    },
    body: JSON.stringify({ reviewNote: 'Đã xác minh lịch hẹn Bệnh viện Bạch Mai hợp lệ. Phê duyệt bổ sung công.' })
  });
  const decideData = await decideRes.json();
  console.log('Approve excuse #2 response status:', decideRes.status, decideData.code);
  assert.strictEqual(decideRes.status, 200, 'POST /admin/excuse-requests/2/approve should return 200');
  assert.strictEqual(decideData.data.status, 'APPROVED', 'Excuse #2 status should now be APPROVED');
  results.excuses.decideExcuse2 = true;
  results.excuses.details.decidedExcuse2 = decideData.data;
  console.log('Approve excuse #2 as HR_MANAGER: PASS');

  // Verify that deciding already processed excuse returns 409 EXCUSE_ALREADY_PROCESSED
  const reDecideRes = await fetch(`${API_BASE}/admin/excuse-requests/2/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hrToken}`
    },
    body: JSON.stringify({ reviewNote: 'Thử duyệt lại' })
  });
  const reDecideData = await reDecideRes.json();
  console.log('Re-deciding excuse #2 response status:', reDecideRes.status, reDecideData.code);
  assert.strictEqual(reDecideRes.status, 409, 'Re-deciding processed excuse must return 409');
  assert.strictEqual(reDecideData.code, 'EXCUSE_ALREADY_PROCESSED');
  console.log('Anti-replay on decided excuse (EXCUSE_ALREADY_PROCESSED / 409): PASS');

  // ==========================================
  // WORKFLOW 3: PAYROLL PERIODS
  // ==========================================
  console.log('\n--- 4. Verifying Workflow 3: Payroll Periods ---');

  // 3.1 Query October 2026 (LOCKED) and November 2026 (OPEN)
  const periodsRes = await fetch(`${API_BASE}/admin/payroll-periods?year=2026`, {
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const periodsData = await periodsRes.json();
  assert.strictEqual(periodsRes.status, 200, 'GET /admin/payroll-periods should return 200');
  const periods = periodsData.data.content || periodsData.data.items || [];
  console.log(`Found ${periods.length} payroll periods for 2026.`);
  for (const p of periods) {
    console.log(`  - Period: ${p.periodYear}-${String(p.periodMonth).padStart(2, '0')}, Status: ${p.status}, LockedBy: ${p.lockedByName || 'N/A'}`);
  }

  const oct2026 = periods.find(p => p.periodYear === 2026 && p.periodMonth === 10);
  const nov2026 = periods.find(p => p.periodYear === 2026 && p.periodMonth === 11);

  assert.ok(oct2026, 'October 2026 period must exist');
  assert.ok(nov2026, 'November 2026 period must exist');

  assert.strictEqual(oct2026.status, 'LOCKED', 'October 2026 status must be LOCKED');
  assert.strictEqual(nov2026.status, 'OPEN', 'November 2026 status must be OPEN');

  results.payroll.queryOctNov = true;
  results.payroll.details.oct2026 = oct2026;
  results.payroll.details.nov2026 = nov2026;
  console.log('Query October 2026 (LOCKED) and November 2026 (OPEN): PASS');

  // 3.2 Test locking period November 2026
  const lockRes = await fetch(`${API_BASE}/admin/payroll-periods/2026-11/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const lockData = await lockRes.json();
  console.log('Lock November 2026 response:', lockRes.status, lockData.code);
  assert.strictEqual(lockRes.status, 200, 'POST /admin/payroll-periods/2026-11/lock should return 200');
  assert.strictEqual(lockData.data.status, 'LOCKED', 'November 2026 status must be LOCKED after lock');
  results.payroll.lockNov2026 = true;
  results.payroll.details.lockedNov = lockData.data;
  console.log('Lock period November 2026: PASS');

  // 3.3 Test unlocking period with mandatory audit reason
  // First test unlocking without reason or empty reason (should fail validation)
  const unlockNoReasonRes = await fetch(`${API_BASE}/admin/payroll-periods/2026-11/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ reason: '' })
  });
  const unlockNoReasonData = await unlockNoReasonRes.json();
  console.log('Unlock without reason response:', unlockNoReasonRes.status, unlockNoReasonData.code || unlockNoReasonData.title);
  assert.ok(unlockNoReasonRes.status === 400 || unlockNoReasonRes.status === 422, 'Unlock without reason must fail with 400');
  results.payroll.unlockValidationFailure = true;
  results.payroll.details.unlockValidation = unlockNoReasonData;
  console.log('Reject unlock without mandatory audit reason (HTTP 400): PASS');

  // Next test unlocking with valid audit reason as ADMIN
  const auditReason = 'Mở lại kỳ công tháng 11/2026 theo yêu cầu thanh tra nội bộ và điều chỉnh bổ sung công giải trình';
  const unlockWithReasonRes = await fetch(`${API_BASE}/admin/payroll-periods/2026-11/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ reason: auditReason })
  });
  const unlockWithReasonData = await unlockWithReasonRes.json();
  console.log('Unlock with audit reason response:', unlockWithReasonRes.status, unlockWithReasonData.code);
  assert.strictEqual(unlockWithReasonRes.status, 200, 'POST /admin/payroll-periods/2026-11/unlock should return 200');
  assert.strictEqual(unlockWithReasonData.data.status, 'OPEN', 'November 2026 status must be OPEN after unlock');
  results.payroll.unlockWithReason = true;
  results.payroll.details.unlockedNov = unlockWithReasonData.data;
  console.log('Unlock period with mandatory audit reason: PASS');

  console.log('\n==========================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('==========================================');
  return results;
}

run().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
