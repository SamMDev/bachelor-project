package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprData;

import java.util.Collection;
import java.util.List;

@Repository
public interface GdprDataRepository extends JpaRepository<GdprData, Long> {

    @Query("select distinct g from GdprData g left join fetch g.columns")
    List<GdprData> listFetchCols();

    @Query("""
    SELECT DISTINCT c.gdprData FROM GdprTable t
    JOIN t.gdprColumns c
    WHERE t.schemaName = :schemaName AND t.tableName = :tableName""")
    List<GdprData> findAllForTable(String tableName, String schemaName);

    @Query("SELECT DISTINCT d FROM GdprData d LEFT JOIN FETCH d.columns c LEFT JOIN FETCH c.gdprTable WHERE d.id IN (:ids)")
    List<GdprData> findAllByIdsFetchColumns(@Param("ids") Collection<Long> ids);

}
