import {ColumnType} from './column-type';

export interface ColumnMetadata {

  tableName: string;
  tableSchema: string;
  columnName: string;
  columnType: ColumnType;

}
