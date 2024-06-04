import {GdprData} from './model/gdpr-data';

export const findGdprDataOfTable = (allGdprData: GdprData[], schemaName: string, tableName: string) => {
  return allGdprData.filter(d => d.columns.some(c => c.tableName === tableName && c.tableSchema == schemaName));
}
