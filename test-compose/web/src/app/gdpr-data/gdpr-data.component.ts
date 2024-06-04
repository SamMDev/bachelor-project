import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import * as GdprStore from '../store/gdpr-module.reducer';
import * as GdprAction from '../store/gdpr-module.actions';
import * as GdprSelector from '../store/gdpr-module.selector';
import {ColDef, GridApi, GridReadyEvent, ValueFormatterParams} from 'ag-grid-community';
import {Observable, Subject, takeUntil} from 'rxjs';
import {ColumnMetadata} from '../model/column-metadata';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {GdprData} from '../model/gdpr-data';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {GdprColumnView} from '../model/gdpr-column-view';

@Component({
  selector: 'app-gdpr-data',
  templateUrl: './gdpr-data.component.html',
  styleUrl: './gdpr-data.component.scss'
})
export class GdprDataComponent implements OnInit, OnDestroy {

  api: GridApi;
  editMode: boolean;
  destroy$ = new Subject();
  columns: ColumnMetadata[];
  rowData: GdprData[] = [];
  loading$: Observable<boolean>;

  detail: GdprData;

  formGroup: FormGroup;



  readonly colDefs: ColDef[] = [
    {
      headerName: 'Názov',
      field: "name",
    },
    {
      headerName: 'Hodnota stĺpca po anonymizácii',
      field: "defaultValue",
    },
    {
      headerName: 'Miesta výskytu',
      field: "columns",
      valueFormatter: (params: ValueFormatterParams<GdprData, GdprColumnView[]>) => {
        const locations = params.value;
        return locations
          .map(l => `${l.tableSchema}.${l.tableName}.${l.columnName}`)
          .join(', ');
      }
    },
  ];

  readonly defaultColDef: ColDef = {
    filter: true,
  }

  constructor(
    private store: Store<GdprStore.State>,
    private fb: FormBuilder,
    public dialog: MatDialog,
  ) {

    this.createFormGroup();
  }

  ngOnInit(): void {

    this.loading$ = this.store.select(GdprSelector.selectLoading).pipe(takeUntil(this.destroy$));

    this.store.select(GdprSelector.selectColumnsMetadata).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.columns = JSON.parse(JSON.stringify(data ?? null));
    });

    this.store.select(GdprSelector.selectGdprDataDetail).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.detail = JSON.parse(JSON.stringify(data ?? null));
      if (this.detail) {
        this.formGroup.reset();
        this.formGroup.patchValue(this.detail);
      }
    });

    this.store.select(GdprSelector.selectEditMode).pipe(takeUntil(this.destroy$)).subscribe(editMode => {
      this.editMode = editMode;
      if (editMode) {
        this.formGroup.enable();
      } else {
        this.formGroup.disable();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();

    this.store.dispatch(GdprAction.onExitDetailPage());
  }

  gridReady(event: GridReadyEvent) {
    this.api = event.api;

    this.api.sizeColumnsToFit();

    this.api.showLoadingOverlay();
    this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.rowData = JSON.parse(JSON.stringify(data ?? null));
    });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.api?.sizeColumnsToFit();
  }

  onRowSelected(event: any) {
    if (event.node.selected) {
      const data: GdprData = event.data;
      this.store.dispatch(GdprAction.selectedGdprData({data: data}));
    }
  }

  searchColumnMetadata = (term: string, item: ColumnMetadata) => {
    term = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const label: string = this.getColumnMetadataLabel(item);
    const searchExpr: string = this.getColumnMetadataSearchExpression(item);
    return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(term) > -1 ||
            searchExpr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(term) > -1
  }

  trackByFn = (item: ColumnMetadata) => {
    return this.getColumnMetadataSearchExpression(item);
  }

  getColumnMetadataSearchExpression(columnMetadata: ColumnMetadata) {
    return `${columnMetadata.tableSchema}.${columnMetadata.tableName}.${columnMetadata.columnName}`;
  }

  getColumnMetadataLabel(columnMetadata: ColumnMetadata) {
    return `[${columnMetadata.tableSchema}].[${columnMetadata.tableName}].[${columnMetadata.columnName}]`;
  }

  editClicked() {
    this.store.dispatch(GdprAction.editModeEnabled());
  }

  deleteClicked() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        header: 'Odstránenie typu osobného údaju',
        content: 'Si si istý, že chceš odstrániť osobný údaj?',
      },
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.store.dispatch(GdprAction.deleteGdprData({id: this.detail.id}));
      }
    });
  }

  addClicked() {
    this.store.dispatch(GdprAction.addClickedGdprData());
  }

  closeClicked() {
    this.api.deselectAll();
    this.detail = null;
  }

  cancelClicked() {
    if (this.detail.id) {
      // cancel edit existing
      this.store.dispatch(GdprAction.cancelEditMode());
    } else {
      // cancel adding new
      this.store.dispatch(GdprAction.cancelAddClickedGdprData());
    }
  }

  saveClicked() {
    this.formGroup.markAllAsTouched();
    if(this.formGroup.invalid) {
      return;
    }

    const result: GdprData = this.formGroup.getRawValue();
    if (result.id) {
      this.store.dispatch(GdprAction.updateGdprData({data: result}));
    } else {
      this.store.dispatch(GdprAction.createGdprData({data: result}));
    }
  }

  private createFormGroup() {
    this.formGroup = this.fb.group({
      id: [null],
      name: [null, [Validators.required, Validators.maxLength(128)]],
      defaultValue: [null, [Validators.maxLength(255)]],
      columns: [null],
    });
  }

}
