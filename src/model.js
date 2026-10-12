export function catalogModel(request, changed = () => {}) {
  let generation = 0, disposed = false;
  let state = { page: 1, limit: 20, data: [], meta: { total: 0, totalPages: 0 }, loading: false, error: '', query: '', detail: null };
  const update = patch => { state = { ...state, ...patch }; changed(state); };
  async function load(page = state.page) {
    if (disposed || !Number.isSafeInteger(page) || page < 1) return;
    const version = ++generation;
    update({ page, loading: true, error: '', data: [], detail: null });
    try {
      const result = await request(`/api/v1/medications?page=${page}&limit=${state.limit}`);
      if (disposed || version !== generation) return;
      if (!Array.isArray(result.data) || result.meta?.page !== page || result.meta?.limit !== state.limit || !Number.isSafeInteger(result.meta.total) || result.meta.total < 0 || !Number.isSafeInteger(result.meta.totalPages) || result.meta.totalPages < 0 || result.data.length > state.limit || result.data.some(row => typeof row.id !== 'string' || typeof row.code !== 'string' || typeof row.name !== 'string' || typeof row.active !== 'boolean')) throw Error('Invalid catalog response');
      update({ data: result.data, meta: result.meta, loading: false });
    } catch (error) {
      if (disposed || version !== generation) return;
      update({ loading: false, error: error.status === 401 ? 'Sesion vencida.' : error.status === 403 ? 'No tienes permiso para consultar el catalogo.' : 'No fue posible cargar los medicamentos.' });
    }
  }
  return {
    load, snapshot: () => state,
    filter(query) { if (!disposed) update({ query: String(query).slice(0, 80) }); },
    rows() { const query = state.query.toLocaleLowerCase('es'); return state.data.filter(row => `${row.code} ${row.name} ${row.activeIngredient}`.toLocaleLowerCase('es').includes(query)); },
    detail(row) { if (!disposed) update({ detail: row }); },
    close() { if (!disposed) update({ detail: null }); },
    dispose() { disposed = true; generation++; state = { ...state, data: [], detail: null }; }
  };
}
