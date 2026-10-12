import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogModel } from '../src/model.js';
const row = { id: 'fixture', code: 'MED-01', name: 'Paracetamol', activeIngredient: 'Paracetamol', active: true };
const listing = { data: [row], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };
test('uses gateway contract and filters only the loaded page', async () => {
  const model = catalogModel(async path => { assert.equal(path, '/api/v1/medications?page=1&limit=20'); return listing; });
  await model.load(); assert.equal(model.snapshot().meta.total, 1);
  model.filter('PARA'); assert.equal(model.rows().length, 1);
  model.filter('unknown'); assert.equal(model.rows().length, 0);
  model.detail(row); assert.equal(model.snapshot().detail, row); model.close(); assert.equal(model.snapshot().detail, null);
});
test('supports empty state, errors and retry', async () => {
  let fail = true;
  const model = catalogModel(async () => { if (fail) throw Error('offline'); return { ...listing, data: [], meta: { ...listing.meta, total: 0, totalPages: 0 } }; });
  await model.load(); assert.ok(model.snapshot().error); fail = false;
  await model.load(); assert.equal(model.snapshot().error, ''); assert.equal(model.rows().length, 0);
});
test('disposal ignores an in-flight response', async () => {
  let resolve; const response = new Promise(done => { resolve = done; });
  const model = catalogModel(() => response); const pending = model.load(); model.dispose(); resolve(listing); await pending;
  assert.equal(model.snapshot().data.length, 0);
});
test('newest page wins and malformed responses are rejected', async () => {
  let resolve; const slow = new Promise(done => { resolve = done; });
  const model = catalogModel(async path => path.includes('page=1&') ? slow : { ...listing, meta: { ...listing.meta, page: 2 } });
  const pending = model.load(); await model.load(2); resolve(listing); await pending; assert.equal(model.snapshot().page, 2);
  const invalid = catalogModel(async () => ({ data: [], meta: {} })); await invalid.load(); assert.ok(invalid.snapshot().error);
});
