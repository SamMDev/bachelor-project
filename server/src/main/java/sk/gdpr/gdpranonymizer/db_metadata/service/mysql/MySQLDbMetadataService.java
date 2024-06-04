package sk.gdpr.gdpranonymizer.db_metadata.service.mysql;


import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;
import sk.gdpr.gdpranonymizer.db_metadata.model.mysql.MySQLColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;

import java.util.List;

@Service
@RequiredArgsConstructor
@ConditionalOnExpression("'${spring.datasource.driver-class-name}'.equals('com.mysql.cj.jdbc.Driver') || '${spring.datasource.driver}'.equals('com.mysql.cj.jdbc.Driver')")
public class MySQLDbMetadataService implements DbMetadataService {

    private final EntityManager entityManager;


    @Override
    @SuppressWarnings({"all"})
    public List<ColumnMetadata> listColumns() {
        return this.entityManager.createNativeQuery("SELECT TABLE_NAME, TABLE_SCHEMA, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS")
                .getResultList()
                .stream()
                .map(res -> {
                    final Object[] arr = (Object[]) res;
                    return new MySQLColumnMetadata(arr[0].toString(), arr[1].toString(), arr[2].toString(), this.toColumnType(arr[3].toString()));
                })
                .toList();
    }

    @Override
    public List<ColumnMetadata> listColumnsForTable(@NotNull String schemaName, @NotNull String tableName) {
        return this.entityManager.createNativeQuery("SELECT TABLE_NAME, TABLE_SCHEMA, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName AND TABLE_SCHEMA = :tableSchema")
                .setParameter("tableName", tableName)
                .setParameter("tableSchema", schemaName)
                .getResultList()
                .stream()
                .map(res -> {
                    final Object[] arr = (Object[]) res;
                    return new MySQLColumnMetadata(arr[0].toString(), arr[1].toString(), arr[2].toString(), this.toColumnType(arr[3].toString()));
                })
                .toList();    }


    @Override
    @SuppressWarnings({"all"})
    public boolean existsColumn(String columnName, String tableName, String schemaName) {
        if (columnName == null || tableName == null || schemaName == null) {
            return false;
        }

        Query query = this.entityManager.createNativeQuery("""
            SELECT EXISTS (
                SELECT 1
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = :tableName AND TABLE_SCHEMA = :schemaName AND COLUMN_NAME = :columnName
            )"""
        );

        query.setParameter("tableName", tableName);
        query.setParameter("schemaName", schemaName);
        query.setParameter("columnName", columnName);

        return ((Number) query.getSingleResult()).intValue() == 1;
    }

    @Override
    public boolean existsTable(String tableName, String schemaName) {
        if (tableName == null || schemaName == null) {
            return false;
        }

        Query query = this.entityManager.createNativeQuery("""
            SELECT EXISTS (
                SELECT 1
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = :schemaName AND TABLE_NAME = :tableName
            )"""
        );

        query.setParameter("tableName", tableName);
        query.setParameter("schemaName", schemaName);

        return ((Number) query.getSingleResult()).intValue() == 1;
    }

    @Override
    public ColumnType toColumnType(String dbDataType) {
        if (dbDataType == null) {
            return null;
        }

        return switch (dbDataType) {
            case "date", "datetime", "timestamp" -> ColumnType.DATE;
            case "char", "text", "varchar", "binary", "varbinary" -> ColumnType.TEXT;
            case "integer", "smallint", "decimal", "numeric", "float", "real", "double", "int", "dex", "fixed" -> ColumnType.NUMBER;
            case "bit" -> ColumnType.BOOLEAN;
            default -> null;
        };
    }

}
