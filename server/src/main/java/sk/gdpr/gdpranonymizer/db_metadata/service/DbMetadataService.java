package sk.gdpr.gdpranonymizer.db_metadata.service;

import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;

import java.util.List;

public interface DbMetadataService {

    List<ColumnMetadata> listColumns();
    List<ColumnMetadata> listColumnsForTable(String schemaName, String tableName);
    
    boolean existsColumn(String columnName, String tableName, String schemaName);

    boolean existsTable(String tableName, String schemaName);

    ColumnType toColumnType(String dbDataType);
}
