package sk.gdpr.gdpranonymizer.db_metadata.model.mssql;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;

@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class MSSQLColumnMetadata implements ColumnMetadata {

    private String tableName;
    private String tableSchema;
    private String columnName;
    private ColumnType columnType;

}
