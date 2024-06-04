import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ColDef, GridApi, GridReadyEvent} from 'ag-grid-community';
import {GdprAudit} from '../model/gdpr-audit';
import {Store} from '@ngrx/store';
import * as GdprStore from '../store/gdpr-module.reducer';
import * as GdprAction from '../store/gdpr-module.actions';
import {Subject, takeUntil} from 'rxjs';
import * as GdprSelector from '../store/gdpr-module.selector';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-gdpr-audit',
  templateUrl: './gdpr-audit.component.html',
  styleUrl: './gdpr-audit.component.scss'
})
export class GdprAuditComponent implements OnInit, OnDestroy {

  private static readonly SK_DATE_FORMATER = Intl.DateTimeFormat('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  api: GridApi;
  detailGridApi: GridApi;
  rowData: GdprAudit[];
  detail: GdprAudit;

  formGroup: FormGroup;

  destroy$ = new Subject();

  readonly defaultColDef: ColDef = {
    filter: true,
    sortable: true,
  }

  readonly mainGridColDefs: ColDef[] = [
    {
      headerName: 'Správa',
      field: "message",
      autoHeight: true,
      wrapText: true,
    },
    {
      headerName: 'Čas',
      field: "created",
      minWidth: 50,
      maxWidth: 300,
      sort: 'desc',
      valueFormatter: params => {
        return GdprAuditComponent.SK_DATE_FORMATER.format(new Date(params.value));
      }
    },
  ];

  readonly detailGridColDefs: ColDef[] = [
    {
      headerName: 'Správa',
      field: "message",
      autoHeight: true,
      wrapText: true,
    },
  ];

  constructor(
    private store: Store<GdprStore.State>,
    private fb: FormBuilder,
  ) {
    this.createFormGroup();
  }

  ngOnInit(): void {
    this.store.select(GdprSelector.selectAuditDetail).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.detail = data;
      this.formGroup.reset();
      if (this.detail) {
        this.formGroup.patchValue(this.detail);
      }
    });
  }

  onRowSelected(row: any) {
    if (row.node.selected) {
      this.store.dispatch(GdprAction.selectedAuditDetail({detail: row.data}));
    }
  }

  closeClicked() {
    this.api.deselectAll();
    this.store.dispatch(GdprAction.closedAuditDetail());
  }

  detailGridReady(event: GridReadyEvent) {
    this.detailGridApi = event.api;
    this.detailGridApi?.sizeColumnsToFit();
  }

  gridReady(event: GridReadyEvent) {
    this.api = event.api;
    this.api.sizeColumnsToFit();
    this.api.showLoadingOverlay();

    this.store.dispatch(GdprAction.listAudit());
    this.store.select(GdprSelector.selectAudit).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.rowData = JSON.parse(JSON.stringify(data ?? null));
    })
  }


  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();

    this.store.dispatch(GdprAction.onExitDetailPage());
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.api?.sizeColumnsToFit();
    this.detailGridApi?.sizeColumnsToFit();
  }

  private createFormGroup() {
    this.formGroup = this.fb.group({
      id: [null],
      message: [null],
      created: [null],
    });
    this.formGroup.disable();
  }

}
