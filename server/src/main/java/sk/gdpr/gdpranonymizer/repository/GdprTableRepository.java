package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprTable;

import java.util.Optional;

@Repository
public interface GdprTableRepository extends JpaRepository<GdprTable, Long> {
    Optional<GdprTable> findByTableNameAndSchemaName(String tableName, String schemaName);
}
