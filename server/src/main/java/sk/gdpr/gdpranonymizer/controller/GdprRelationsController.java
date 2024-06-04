package sk.gdpr.gdpranonymizer.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sk.gdpr.gdpranonymizer.model.dto.GdprRootNodeGridDto;
import sk.gdpr.gdpranonymizer.model.dto.GdprTableNodeDto;
import sk.gdpr.gdpranonymizer.model.entity.GdprTableNode;
import sk.gdpr.gdpranonymizer.service.GdprRelationsService;

import java.util.List;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/gdpr-relations-api")
public class GdprRelationsController {
    private final GdprRelationsService gdprRelationsService;

    @GetMapping("/roots")
    public ResponseEntity<List<GdprRootNodeGridDto>> listRootNodes() {
        return ResponseEntity.ok(this.gdprRelationsService.listRootNodes().stream().map(this.gdprRelationsService::toRootNodeGridDto).toList());
    }

    @GetMapping("/{rootNodeId}")
    public ResponseEntity<GdprTableNodeDto> loadRelationsTree(@PathVariable("rootNodeId") Long rootNodeId) {
        return ResponseEntity.ok(this.gdprRelationsService.constructTreeDto(rootNodeId));
    }

    @PutMapping()
    public ResponseEntity<GdprTableNodeDto> createNewTree(@RequestBody @Valid GdprTableNodeDto treeDto) {
        GdprTableNode root = this.gdprRelationsService.createNewTree(treeDto);
        return ResponseEntity.ok(this.gdprRelationsService.constructTreeDto(root));
    }

    @PutMapping("/node")
    public ResponseEntity<GdprTableNodeDto> addNewNode(@RequestBody @Valid GdprTableNodeDto nodeDto) {
        GdprTableNode node = this.gdprRelationsService.addNewNodeToTree(nodeDto);
        return ResponseEntity.ok(this.gdprRelationsService.constructTreeDto(node));
    }

    @PostMapping("/node")
    public ResponseEntity<GdprTableNodeDto> editNode(@RequestBody @Valid GdprTableNodeDto nodeDto) {
        GdprTableNode editedNode = this.gdprRelationsService.editNode(nodeDto);
        return ResponseEntity.ok(this.gdprRelationsService.constructTreeDto(editedNode));
    }

    @DeleteMapping("/node/{id}")
    public ResponseEntity<Object> removeNode(@PathVariable("id") Long nodeId) {
        this.gdprRelationsService.removeNode(nodeId);
        return ResponseEntity.ok().build();
    }

}
