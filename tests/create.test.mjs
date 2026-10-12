import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medicationBody, medicationCreator, medicationFields } from '../src/create-model.js';
const draft = { code: 'web-test', name: 'Synthetic medication', activeIngredient: 'Synthetic ingredient', pharmaceuticalForm: 'Tablet', concentration: '1 mg', unitOfMeasure: 'UNIT' };
const result = { ...medicationBody(draft), id: '11111111-1111-4111-8111-111111111111', active: true };
const store = () => ({ pending: null });
test('normalizes exact API fields and UTF-16 lengths, rejecting blank/invalid codes', () => {
  assert.equal(medicationBody({ ...draft, code: ' web-test ', ignored: 'discard' }).code, 'WEB-TEST');
  assert.deepEqual(Object.keys(medicationBody(draft)), medicationFields.map(field => field.key));
  for (const field of medicationFields) { assert.throws(() => medicationBody({ ...draft, [field.key]: ' ' })); assert.throws(() => medicationBody({ ...draft, [field.key]: 'a'.repeat(field.max + 1) })); }
  assert.throws(() => medicationBody({ ...draft, code: 'BAD_CODE' }));
  assert.throws(() => medicationBody({ ...draft, name: '\u{1f48a}'.repeat(81) }));
});
test('unknown reply survives remount with same key/body and one acknowledged refresh', async () => {
  const pending = store(), calls = []; let refreshes = 0;
  const request = async (path, options) => { calls.push({ path, ...options }); if (calls.length === 1) throw Error('lost reply'); return result; };
  const first = medicationCreator(request, pending); first.begin(); await first.create(draft);
  assert.equal(first.snapshot().locked, true); first.dispose();
  const next = medicationCreator(request, pending, () => {}, () => refreshes++);
  assert.equal(next.snapshot().open, true); await next.create(JSON.parse(pending.pending.body));
  assert.equal(calls[0].path, '/api/v1/medications'); assert.deepEqual(calls[0], calls[1]);
  assert.equal(refreshes, 1); assert.equal(next.snapshot().result.id, result.id);
  assert.equal(next.reset(), true); assert.equal(pending.pending, null);
});
test('duplicate clicks, mutation and abandonment of uncertain registration are denied', async () => {
  let reject; const wait = new Promise((_, fail) => { reject = fail; }); let calls = 0;
  const model = medicationCreator(() => { calls++; return wait; }, store()); model.begin();
  const request = model.create(draft); await model.create(draft); assert.equal(calls, 1);
  reject(Error('offline')); await request; await model.create({ ...draft, name: 'changed' });
  assert.equal(calls, 1); assert.equal(model.begin(), false); assert.equal(model.reset(), false);
  model.close(); assert.equal(model.snapshot().open, true);
});
test('definitive 422 allows a corrected new intention with a fresh key', async () => {
  const pending = store(), keys = []; let count = 0;
  const model = medicationCreator(async (_, options) => { keys.push(options.headers['Idempotency-Key']); if (++count === 1) throw Object.assign(Error('code occupied'), { status: 422 }); return result; }, pending);
  model.begin(); await model.create(draft); assert.equal(pending.pending, null); assert.equal(model.snapshot().locked, false);
  await model.create(draft); assert.notEqual(keys[0], keys[1]); assert.equal(model.snapshot().result.id, result.id);
});
test('malformed acknowledgement stays uncertain; refresh failure cannot negate a confirmed write', async () => {
  const pending = store(); const invalid = medicationCreator(async () => ({ ...result, code: 'WRONG' }), pending);
  invalid.begin(); await invalid.create(draft); assert.equal(invalid.snapshot().result, null); assert.equal(invalid.snapshot().locked, true);
  const replay = medicationCreator(async () => result, pending, () => {}, () => { throw Error('read failed'); });
  await replay.create(draft); assert.equal(replay.snapshot().result.id, result.id); assert.match(replay.snapshot().error, /confirmado/);
});
test('disposed in-flight response leaves pending intent available for replay', async () => {
  let resolve; const wait = new Promise(done => { resolve = done; }); const pending = store();
  const model = medicationCreator(() => wait, pending); model.begin(); const request = model.create(draft);
  const key = pending.pending.key; model.dispose(); resolve(result); await request;
  assert.equal(pending.pending.key, key); assert.equal(pending.pending.result, null);
});
