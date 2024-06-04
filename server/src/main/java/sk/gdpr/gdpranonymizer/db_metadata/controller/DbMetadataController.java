package sk.gdpr.gdpranonymizer.db_metadata.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnMetadata;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/db-metadata-api")
public class DbMetadataController {

    private final DbMetadataService dbMetadataService;

    @GetMapping("/columns")
    public ResponseEntity<List<ColumnMetadata>> listColumns() {
        return ResponseEntity.ok(this.dbMetadataService.listColumns());
    }

}
