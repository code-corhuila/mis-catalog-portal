import '@angular/compiler';
import { Component, ChangeDetectionStrategy, ViewEncapsulation, createComponent, signal, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { catalogModel } from './model.js';
import { medicationCreator, medicationFields, emptyMedication } from './create-model.js';
import { medicationEditor } from './maintenance-model.js';
import styles from './styles.js';
class CatalogPortal {
  state = signal({ loading: true, page: 1, data: [], meta: { total: 0, totalPages: 0 }, error: '', query: '', detail: null });
  model;
  canCreate = false; creator; fields = medicationFields; draft = emptyMedication();
  creation = signal({ open: false, busy: false, locked: false, result: null, error: '' });
  editor; maintenance = signal({ open: false, busy: false, locked: false, record: null, result: null, error: '' });
  initialize(context) {
    this.model = catalogModel(context.request, state => this.state.set(state)); this.model.load();
    this.canCreate = context.canCreate === true;
    if (this.canCreate) {
      this.creator = medicationCreator(context.request, context.registration, state => this.creation.set(state), () => { this.model.filter(''); return this.model.load(1); });
      this.creation.set(this.creator.snapshot());
      if (context.registration.pending) this.draft = JSON.parse(context.registration.pending.body);
      this.editor = medicationEditor(context.request, context.maintenance, state => this.maintenance.set(state), () => this.model.load());
      this.maintenance.set(this.editor.snapshot());
    }
  }
  beginCreation() { if (this.creator.begin()) this.draft = emptyMedication(); }
  submitCreation(event) { event.preventDefault(); this.creator.create(this.draft); }
  submitEdit(event) { event.preventDefault(); this.editor.save(); }
  ngOnDestroy() { this.model?.dispose(); this.creator?.dispose(); this.editor?.dispose(); }
}
Component({ selector: 'mis-catalog', standalone: true, encapsulation: ViewEncapsulation.ShadowDom, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="catalog-title" [attr.aria-busy]="state().loading">
      <div class="heading"><div><p class="eyebrow">MEDICAMENTOS</p><h1 id="catalog-title">Cat&#225;logo</h1></div><div class="actions"><button (click)="model.load()" [disabled]="state().loading">Actualizar</button>@if (canCreate) { <button (click)="beginCreation()" [disabled]="creation().open || maintenance().open">Nuevo medicamento</button> }</div></div>
      @if (canCreate && creation().open) {
        <section class="creation" aria-labelledby="creation-title" [attr.aria-busy]="creation().busy">
          <h2 id="creation-title">Nuevo medicamento</h2>
          @if (creation().error) { <p role="alert">{{ creation().error }}</p> }
          @if (creation().result; as result) {
            <p class="success" role="status">Medicamento registrado.</p><p>{{ result.code }} · {{ result.name }}</p><p class="record-id">ID: {{ result.id }}</p>
            <button (click)="creator.reset()">Finalizar registro</button>
          } @else {
            <form class="creation-form" (submit)="submitCreation($event)">
              @for (field of fields; track field.key) {
                <div><label [attr.for]="'new-med-' + field.key">{{ field.label }}</label><input [id]="'new-med-' + field.key" [name]="field.key" required [attr.maxlength]="field.max" [value]="draft[field.key]" (input)="draft[field.key] = $event.target.value" [disabled]="creation().busy || creation().locked"></div>
              }
              <div class="actions form-actions"><button type="button" (click)="creator.close()" [disabled]="creation().busy || creation().locked">Cancelar registro</button><button type="submit" [disabled]="creation().busy">{{ creation().busy ? 'Registrando...' : creation().locked ? 'Reintentar registro' : 'Registrar medicamento' }}</button></div>
            </form>
          }
        </section>
      }
      @if (canCreate && maintenance().open) {
        <section class="creation" aria-labelledby="maintenance-title" [attr.aria-busy]="maintenance().busy">
          <div class="heading"><h2 id="maintenance-title">Editar medicamento</h2><button (click)="editor.close()" [disabled]="maintenance().busy || maintenance().locked">Cerrar edici&#243;n</button></div>
          @if (maintenance().error) { <p role="alert">{{ maintenance().error }}</p> }
          @if (maintenance().busy) { <p role="status">Procesando...</p> }
          @if (maintenance().result; as result) { <p class="success" role="status">Cambio confirmado.</p><p>{{ result.code }} · {{ result.name }} · {{ result.active ? 'Activo' : 'Inactivo' }}</p> }
          @else if (maintenance().record; as record) {
            <p class="record-id">{{ record.code }} · {{ record.active ? 'Activo' : 'Inactivo' }}</p>
            @if (maintenance().locked) {
              <div class="actions"><button (click)="editor.save()" [disabled]="maintenance().busy || maintenance().conflict">Reintentar mismo cambio</button><button (click)="editor.review()" [disabled]="maintenance().busy">Consultar estado y descartar borrador</button></div>
            } @else if (maintenance().askDeactivate) {
              <p>&#191;Desactivar {{ record.name }}?</p><div class="actions"><button (click)="editor.cancelDeactivate()">Cancelar desactivaci&#243;n</button><button class="danger" (click)="editor.save(true)">Confirmar desactivaci&#243;n</button></div>
            } @else {
              <form class="creation-form" (submit)="submitEdit($event)">
                @for (field of fields; track field.key) { <div><label [attr.for]="'edit-med-' + field.key">{{ field.label }}</label><input [id]="'edit-med-' + field.key" required [attr.maxlength]="field.max" [value]="maintenance().draft[field.key]" (input)="maintenance().draft[field.key] = $event.target.value" [disabled]="maintenance().busy || field.key === 'unitOfMeasure'"></div> }
                <div class="actions form-actions"><button class="danger" type="button" (click)="editor.askDeactivate()" [disabled]="maintenance().busy || !record.active">Desactivar medicamento</button><button type="submit" [disabled]="maintenance().busy">Guardar cambios</button></div>
              </form>
            }
          } @else { <button (click)="editor.close()" [disabled]="maintenance().busy">Volver a la lista</button> }
        </section>
      }
      <label for="catalog-search">Buscar en esta p&#225;gina</label>
      <input id="catalog-search" type="search" maxlength="80" [value]="state().query" (input)="model.filter($event.target.value)" placeholder="C&#243;digo, nombre o principio activo">
      @if (state().loading) { <p role="status">Cargando medicamentos...</p> }
      @else if (state().error) { <div role="alert"><p>{{ state().error }}</p><button (click)="model.load()">Reintentar</button></div> }
      @else {
        <p class="summary">{{ state().meta.total }} medicamentos registrados</p>
        @if (!model.rows().length) { <p role="status">No hay medicamentos para mostrar en esta p&#225;gina.</p> }
        @else { <div class="table-scroll"><table><thead><tr><th scope="col">C&#243;digo</th><th scope="col">Medicamento</th><th scope="col">Presentaci&#243;n</th><th scope="col">Estado</th><th scope="col">Ficha</th></tr></thead><tbody>
          @for (item of model.rows(); track item.id) { <tr><td>{{ item.code }}</td><td><strong>{{ item.name }}</strong><small>{{ item.activeIngredient }}</small></td><td>{{ item.pharmaceuticalForm }}<small>{{ item.concentration }} · {{ item.unitOfMeasure }}</small></td><td><span [class.inactive]="!item.active">{{ item.active ? 'Activo' : 'Inactivo' }}</span></td><td><div class="row-actions"><button (click)="model.detail(item)" [attr.aria-label]="'Ver ficha de ' + item.name">Ver ficha</button>@if (canCreate) { <button (click)="editor.load(item.id)" [disabled]="creation().open || maintenance().busy || maintenance().locked" [attr.aria-label]="'Editar ' + item.code">Editar</button> }</div></td></tr> }
        </tbody></table></div> }
        <nav class="pagination" aria-label="Paginacion de medicamentos"><button (click)="model.load(state().page - 1)" [disabled]="state().page === 1">Anterior</button><span>P&#225;gina {{ state().page }} de {{ state().meta.totalPages || 1 }}</span><button (click)="model.load(state().page + 1)" [disabled]="state().page >= state().meta.totalPages">Siguiente</button></nav>
      }
      @if (state().detail; as item) { <section class="detail" aria-labelledby="detail-title"><div class="heading"><h2 id="detail-title">{{ item.name }}</h2><button (click)="model.close()">Cerrar ficha</button></div><dl><dt>C&#243;digo</dt><dd>{{ item.code }}</dd><dt>Principio activo</dt><dd>{{ item.activeIngredient }}</dd><dt>Forma farmac&#233;utica</dt><dd>{{ item.pharmaceuticalForm }}</dd><dt>Concentraci&#243;n</dt><dd>{{ item.concentration }}</dd><dt>Unidad de medida</dt><dd>{{ item.unitOfMeasure }}</dd></dl></section> }
    </section>`,
  styles: [styles]
})(CatalogPortal);
export async function mount(host, context) {
  if (!(host instanceof HTMLElement) || typeof context?.request !== 'function') throw Error('Invalid portal context');
  const application = await createApplication({ providers: [provideZonelessChangeDetection()] });
  let component;
  try {
    component = createComponent(CatalogPortal, { hostElement: host, environmentInjector: application.injector });
    application.attachView(component.hostView); component.instance.initialize(context); component.changeDetectorRef.detectChanges();
  } catch (error) { application.destroy(); host.replaceChildren(); throw error; }
  return () => { component.instance.model.dispose(); application.destroy(); host.replaceChildren(); };
}
