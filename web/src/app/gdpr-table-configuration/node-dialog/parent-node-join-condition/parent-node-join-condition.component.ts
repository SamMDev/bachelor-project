import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';
import {JoinConditionOperator} from '../../../model/join-condition-operator';
import {Store} from '@ngrx/store';
import * as GdprStore from '../../../store/gdpr-module.reducer';
import * as GdprSelector from '../../../store/gdpr-module.selector';

@Component({
  selector: 'app-parent-node-join-condition',
  templateUrl: './parent-node-join-condition.component.html',
  styleUrl: './parent-node-join-condition.component.scss'
})
export class ParentNodeJoinConditionComponent implements OnInit, OnDestroy {
  @Input() index: number;
  @Input() formGroup: FormGroup;

  @Input() parentSchema: string;
  @Input() parentTable: string;

  @Input() nodeSchema: string;
  @Input() nodeTable: string;
  @Input() deletable: boolean;

  @Output() deleteClicked: EventEmitter<number> = new EventEmitter<number>();

  columnMetadataGrouped: { [schema: string]: { [table: string]: string[] } } = {};

  destroy$ = new Subject();

  readonly operators = Object.values(JoinConditionOperator);

  constructor(
    private store: Store<GdprStore.State>,
  ) {
  }

  ngOnInit(): void {

    this.store.select(GdprSelector.selectColumnsMetadataGrouped).pipe(takeUntil(this.destroy$)).subscribe(metadata => {
      this.columnMetadataGrouped = metadata;
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  get parentNodeColumns(): string[] {
    if (!this.parentSchema || !this.parentTable) {
      return null;
    }

    return this.columnMetadataGrouped[this.parentSchema]?.[this.parentTable];
  }

  get nodeColumns(): string[] {
    if (!this.nodeSchema || !this.nodeTable) {
      return null;
    }

    return this.columnMetadataGrouped[this.nodeSchema]?.[this.nodeTable];
  }

  getOperatorLabel(operator: JoinConditionOperator): string {
    switch (operator) {
      case JoinConditionOperator.EQUALS:
        return 'Rovné s';
      case JoinConditionOperator.GREATER_THAN:
        return 'Väčšie ako';
      case JoinConditionOperator.LESS_THAN:
        return 'Menšie ako'
      case JoinConditionOperator.GREATER_THAN_EQUALS:
        return 'Vačšie rovné ako'
      case JoinConditionOperator.LESS_THAN_EQUALS:
        return 'Menšie rovné ako'
      case JoinConditionOperator.NOT_EQUALS:
        return 'Nerovné s'
      case JoinConditionOperator.STARTS_WITH:
        return 'Začína s'
      case JoinConditionOperator.ENDS_WITH:
        return 'Končí s'
      case JoinConditionOperator.CONTAINS:
        return 'Obsahuje'
      default:
        return ''
    }
  }

}
