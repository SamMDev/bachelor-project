package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprAudit;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GdprAuditRepository extends JpaRepository<GdprAudit, Long> {

    @Query("SELECT DISTINCT a FROM GdprAudit a LEFT JOIN FETCH a.childAudits WHERE a.parentAudit IS NULL")
    List<GdprAudit> findAllParentAuditsFetchChildren();

    void deleteAllByCreatedBefore(LocalDateTime date);

}
