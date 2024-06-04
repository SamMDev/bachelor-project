package sk.gdpr.gdpranonymizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sk.gdpr.gdpranonymizer.model.entity.GdprColumnView;

import java.util.List;

@Repository
public interface GdprColumnViewRepository extends JpaRepository<GdprColumnView, Long> {
    List<GdprColumnView> findAllByIdIn(List<Long> ids);

}
