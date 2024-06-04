package sk.gdpr.gdpranonymizer.db_metadata.service.postgres;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;
import sk.gdpr.gdpranonymizer.db_metadata.model.postgres.PostgreSQLColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;

import java.util.List;

@Service
@RequiredArgsConstructor
@ConditionalOnExpression("'${spring.datasource.driver-class-name}'.equals('org.postgresql.Driver') || '${spring.datasource.driver}'.equals('org.postgresql.Driver')")
public class PostgreSQLDbMetadataService implements DbMetadataService {

    private final EntityManager entityManager;

    @Override
    @SuppressWarnings({"all"})
    public List<ColumnMetadata> listColumns() {
        return this.entityManager.createNativeQuery("SELECT TABLE_NAME, TABLE_SCHEMA, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS")
                .getResultList()
                .stream()
                .map(res -> {
                    final Object[] arr = (Object[]) res;
                    return new PostgreSQLColumnMetadata(arr[0].toString(), arr[1].toString(), arr[2].toString(), this.toColumnType(arr[3].toString()));
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
                    return new PostgreSQLColumnMetadata(arr[0].toString(), arr[1].toString(), arr[2].toString(), this.toColumnType(arr[3].toString()));
                })
                .toList();
    }

    @Override
    @SuppressWarnings({"all"})
    public boolean existsColumn(String columnName, String tableName, String schemaName) {
        if (columnName == null || tableName == null || schemaName == null) {
            return false;
        }

        Query query = this.entityManager.createNativeQuery("""
            SELECT CASE 
                WHEN EXISTS(
                    SELECT 1 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = :tableName AND TABLE_SCHEMA = :schemaName AND COLUMN_NAME = :columnName
                ) THEN TRUE ELSE FALSE END"""
        );


        query.setParameter("tableName", tableName);
        query.setParameter("schemaName", schemaName);
        query.setParameter("columnName", columnName);

        return (Boolean) query.getSingleResult();
    }

    @Override
    public boolean existsTable(String tableName, String schemaName) {
        if (tableName == null || schemaName == null) {
            return false;
        }

        Query query = this.entityManager.createNativeQuery("""
            SELECT CASE
                WHEN EXISTS(
                    SELECT 1
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = :tableName AND TABLE_SCHEMA = :schemaName
                ) THEN TRUE ELSE FALSE END"""
        );


        query.setParameter("tableName", tableName);
        query.setParameter("schemaName", schemaName);

        return (Boolean) query.getSingleResult();
    }

    @Override
    public ColumnType toColumnType(String dbDataType) {
        if (dbDataType == null) {
            return null;
        }

        return switch (dbDataType) {
            case "date", "timestamp", "timestamptz" -> ColumnType.DATE;
            case "char", "text", "varchar", "bpchar", "citext" -> ColumnType.TEXT;
            case "bigint", "decimal", "int", "integer", "money", "numeric", "real", "smallint", "double precision", "serial", "bigserial", "smallserial" -> ColumnType.NUMBER;
            case "boolean" -> ColumnType.BOOLEAN;
            default -> null;
        };
    }
}
