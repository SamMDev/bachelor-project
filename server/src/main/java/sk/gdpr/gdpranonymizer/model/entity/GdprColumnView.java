package sk.gdpr.gdpranonymizer.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "gdpr_column_view", schema = "gdpr")
@Getter @Setter
public class GdprColumnView extends AbstractEntity {

    @Column(name = "column_name")
    private String columnName;

    @Column(name = "table_id")
    private Long tableId;

    @Column(name = "table_schema")
    private String tableSchema;

    @Column(name = "table_name")
    private String tableName;

    @Column(name = "data_type")
    private String dataType;
}
