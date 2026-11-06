import { test } from 'node:test';
import assert from 'node:assert/strict';

// Core domain logic tests for UniHealth Triage Queue, Operational Modes, and Dashboards

function calculateOccupancy(occupied, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.round((occupied / capacity) * 100);
}

function calculateGaugeDashOffset(percentage, radius = 54) {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  return circumference * (1 - clamped / 100);
}

function filterTokens(tokens, { priority = 'all', status = 'all', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return tokens.filter(token => {
    const matchesPriority = priority === 'all' || token.priority.toLowerCase() === priority.toLowerCase();
    const matchesStatus = status === 'all' || token.status.toLowerCase() === status.toLowerCase();
    const matchesQuery = !q ||
      token.patient.toLowerCase().includes(q) ||
      token.number.toLowerCase().includes(q) ||
      (token.doctor_name && token.doctor_name.toLowerCase().includes(q)) ||
      (token.reason && token.reason.toLowerCase().includes(q));
    return matchesPriority && matchesStatus && matchesQuery;
  });
}

function canStartConsultation(token, doctor) {
  if (token.status !== 'waiting') return { allowed: false, reason: 'Only waiting tokens can be started' };
  if (!doctor || !doctor.on_duty) return { allowed: false, reason: 'Assigned specialist is not currently on duty' };
  return { allowed: true };
}

function canCompleteConsultation(token) {
  if (token.status !== 'in_progress') return { allowed: false, reason: 'Only in-progress consultations can be completed' };
  return { allowed: true };
}

test('occupancy percentage handles boundary and zero values correctly', () => {
  assert.equal(calculateOccupancy(0, 100), 0);
  assert.equal(calculateOccupancy(328, 420), 78);
  assert.equal(calculateOccupancy(32, 48), 67);
  assert.equal(calculateOccupancy(50, 0), 0);
});

test('gauge dash offset computes precise SVG circumference offset', () => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset78 = calculateGaugeDashOffset(78, radius);
  assert.ok(Math.abs(offset78 - (circumference * 0.22)) < 0.001);

  const offset100 = calculateGaugeDashOffset(100, radius);
  assert.equal(offset100, 0);

  const offset0 = calculateGaugeDashOffset(0, radius);
  assert.equal(offset0, circumference);
});

test('triage token filtering filters accurately by priority, status and search query', () => {
  const sampleTokens = [
    { number: 'T101', patient: 'Ananya Sharma', priority: 'emergency', status: 'waiting', doctor_name: 'Dr. Ramesh' },
    { number: 'T102', patient: 'Arun Kumar S.', priority: 'emergency', status: 'in_progress', doctor_name: 'Dr. Mohith' },
    { number: 'T103', patient: 'Priya R.', priority: 'urgent', status: 'waiting', doctor_name: 'Dr. Sneha' },
    { number: 'T104', patient: 'Vignesh M.', priority: 'routine', status: 'waiting', doctor_name: 'Dr. Rajesh' },
    { number: 'T105', patient: 'Hari Prasad K.', priority: 'routine', status: 'scheduled', doctor_name: 'Dr. Anjali' }
  ];

  // Filter by priority
  const emergencyOnly = filterTokens(sampleTokens, { priority: 'emergency' });
  assert.equal(emergencyOnly.length, 2);

  // Filter by status
  const waitingOnly = filterTokens(sampleTokens, { status: 'waiting' });
  assert.equal(waitingOnly.length, 3);

  // Filter by search query
  const querySearch = filterTokens(sampleTokens, { query: 'kumar' });
  assert.equal(querySearch.length, 1);
  assert.equal(querySearch[0].patient, 'Arun Kumar S.');

  // Combined filter
  const combined = filterTokens(sampleTokens, { priority: 'emergency', status: 'waiting' });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].number, 'T101');
});

test('clinical consultation state transitions enforce doctor on-duty and token status invariants', () => {
  const waitingToken = { id: 1, status: 'waiting', priority: 'emergency' };
  const inProgressToken = { id: 2, status: 'in_progress', priority: 'urgent' };
  const onDutyDoctor = { id: 10, name: 'Dr. Mohith', on_duty: true };
  const offDutyDoctor = { id: 11, name: 'Dr. Sneha', on_duty: false };

  // Cannot start consultation if doctor is off-duty
  const offDutyCheck = canStartConsultation(waitingToken, offDutyDoctor);
  assert.equal(offDutyCheck.allowed, false);

  // Can start if doctor is on-duty and token is waiting
  const onDutyCheck = canStartConsultation(waitingToken, onDutyDoctor);
  assert.equal(onDutyCheck.allowed, true);

  // Cannot start if token is already in_progress
  const alreadyStartedCheck = canStartConsultation(inProgressToken, onDutyDoctor);
  assert.equal(alreadyStartedCheck.allowed, false);

  // Can complete in-progress token
  assert.equal(canCompleteConsultation(inProgressToken).allowed, true);
  // Cannot complete waiting token directly
  assert.equal(canCompleteConsultation(waitingToken).allowed, false);
});
