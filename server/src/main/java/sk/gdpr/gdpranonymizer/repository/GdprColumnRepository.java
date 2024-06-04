package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.model.entity.GdprColumn;

import java.util.Optional;

@Repository
public interface GdprColumnRepository extends JpaRepository<GdprColumn, Long> {

    @Query("SELECT c FROM GdprColumn c WHERE c.gdprTable.schemaName = :schema AND c.gdprTable.tableName = :table AND c.columnName = :column")
    Optional<GdprColumn> findBySchemaAndTableAndColumn(@Param("schema") String schema, @Param("table") String table, @Param("column") String column);
}
