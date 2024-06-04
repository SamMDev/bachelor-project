package sk.gdpr.gdpranonymizer.model.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "gdpr_audit", schema = "gdpr")
@Getter
@Setter
public class GdprAudit extends AbstractEntity {

    @Size(max = 1024)
    @Column(name = "message", length = 1024)
    private String message;

    @Column(name = "created")
    private LocalDateTime created;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_audit_id")
    private GdprAudit parentAudit;

    @OneToMany(
            mappedBy = "parentAudit",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<GdprAudit> childAudits = new HashSet<>();
}
