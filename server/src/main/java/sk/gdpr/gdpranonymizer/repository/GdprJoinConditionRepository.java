package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprJoinCondition;

@Repository
public interface GdprJoinConditionRepository extends JpaRepository<GdprJoinCondition, Long> {
}
