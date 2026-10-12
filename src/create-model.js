export const medicationFields = [
  { key: 'code', label: 'C\u00f3digo', max: 40 }, { key: 'name', label: 'Nombre', max: 160 },
  { key: 'activeIngredient', label: 'Principio activo', max: 160 },
  { key: 'pharmaceuticalForm', label: 'Forma farmac\u00e9utica', max: 80 },
  { key: 'concentration', label: 'Concentraci\u00f3n', max: 80 },
  { key: 'unitOfMeasure', label: 'Unidad de medida', max: 40 }
];
export const emptyMedication = () => Object.fromEntries(medicationFields.map(field => [field.key, '']));
export function medicationBody(draft) {
  const body = {};
  for (const field of medicationFields) {
    const value = typeof draft[field.key] === 'string' ? draft[field.key].trim() : '';
    if (!value || value.length > field.max) throw Error(`${field.label}: campo obligatorio, m\u00e1ximo ${field.max} caracteres.`);
    body[field.key] = value;
  }
  if (!/^[A-Za-z0-9-]{1,40}$/.test(body.code)) throw Error('El codigo solo admite letras, numeros y guiones.');
  body.code = body.code.toUpperCase(); return body;
}
export function medicationCreator(request, store, changed = () => {}, confirmed = () => {}) {
  let disposed = false;
  let state = { open: !!store.pending, busy: false, locked: !!store.pending, result: store.pending?.result || null, error: '' };
  const update = patch => { if (!disposed) { state = { ...state, ...patch }; changed(state); } };
  async function create(draft) {
    if (disposed || state.busy || state.result) return;
    let body;
    try { body = JSON.stringify(medicationBody(draft)); } catch (error) { update({ error: error.message }); return; }
    if (store.pending && store.pending.body !== body) { update({ error: 'Reintenta el registro original sin modificar los datos.' }); return; }
    store.pending ||= { key: crypto.randomUUID(), body, result: null };
    const intent = store.pending, expected = JSON.parse(intent.body); update({ busy: true, locked: true, error: '' });
    try {
      const result = await request('/api/v1/medications', { method: 'POST', headers: { 'Idempotency-Key': intent.key }, body: intent.body });
      if (disposed) return;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result?.id) || typeof result.active !== 'boolean' || medicationFields.some(field => result[field.key] !== expected[field.key])) throw Error('Invalid creation acknowledgement');
      intent.result = result; update({ busy: false, result });
      try { await confirmed(); } catch { update({ error: 'Medicamento confirmado; no fue posible actualizar la lista.' }); }
    } catch (error) {
      if (disposed) return;
      const definitive = [400, 403, 422].includes(error.status); if (definitive) store.pending = null;
      update({ busy: false, locked: !definitive, error: error.status === 422 ? 'Codigo ocupado o datos rechazados. Revisa el registro.' : error.status === 403 ? 'No tienes permiso para crear medicamentos.' : definitive ? 'Revisa los datos del medicamento.' : 'No se confirmo el registro. Reintenta el mismo envio.' });
    }
  }
  return { create, snapshot: () => state,
    begin() { if (disposed || state.busy || store.pending) return false; update({ open: true, error: '' }); return true; },
    close() { if (!disposed && !state.busy && !store.pending) update({ open: false, error: '' }); },
    reset() { if (!disposed && !state.busy && (!store.pending || store.pending.result)) { store.pending = null; update({ open: false, locked: false, result: null, error: '' }); return true; } return false; },
    dispose() { disposed = true; }
  };
}
