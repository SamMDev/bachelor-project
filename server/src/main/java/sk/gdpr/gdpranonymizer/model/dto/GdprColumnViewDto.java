package sk.gdpr.gdpranonymizer.model.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;
import sk.gdpr.gdpranonymizer.model.entity.GdprColumnView;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GdprColumnViewDto {
    private Long id;
    private String columnName;
    private Long tableId;
    private String tableSchema;
    private String tableName;
    private ColumnType dataType;
}
