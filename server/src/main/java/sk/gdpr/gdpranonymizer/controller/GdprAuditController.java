package sk.gdpr.gdpranonymizer.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sk.gdpr.gdpranonymizer.model.dto.GdprAuditDto;
import sk.gdpr.gdpranonymizer.service.GdprAuditService;

import java.util.List;
import java.util.stream.Collectors;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/gdpr-audit-api")
public class GdprAuditController {

    private final GdprAuditService gdprAuditService;

    @GetMapping
    public ResponseEntity<List<GdprAuditDto>> list() {
        return ResponseEntity.ok(
                this.gdprAuditService.listAudits().stream().map(a -> {
                    GdprAuditDto dto = new GdprAuditDto(a);
                    dto.setChildAudits(a.getChildAudits().stream().map(GdprAuditDto::new).collect(Collectors.toSet()));
                    return dto;
                }).toList()
        );
    }

}
