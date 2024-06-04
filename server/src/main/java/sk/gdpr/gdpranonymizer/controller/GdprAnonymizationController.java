package sk.gdpr.gdpranonymizer.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sk.gdpr.gdpranonymizer.model.dto.AnonymizeDataRequest;
import sk.gdpr.gdpranonymizer.model.dto.GdprSearchTreeNode;
import sk.gdpr.gdpranonymizer.model.dto.GdprSearchTreeRequest;
import sk.gdpr.gdpranonymizer.service.GdprAnonymizationService;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/gdpr-anonymization-api")
public class GdprAnonymizationController {

    private final GdprAnonymizationService gdprAnonymizationService;

    @PostMapping("/search")
    public ResponseEntity<GdprSearchTreeNode> searchData(@RequestBody GdprSearchTreeRequest request) {
        final var res = this.gdprAnonymizationService.searchData(request);
        this.gdprAnonymizationService.normalizeTreeForJson(res);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/anonymize")
    public ResponseEntity<Void> anonymizeData(@RequestBody AnonymizeDataRequest request) {
        this.gdprAnonymizationService.anonymizeData(request);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/anonymize-preview")
    public ResponseEntity<List<String>> generateAnonymizationQueryPreview(@RequestBody AnonymizeDataRequest request) {
        return ResponseEntity.ok(this.gdprAnonymizationService.generateAnonymizationQueryPreview(request));
    }


    @PostMapping("/anonymize-all")
    public ResponseEntity<Void> anonymizeAll(@RequestBody Set<Long> gdprDataIds) {
        this.gdprAnonymizationService.anonymizeAll(gdprDataIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/anonymize-all-preview")
    public ResponseEntity<Map<Long, Set<String>>> anonymizeAllPreview(@RequestBody Set<Long> gdprDataIds) {
        return ResponseEntity.ok(this.gdprAnonymizationService.anonymizeAllPreview(gdprDataIds));
    }

}
