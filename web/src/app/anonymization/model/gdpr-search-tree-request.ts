import {ColumnType} from '../../model/column-type';

export interface GdprSearchTreeRequest {
  dataSourceId: number;                 // ID of root node in configuration
  dataTypes: GdprDataSearchCriteria[];  // search criteria
}


export interface GdprDataSearchCriteria {
  id: number;
  name: string;
  columnType: ColumnType;
  value: any;
}
