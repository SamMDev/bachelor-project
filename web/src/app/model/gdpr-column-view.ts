import {ColumnType} from './column-type';

export interface GdprColumnView {
  id: number;
  tableName: string;
  tableSchema: string;
  columnName: string;
  tableId: number;
  dataType: ColumnType;
}
