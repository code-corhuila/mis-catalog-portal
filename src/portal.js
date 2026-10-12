import '@angular/compiler';
import { Component, ChangeDetectionStrategy, ViewEncapsulation, createComponent, signal, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { catalogModel } from './model.js';
class CatalogPortal {
  state = signal({ loading: true, page: 1, data: [], meta: { total: 0, totalPages: 0 }, error: '', query: '', detail: null });
  model;
  initialize(request) { this.model = catalogModel(request, state => this.state.set(state)); this.model.load(); }
  ngOnDestroy() { this.model?.dispose(); }
}
Component({ selector: 'mis-catalog', standalone: true, encapsulation: ViewEncapsulation.ShadowDom, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="catalog-title" [attr.aria-busy]="state().loading">
      <div class="heading"><div><p class="eyebrow">MEDICAMENTOS</p><h1 id="catalog-title">Cat&#225;logo</h1></div><button (click)="model.load()" [disabled]="state().loading">Actualizar</button></div>
      <label for="catalog-search">Buscar en esta p&#225;gina</label>
      <input id="catalog-search" type="search" maxlength="80" [value]="state().query" (input)="model.filter($event.target.value)" placeholder="C&#243;digo, nombre o principio activo">
      @if (state().loading) { <p role="status">Cargando medicamentos...</p> }
      @else if (state().error) { <div role="alert"><p>{{ state().error }}</p><button (click)="model.load()">Reintentar</button></div> }
      @else {
        <p class="summary">{{ state().meta.total }} medicamentos registrados</p>
        @if (!model.rows().length) { <p role="status">No hay medicamentos para mostrar en esta p&#225;gina.</p> }
        @else { <div class="table-scroll"><table><thead><tr><th scope="col">C&#243;digo</th><th scope="col">Medicamento</th><th scope="col">Presentaci&#243;n</th><th scope="col">Estado</th><th scope="col">Ficha</th></tr></thead><tbody>
          @for (item of model.rows(); track item.id) { <tr><td>{{ item.code }}</td><td><strong>{{ item.name }}</strong><small>{{ item.activeIngredient }}</small></td><td>{{ item.pharmaceuticalForm }}<small>{{ item.concentration }} · {{ item.unitOfMeasure }}</small></td><td><span [class.inactive]="!item.active">{{ item.active ? 'Activo' : 'Inactivo' }}</span></td><td><button (click)="model.detail(item)" [attr.aria-label]="'Ver ficha de ' + item.name">Ver ficha</button></td></tr> }
        </tbody></table></div> }
        <nav class="pagination" aria-label="Paginacion de medicamentos"><button (click)="model.load(state().page - 1)" [disabled]="state().page === 1">Anterior</button><span>P&#225;gina {{ state().page }} de {{ state().meta.totalPages || 1 }}</span><button (click)="model.load(state().page + 1)" [disabled]="state().page >= state().meta.totalPages">Siguiente</button></nav>
      }
      @if (state().detail; as item) { <section class="detail" aria-labelledby="detail-title"><div class="heading"><h2 id="detail-title">{{ item.name }}</h2><button (click)="model.close()">Cerrar ficha</button></div><dl><dt>C&#243;digo</dt><dd>{{ item.code }}</dd><dt>Principio activo</dt><dd>{{ item.activeIngredient }}</dd><dt>Forma farmac&#233;utica</dt><dd>{{ item.pharmaceuticalForm }}</dd><dt>Concentraci&#243;n</dt><dd>{{ item.concentration }}</dd><dt>Unidad de medida</dt><dd>{{ item.unitOfMeasure }}</dd></dl></section> }
    </section>`,
  styles: [`:host{display:block;color:#182b32;font-family:Arial,sans-serif}*{box-sizing:border-box}h1{font-size:28px;margin:0}h2{font-size:20px;margin:0;overflow-wrap:anywhere}.eyebrow{font-size:12px;color:#0d655b;font-weight:700;margin:0 0 8px}.heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}button{min-height:40px;padding:8px 14px;border:1px solid #91a7b0;border-radius:4px;background:white;color:#243c45;cursor:pointer;font:inherit;flex-shrink:0}button:disabled{opacity:.45;cursor:default}button:hover:not(:disabled){background:#e8f4f1}:focus-visible{outline:3px solid #187dca;outline-offset:2px}label{display:block;font-size:14px;margin-bottom:8px}input{height:44px;max-width:440px;width:100%;padding:10px;border:1px solid #91a7b0;border-radius:4px;font:inherit}.summary,small{color:#536770}.table-scroll{overflow:auto}table{width:100%;table-layout:fixed;border-collapse:collapse;text-align:left;font-size:14px}th{font-weight:600;background:#e9eef0}th:nth-child(1){width:22%}th:nth-child(2){width:30%}th:nth-child(3){width:24%}th:nth-child(4){width:12%}th:nth-child(5){width:12%}th,td{padding:14px 12px;border-bottom:1px solid #d8e1e4;vertical-align:top;overflow-wrap:anywhere}small{display:block;margin-top:5px}td span{color:#0d655b}td .inactive{color:#805331}.pagination{display:flex;justify-content:flex-end;align-items:center;gap:16px;margin:20px 0;font-size:14px}.detail{border-top:2px solid #b9cecb;padding-top:24px;margin-top:28px}dt{color:#536770;font-size:13px;margin-top:14px}dd{margin:5px 0;overflow-wrap:anywhere}[role=alert]{color:#a72a3e}@media(max-width:600px){.heading{align-items:flex-start}th,td{padding:10px 8px}table{min-width:720px}.pagination{justify-content:space-between;gap:6px}.pagination button{padding:8px}.pagination span{font-size:12px}}`]
})(CatalogPortal);
export async function mount(host, context) {
  if (!(host instanceof HTMLElement) || typeof context?.request !== 'function') throw Error('Invalid portal context');
  const application = await createApplication({ providers: [provideZonelessChangeDetection()] });
  let component;
  try {
    component = createComponent(CatalogPortal, { hostElement: host, environmentInjector: application.injector });
    application.attachView(component.hostView); component.instance.initialize(context.request); component.changeDetectorRef.detectChanges();
  } catch (error) { application.destroy(); host.replaceChildren(); throw error; }
  return () => { component.instance.model.dispose(); application.destroy(); host.replaceChildren(); };
}
