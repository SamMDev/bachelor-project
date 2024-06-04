import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NodeDialogData} from './model/node-dialog-data';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as GdprSelector from '../../store/gdpr-module.selector';
import {combineLatest, pairwise, Subject, takeUntil} from 'rxjs';
import {Store} from '@ngrx/store';
import * as GdprStore from '../../store/gdpr-module.reducer';
import {NodeDialogType} from './model/node-dialog-type';
import {GdprRootNodeGrid} from '../../model/gdpr-root-node-grid';
import {NotificationService} from '../../notifications/notification-service';
import {NotificationMessage} from '../../notifications/notification-message';
import {Operator} from '../../model/operator';
import {ColumnMetadata} from '../../model/column-metadata';
import {GdprData} from '../../model/gdpr-data';
import {findGdprDataOfTable} from '../../utils';

@Component({
  selector: 'app-node-dialog',
  templateUrl: './node-dialog.component.html',
  styleUrl: './node-dialog.component.scss'
})
export class NodeDialogComponent implements OnInit, OnDestroy {

  formGroup: FormGroup;
  destroy$ = new Subject();

  columnsMetadata: ColumnMetadata[];
  columnMetadataGrouped: { [schema: string]: { [table: string]: string[] } };
  rootNodes: GdprRootNodeGrid[];
  dataTypes: GdprData[];

  schemas: string[];
  tablesForSchema: string[];

  columnsForTable: string[];

  readonly operators = Object.values(Operator);

  constructor(
    public dialogRef: MatDialogRef<NodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NodeDialogData,
    private fb: FormBuilder,
    private store: Store<GdprStore.State>,
    private notificationService: NotificationService,
  ) {
  }

  ngOnInit() {

    combineLatest([
      this.store.select(GdprSelector.selectRootNodesGrid).pipe(takeUntil(this.destroy$)),
      this.store.select(GdprSelector.selectColumnsMetadataGrouped).pipe(takeUntil(this.destroy$)),
      this.store.select(GdprSelector.selectColumnsMetadata).pipe(takeUntil(this.destroy$)),
      this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)),
    ]).subscribe(([gridData, metadataGrouped, metadata, gdprData]) => {
      this.rootNodes = JSON.parse(JSON.stringify(gridData ?? null));

      this.columnsMetadata = metadata;
      this.columnMetadataGrouped = metadataGrouped;
      this.schemas = Object.keys(this.columnMetadataGrouped);
      if (this.data.node?.id) {
        this.dataTypes = findGdprDataOfTable(gdprData, this.data.node.schemaName, this.data.node.tableName);
      }

      if (this.data.node.tableName) {
        this.columnsForTable = this.columnsMetadata.filter(cm => cm.tableSchema == this.data.node.schemaName && cm.tableName == this.data.node.tableName).map(cm => cm.columnName);
      }

      this.createFormGroup();
      this.patchFormGroup();
    })
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onConfirmClick() {
    if (!this.isFormValid()) {
      this.notificationService.warning(NotificationMessage.FORM_INVALID);
      return;
    }

    this.dialogRef.close(this.formGroup.getRawValue());
  }

  getGdprDataLabel(gdprData: GdprData) {
    if (!gdprData) {
      return null;
    }

    const schemaName: string = this.data.node.schemaName;
    const tableName: string = this.data.node.tableName;
    const columnName: string = gdprData.columns?.find(c => c.tableName === tableName && c.tableSchema === schemaName)?.columnName;
    return `${schemaName}.${tableName}.${columnName}`;
  }

  private createFormGroup() {
    this.formGroup = this.fb.group({
      id: [null],
      label: [null, [Validators.required, Validators.maxLength(255)]],
      identificationColumnName: [null, [Validators.required, Validators.maxLength(255)]],

      parentNode: this.fb.group({
        id: [null],
      }),
      conditionsOperator: [null, [Validators.maxLength(3)]],
      joinConditions: this.fb.array([]),

      tableName: [null, [Validators.required, Validators.maxLength(128)]],
      schemaName: [null, [Validators.required, Validators.maxLength(128)]],
    });


    this.formGroup.get('schemaName').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(newSchema => {
      if (!newSchema) {
        this.tablesForSchema = null;
        this.formGroup.get('tableName').reset();
      } else {
        this.tablesForSchema = Object.keys(this.columnMetadataGrouped[newSchema]);

        const tableName = this.formGroup.get('tableName').value;
        if (tableName && !this.tablesForSchema.some(t => t === tableName)) {
          this.formGroup.get('tableName').reset();
        }
      }
    });

    this.formGroup.get('tableName').valueChanges.pipe(takeUntil(this.destroy$), pairwise()).subscribe(([oldTableName, tableName]) => {
      if (oldTableName === tableName) {
        return;
      }

      this.columnsForTable = null;
      this.joinConditionsFormArray.reset();
      this.formGroup.get('identificationColumnName').reset();
      if (!tableName) {
        return;
      }

      const schemaName = this.formGroup.get('schemaName').value;
      // find columns for this table
      this.columnsForTable = this.columnsMetadata.filter(cm => cm.tableSchema == schemaName && cm.tableName == tableName).map(cm => cm.columnName);
      if (!this.formGroup.get('parentNode.id').value && this.rootNodes.some(r => r.schemaName == schemaName && r.tableName == tableName)) {
        // root node with this table already exists
        this.notificationService.failure('Zdroj osobných údajov s rovnakou tabuľkou už existuje');
        this.formGroup.get('tableName').reset();
      }
    });
  }

  get joinConditionsFormArray(): FormArray {
    return this.formGroup.get('joinConditions') as FormArray;
  }

  toFg(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  addJoinCondition() {
    this.joinConditionsFormArray.push(this.createJoinConditionFormGroup());
  }

  joinConditionRemoveClicked(index: number) {
    this.joinConditionsFormArray.removeAt(index);
  }

  isFormValid(): boolean {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return false;
    }

    if (this.data.dialogType == NodeDialogType.ADD_NODE) {
      if (this.joinConditionsFormArray.length == 0) {
        return false;
      }
    } else if (this.data.dialogType == NodeDialogType.EDIT_NODE && this.data.node.parentNode) {
      if (this.joinConditionsFormArray.length == 0) {
        return false;
      }
    }

    return true;
  }


  private patchFormGroup() {

    switch (this.data.dialogType) {
      case NodeDialogType.CREATE_ROOT: {
        this.formGroup.patchValue(this.data.node);
        this.formGroup.enable();
        break;
      }
      case NodeDialogType.ADD_NODE: {
        this.formGroup.get('parentNode.id').addValidators([Validators.required]);
        this.formGroup.get('parentNode.id').updateValueAndValidity();
        this.formGroup.get('conditionsOperator').addValidators([Validators.required, Validators.maxLength(3)]);
        this.formGroup.get('conditionsOperator').updateValueAndValidity();

        // at least one join condition with parent
        this.joinConditionsFormArray.push(this.createJoinConditionFormGroup());

        this.formGroup.patchValue(this.data.node);
        this.formGroup.enable();

        break;
      }
      case NodeDialogType.EDIT_NODE: {
        if (this.data.node.parentNode?.id > 0) {
          this.formGroup.get('parentNode.id').addValidators([Validators.required]);
          this.formGroup.get('parentNode.id').updateValueAndValidity();
          this.formGroup.get('conditionsOperator').addValidators([Validators.required, Validators.maxLength(3)]);
          this.formGroup.get('conditionsOperator').updateValueAndValidity();

          this.data.node.joinConditions?.forEach(joinCondition => {
            const fg = this.createJoinConditionFormGroup();
            fg.patchValue(joinCondition);
            this.joinConditionsFormArray.push(fg);
          });
        }

        this.formGroup.patchValue(this.data.node);
        this.formGroup.enable();

        if (this.data.node.childNodes?.length > 0) {
          this.formGroup.get('tableName').disable();
          this.formGroup.get('schemaName').disable();
        }

        break;
      }
      case NodeDialogType.PREVIEW: {
        if (this.data.node.parentNode?.id > 0) {
          this.formGroup.get('parentNode.id').addValidators([Validators.required]);
          this.formGroup.get('parentNode.id').updateValueAndValidity();
          this.formGroup.get('conditionsOperator').addValidators([Validators.required, Validators.maxLength(3)]);
          this.formGroup.get('conditionsOperator').updateValueAndValidity();

          this.data.node.joinConditions?.forEach(joinCondition => {
            const fg = this.createJoinConditionFormGroup();
            fg.patchValue(joinCondition);
            this.joinConditionsFormArray.push(fg);
          });
        }

        this.formGroup.patchValue(this.data.node);
        this.formGroup.disable();
        break;
      }
    }
  }

  private createJoinConditionFormGroup(): FormGroup {
    const fg = this.fb.group({
      id: [null],
      childColumn: [null, [Validators.required, Validators.maxLength(128)]],
      parentColumn: [null, [Validators.maxLength(128)]],
      operator: [null, [Validators.required, Validators.maxLength(10)]],
      constant: [null, [Validators.maxLength(255)]],
      isConstant: [false],
    });


    fg.get('isConstant').valueChanges.pipe(takeUntil(this.destroy$), pairwise()).subscribe(([previous, next]) => {
      if (previous === next) {
        return;
      }

      if (next) {
        // changed to constant
        fg.get('parentColumn').reset();
        fg.get('parentColumn').clearValidators();
        fg.get('parentColumn').updateValueAndValidity();

        fg.get('constant').clearValidators();
        fg.get('constant').addValidators([Validators.required, Validators.maxLength(255)]);
        fg.get('constant').updateValueAndValidity();
      } else {
        // changed to parent column
        fg.get('constant').reset();
        fg.get('constant').clearValidators();
        fg.get('constant').updateValueAndValidity();

        fg.get('parentColumn').clearValidators();
        fg.get('parentColumn').addValidators([Validators.required, Validators.maxLength(128)]);
        fg.get('parentColumn').updateValueAndValidity();
      }
    })

    return fg;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public readonly NodeDialogType = NodeDialogType;
  protected readonly parent = parent;
}
