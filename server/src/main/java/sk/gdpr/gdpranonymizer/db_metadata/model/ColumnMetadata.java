package sk.gdpr.gdpranonymizer.db_metadata.model;

public interface ColumnMetadata {

    String getTableName();
    String getTableSchema();
    String getColumnName();
    ColumnType getColumnType();

}
