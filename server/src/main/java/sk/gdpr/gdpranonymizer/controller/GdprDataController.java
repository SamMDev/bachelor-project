package sk.gdpr.gdpranonymizer.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sk.gdpr.gdpranonymizer.model.dto.GdprDataDto;
import sk.gdpr.gdpranonymizer.model.entity.GdprData;
import sk.gdpr.gdpranonymizer.service.GdprDataService;

import java.util.List;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/gdpr-data-api")
public class GdprDataController {

    private final GdprDataService gdprDataService;

    @GetMapping
    public ResponseEntity<List<GdprDataDto>> list() {
        return ResponseEntity.ok(this.gdprDataService.list().stream().map(r -> this.gdprDataService.toDto(r, true)).toList());
    }

    @PostMapping
    public ResponseEntity<GdprDataDto> createGdprData(@RequestBody @Valid GdprDataDto data) {
        GdprData result = this.gdprDataService.createGdprData(data);
        return ResponseEntity.ok(this.gdprDataService.toDto(result, true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGdprData(@PathVariable("id") Long id) {
        this.gdprDataService.deleteGdprData(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<GdprDataDto> updateGdprData(@RequestBody @Valid GdprDataDto data) {
        GdprData result = this.gdprDataService.updateGdprData(data);
        return ResponseEntity.ok(this.gdprDataService.toDto(result, true));
    }


}
