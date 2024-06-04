import {Operator} from './operator';
import {GdprJoinCondition} from './gdpr-join-condition';
import {GdprData} from './gdpr-data';

export interface GdprTableNode {
  id: number;
  label: string;
  identificationColumnName: string;

  // parent info
  parentNodeId: number;
  parentNode: GdprTableNode;
  conditionsOperator: Operator;
  joinConditions: GdprJoinCondition[];

  // table
  tableName: string;
  schemaName: string;

  childNodes: GdprTableNode[];
}
