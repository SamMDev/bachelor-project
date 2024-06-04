package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.model.entity.GdprAudit;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class GdprAuditDto {

    private Long id;
    @Size(max = 1024)
    private String message;
    private LocalDateTime created;
    private Set<GdprAuditDto> childAudits = new HashSet<>();

    public GdprAuditDto(GdprAudit audit) {
        this.id = audit.getId();
        this.message = audit.getMessage();
        this.created = audit.getCreated();
    }

}
