import { medicationBody, medicationFields } from './create-model.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function checked(response, id) {
  if (response?.data?.id !== id || typeof response.data.active !== 'boolean' || !/^"(0|[1-9][0-9]{0,18})"$/.test(response.etag)) throw Error('Invalid versioned medication');
  medicationBody(response.data); return response;
}
export function medicationEditor(request, store, changed = () => {}, confirmed = () => {}) {
  let disposed = false;
  const pending = store.pending;
  let state = { open: !!pending, busy: false, locked: !!pending, record: pending?.record || null, etag: pending?.etag || null, draft: pending ? medicationBody(pending.record) : {}, result: null, error: '', conflict: false, askDeactivate: false };
  if (pending?.method === 'PUT') state.draft = JSON.parse(pending.body);
  const update = patch => { if (!disposed) { state = { ...state, ...patch }; changed(state); } };
  async function load(id, reviewing = false) {
    if (disposed || state.busy || !uuid.test(id) || (store.pending && !reviewing)) return;
    update({ open: true, busy: true, error: '', ...(reviewing ? {} : { record: null, etag: null, result: null, draft: {}, locked: false, askDeactivate: false }) });
    try {
      const response = checked(await request(`/api/v1/medications/${id}`), id);
      if (disposed) return;
      if (reviewing) store.pending = null;
      update({ busy: false, locked: false, record: response.data, etag: response.etag, draft: medicationBody(response.data), result: null, conflict: false, askDeactivate: false, error: reviewing ? 'Version actual cargada. Revisa los datos antes de iniciar otro cambio.' : '' });
    } catch { update({ busy: false, error: 'No fue posible consultar la version actual. Vuelve a intentar.' }); }
  }
  async function save(deactivate = false) {
    if (disposed || state.busy || state.result || !state.record || state.conflict) return;
    let intent = store.pending;
    if (!intent) {
      let body;
      try { body = deactivate ? '{}' : JSON.stringify(medicationBody(state.draft)); } catch (error) { update({ error: error.message }); return; }
      if (deactivate && (!state.askDeactivate || !state.record.active)) return;
      if (!deactivate && JSON.parse(body).unitOfMeasure !== state.record.unitOfMeasure) { update({ error: 'La unidad de medida no se puede modificar.' }); return; }
      intent = { path: `/api/v1/medications/${state.record.id}${deactivate ? '/deactivate' : ''}`, method: deactivate ? 'POST' : 'PUT', body, etag: state.etag, record: state.record };
      store.pending = intent;
    }
    update({ busy: true, locked: true, error: '', askDeactivate: false });
    try {
      const response = checked(await request(intent.path, { method: intent.method, headers: { 'If-Match': intent.etag }, body: intent.body }), intent.record.id);
      if (disposed) return;
      const expected = intent.method === 'PUT' ? JSON.parse(intent.body) : medicationBody(intent.record);
      if (medicationFields.some(field => response.data[field.key] !== expected[field.key]) || response.data.active !== (intent.method === 'PUT' ? intent.record.active : false)) throw Error('Invalid mutation acknowledgement');
      store.pending = null; update({ busy: false, locked: false, record: response.data, etag: response.etag, result: response.data });
      try { await confirmed(); } catch { update({ error: 'Cambio confirmado; no fue posible actualizar la lista.' }); }
    } catch (error) {
      if (disposed) return;
      const definitive = [400, 403, 404, 422, 428].includes(error.status);
      if (definitive) store.pending = null;
      update({ busy: false, locked: !definitive, conflict: error.status === 412, error: error.status === 412 ? 'La version cambio. Consulta el estado actual antes de realizar otro cambio.' : error.status === 422 ? 'Codigo ocupado o cambio rechazado. Revisa los datos.' : error.status === 403 ? 'No tienes permiso para modificar medicamentos.' : definitive ? 'Cambio rechazado. Revisa o consulta nuevamente el registro.' : 'No se confirmo el cambio. Reintenta con la misma version.' });
    }
  }
  return { load, save, snapshot: () => state,
    review() { if (state.record) return load(state.record.id, true); },
    askDeactivate() { if (!disposed && !state.busy && !state.locked && state.record?.active && !state.result) update({ askDeactivate: true }); },
    cancelDeactivate() { if (!state.busy) update({ askDeactivate: false }); },
    close() { if (!disposed && !state.busy && !store.pending) update({ open: false, record: null, result: null, error: '' }); },
    dispose() { disposed = true; }
  };
}
