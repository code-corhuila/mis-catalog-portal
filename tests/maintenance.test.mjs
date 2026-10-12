import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medicationEditor } from '../src/maintenance-model.js';
const id = '11111111-1111-4111-8111-111111111111';
const record = { id, code: 'WEB-EDIT', name: 'Synthetic', activeIngredient: 'Synthetic ingredient', pharmaceuticalForm: 'Tablet', concentration: '1 mg', unitOfMeasure: 'UNIT', active: true };
const version = (data = record, etag = '"0"') => ({ data, etag });
const fail = status => Object.assign(Error('rejected'), { status });
test('reads an owner version, edits with If-Match and preserves immutable unit', async () => {
  const calls = []; let refreshed = 0;
  const model = medicationEditor(async (path, options) => { calls.push([path, options]); return options ? version({ ...record, name: 'Changed' }, '"1"') : version(); }, { pending: null }, () => {}, () => refreshed++);
  await model.load(id); model.snapshot().draft.unitOfMeasure = 'OTHER'; await model.save(); assert.equal(calls.length, 1);
  model.snapshot().draft.unitOfMeasure = 'UNIT'; model.snapshot().draft.name = 'Changed'; await model.save();
  assert.equal(calls[1][1].method, 'PUT'); assert.deepEqual(calls[1][1].headers, { 'If-Match': '"0"' }); assert.equal(model.snapshot().result.name, 'Changed'); assert.equal(refreshed, 1);
});
test('deactivation requires confirmation and sends an empty conditional POST', async () => {
  const calls = []; const model = medicationEditor(async (_, options) => { if (options) calls.push(options); return options ? version({ ...record, active: false }, '"1"') : version(); }, { pending: null });
  await model.load(id); await model.save(true); assert.equal(calls.length, 0); model.askDeactivate(); model.cancelDeactivate(); await model.save(true); assert.equal(calls.length, 0);
  model.askDeactivate(); await model.save(true); assert.equal(calls[0].body, '{}'); assert.equal(calls[0].method, 'POST'); assert.equal(model.snapshot().result.active, false);
});
test('412 never adopts a fresh version automatically; explicit review discards the draft', async () => {
  const pending = { pending: null }, calls = [];
  const model = medicationEditor(async (path, options) => { calls.push([path, options]); if (options) throw fail(412); return calls.length > 1 ? version({ ...record, name: 'Concurrent' }, '"2"') : version(); }, pending);
  await model.load(id); model.snapshot().draft.name = 'My stale change'; await model.save();
  assert.equal(model.snapshot().conflict, true); assert.equal(model.snapshot().locked, true); assert.ok(pending.pending);
  await model.save(); assert.equal(calls.length, 2); await model.review(); assert.equal(calls.length, 3);
  assert.equal(pending.pending, null); assert.equal(model.snapshot().etag, '"2"'); assert.equal(model.snapshot().draft.name, 'Concurrent');
});
test('lost reply remount and duplicate clicks preserve exact method/body/version', async () => {
  const pending = { pending: null }, calls = []; let reject;
  const wait = new Promise((_, no) => { reject = no; });
  const first = medicationEditor(async (_, options) => { if (!options) return version(); calls.push(options); return wait; }, pending);
  await first.load(id); first.snapshot().draft.name = 'Changed'; const request = first.save(); await first.save(); assert.equal(calls.length, 1);
  reject(Error('lost acknowledgement')); await request; first.close(); assert.equal(first.snapshot().open, true); first.dispose();
  const replay = medicationEditor(async (_, options) => { calls.push(options); throw fail(412); }, pending);
  await replay.save(); assert.deepEqual(calls[0], calls[1]); assert.equal(replay.snapshot().conflict, true);
});
test('422 permits correction; absent ETag and failed fresh reads do not expose an editable stale record', async () => {
  let invalidRead = false; const pending = { pending: null };
  const model = medicationEditor(async (_, options) => { if (options) throw fail(422); return invalidRead ? version(record, null) : version(); }, pending);
  await model.load(id); await model.save(); assert.equal(pending.pending, null); assert.equal(model.snapshot().locked, false);
  invalidRead = true; await model.load(id); assert.equal(model.snapshot().record, null); assert.ok(model.snapshot().error);
});
test('disposed writes retain intent, malformed acknowledgements remain uncertain', async () => {
  let resolve; const wait = new Promise(done => { resolve = done; }), pending = { pending: null };
  const model = medicationEditor(async (_, options) => options ? wait : version(), pending); await model.load(id); const request = model.save(); model.dispose(); resolve(version()); await request; assert.ok(pending.pending);
  const replay = medicationEditor(async () => version({ ...record, name: 'Wrong' }), pending); await replay.save(); assert.equal(replay.snapshot().result, null); assert.equal(replay.snapshot().locked, true);
});
