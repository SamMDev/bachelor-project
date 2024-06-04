import {JoinConditionOperator} from './join-condition-operator';

export interface GdprJoinCondition {
  id: number;
  childColumn: string;
  parentColumn: string;
  operator: JoinConditionOperator;
  constant: string;
  isConstant: boolean;
}
