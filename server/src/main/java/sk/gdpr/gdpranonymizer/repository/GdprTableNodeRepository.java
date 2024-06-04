package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprTableNode;

import java.util.List;

@Repository
public interface GdprTableNodeRepository extends JpaRepository<GdprTableNode, Long> {

    @Query(value = """
        SELECT DISTINCT n FROM GdprTableNode n
        JOIN FETCH n.gdprTable
        WHERE n.parentNode IS NULL"""
    )
    List<GdprTableNode> listRootNodes();

}
