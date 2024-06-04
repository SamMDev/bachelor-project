package sk.gdpr.gdpranonymizer.service;


import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;
import sk.gdpr.gdpranonymizer.model.dto.GdprJoinConditionDto;
import sk.gdpr.gdpranonymizer.model.dto.GdprRootNodeGridDto;
import sk.gdpr.gdpranonymizer.model.dto.GdprTableNodeDto;
import sk.gdpr.gdpranonymizer.model.entity.GdprJoinCondition;
import sk.gdpr.gdpranonymizer.model.entity.GdprTable;
import sk.gdpr.gdpranonymizer.model.entity.GdprTableNode;
import sk.gdpr.gdpranonymizer.model.enums.Operator;
import sk.gdpr.gdpranonymizer.repository.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GdprRelationsService {

    private final GdprTableNodeRepository gdprTableNodeRepository;
    private final GdprTableRepository gdprTableRepository;
    private final GdprJoinConditionRepository gdprJoinConditionRepository;

    private final DbMetadataService dbMetadataService;
    private final GdprAuditService gdprAuditService;

    @Transactional(readOnly = true)
    public List<GdprTableNode> listRootNodes() {
        return this.gdprTableNodeRepository.listRootNodes();
    }

    @Transactional(readOnly = true)
    public GdprTableNodeDto constructTreeDto(@NotNull Long rootNodeId) {
        final GdprTableNode root = this.gdprTableNodeRepository.findById(rootNodeId).orElseThrow();
        return this.constructTreeDto(root);
    }

    @Transactional(readOnly = true)
    public GdprTableNodeDto constructTreeDto(@NotNull GdprTableNode node) {

        final GdprTableNodeDto nodeDto = this.toSimpleDto(node);

        // has parent?
        if (node.getParentNode() != null) {
            var parentNode = node.getParentNode();
            nodeDto.setParentNodeId(parentNode.getId());
            nodeDto.setJoinConditions(node.getJoinConditions().stream().map(GdprJoinConditionDto::new).toList());
        }

        // child nodes
        for (var childNode : node.getChildNodes()) {
            nodeDto.getChildNodes().add(this.constructTreeDto(childNode));
        }

        return nodeDto;
    }

    @Transactional
    public GdprTableNode createNewTree(@NotNull GdprTableNodeDto dto) {
        GdprTableNode root = this.addNewNode(null, dto);
        this.gdprAuditService.auditSaveNode(root, true);
        return root;
    }

    @Transactional
    public GdprTableNode addNewNodeToTree(@NotNull GdprTableNodeDto newNodeDto) {
        if (newNodeDto.getParentNode() == null || newNodeDto.getParentNode().getId() == null) {
            throw new IllegalArgumentException("To add node to tree, node must have specified parent node");
        }

        GdprTableNode parentNode = this.gdprTableNodeRepository.findById(newNodeDto.getParentNode().getId()).orElseThrow();
        GdprTableNode childNode = this.addNewNode(parentNode, newNodeDto);

        this.gdprAuditService.auditSaveNode(childNode, true);

        return childNode;
    }

    @Transactional
    public GdprTableNode editNode(@NotNull GdprTableNodeDto dto) {
        GdprTableNode entity = this.gdprTableNodeRepository.findById(dto.getId()).orElseThrow();

        entity.setLabel(dto.getLabel());
        entity.setConditionsOperator(null);
        if (this.dbMetadataService.existsColumn(dto.getIdentificationColumnName(), dto.getTableName(), dto.getSchemaName())) {
            entity.setIdentificationColumnName(dto.getIdentificationColumnName());
        } else {
            throw new IllegalArgumentException(String.format("Could not set identification column name: no such column exist: %s.%s.%s", dto.getSchemaName(), dto.getTableName(), dto.getIdentificationColumnName()));
        }

        if (entity.getChildNodes().isEmpty()) {
            // can change table if no child nodes yet
            entity.setGdprTable(this.findOrCreateTable(dto.getTableName(), dto.getSchemaName()));
        }

        // update joins if node is not root
        if (entity.getParentNode() != null) {
            entity.setConditionsOperator(dto.getConditionsOperator().name());
            // delete joins (not in dto anymore)
            entity.getJoinConditions().removeIf(c -> dto.getJoinConditions().stream().noneMatch(d -> c.getId().equals(d.getId())));
            // update joins
            dto.getJoinConditions()
                    .stream()
                    .filter(j -> j.getId() != null && j.getId() > 0)
                    .forEach(joinToUpdate -> {
                        GdprJoinCondition existing = entity.getJoinConditions().stream().filter(e -> e.getId().equals(joinToUpdate.getId())).findFirst().orElseThrow();
                        this.updateJoinCondition(existing, joinToUpdate);
                    });
            // create joins
            dto.getJoinConditions()
                    .stream()
                    .filter(j -> j.getId() == null || j.getId().equals(0L))
                    .forEach(newJoinDto -> {
                        GdprJoinCondition newJoin = this.createJoinCondition(entity, newJoinDto);
                        entity.getJoinConditions().add(newJoin);
                    });
            if (entity.getJoinConditions().isEmpty()) {
                throw new IllegalArgumentException("When creating child node for parent, join conditions must not be empty");
            }
        }

        this.gdprAuditService.auditSaveNode(entity, false);

        return entity;
    }

    @Transactional
    public void removeNode(@NotNull Long id) {
        this.removeNode(this.gdprTableNodeRepository.findById(id).orElseThrow());
    }

    @Transactional
    public void removeNode(@NotNull GdprTableNode node) {
        // delete node itself
        this.gdprAuditService.auditDeleteNode(node);
        this.gdprTableNodeRepository.delete(node);
    }

    /**
     * Adds new node to tree
     * @param parentNode    parent, if null, creating root
     * @param childNodeDto  dto node to be created
     * @return              created node
     */
    @Transactional
    public GdprTableNode addNewNode(@Nullable GdprTableNode parentNode, @NotNull GdprTableNodeDto childNodeDto) {

        GdprTableNode childNode = new GdprTableNode();
        childNode.setLabel(childNodeDto.getLabel());
        childNode.setConditionsOperator(null);
        // identification column name
        if (this.dbMetadataService.existsColumn(childNodeDto.getIdentificationColumnName(), childNodeDto.getTableName(), childNodeDto.getSchemaName())) {
            childNode.setIdentificationColumnName(childNodeDto.getIdentificationColumnName());
        } else {
            throw new IllegalArgumentException(String.format("Could not set identification column name: no such column exist: %s.%s.%s", childNodeDto.getSchemaName(), childNodeDto.getTableName(), childNodeDto.getIdentificationColumnName()));
        }

        // table
        childNode.setGdprTable(this.findOrCreateTable(childNodeDto.getTableName(), childNodeDto.getSchemaName()));

        // save
        this.gdprTableNodeRepository.save(childNode);

        // join with parent
        if (parentNode != null) {
            childNode.setConditionsOperator(childNodeDto.getConditionsOperator().name());
            childNode.setParentNode(parentNode);

            if (childNodeDto.getConditionsOperator() == null || childNodeDto.getJoinConditions() == null || childNodeDto.getJoinConditions().isEmpty()) {
                throw new IllegalArgumentException("When creating child node for parent, join conditions must not be empty");
            }
            for (var joinConditionDto : childNodeDto.getJoinConditions()) {
                GdprJoinCondition joinCondition = this.createJoinCondition(childNode, joinConditionDto);
                childNode.getJoinConditions().add(joinCondition);
            }
        }

        // child has another children, add
        for (var anotherChildDto : childNodeDto.getChildNodes()) {
            this.addNewNode(childNode, anotherChildDto);
        }

        return childNode;
    }

    @Transactional
    public GdprTable findOrCreateTable(@NotNull String tableName, @NotNull String schemaName) {
        return this.gdprTableRepository.findByTableNameAndSchemaName(tableName, schemaName).orElseGet(() -> {
            // create if not already created
            if (!this.dbMetadataService.existsTable(tableName, schemaName)) {
                throw new IllegalArgumentException(String.format("Can not create node, table %s in schema %s does not exists", tableName, schemaName));
            }

            GdprTable table = new GdprTable();
            table.setTableName(tableName);
            table.setSchemaName(schemaName);
            return this.gdprTableRepository.save(table);
        });
    }

    @Transactional
    public GdprJoinCondition createJoinCondition(@NotNull GdprTableNode node, @NotNull GdprJoinConditionDto joinConditionDto) {
        if ((joinConditionDto.getParentColumn() == null) == (joinConditionDto.getConstant() == null)) {
            throw new IllegalArgumentException("Could not create join condition, must have parent column or constant, not both or both null");
        }

        GdprJoinCondition joinCondition = new GdprJoinCondition();
        joinCondition.setNode(node);
        joinCondition.setOperator(joinConditionDto.getOperator().name());

        if (this.dbMetadataService.existsColumn(joinConditionDto.getChildColumn(), node.getGdprTable().getTableName(), node.getGdprTable().getSchemaName())) {
            joinCondition.setChildColumn(joinConditionDto.getChildColumn());
        } else {
            throw new IllegalArgumentException(String.format("Could not create join condition, no column %s in table %s schema %s", joinConditionDto.getChildColumn(), node.getGdprTable().getTableName(), node.getGdprTable().getSchemaName()));
        }

        if (joinConditionDto.getParentColumn() != null) {
            GdprTableNode parent = node.getParentNode();
            if (this.dbMetadataService.existsColumn(joinConditionDto.getParentColumn(), parent.getGdprTable().getTableName(), parent.getGdprTable().getSchemaName())) {
                joinCondition.setParentColumn(joinConditionDto.getParentColumn());
            } else {
                throw new IllegalArgumentException(String.format("Could not create join condition, no column %s in table %s schema %s", joinConditionDto.getParentColumn(), parent.getGdprTable().getTableName(), parent.getGdprTable().getSchemaName()));
            }
        } else {
            joinCondition.setConstant(joinConditionDto.getConstant());
        }


        return this.gdprJoinConditionRepository.save(joinCondition);
    }

    @Transactional
    public void updateJoinCondition(@NotNull GdprJoinCondition entity, @NotNull GdprJoinConditionDto dto) {
        if ((dto.getParentColumn() == null) == (dto.getConstant() == null)) {
            throw new IllegalArgumentException("Could not update join condition, must have parent column or constant, not both or both null");
        }

        GdprTableNode child = entity.getNode();
        if (this.dbMetadataService.existsColumn(dto.getChildColumn(), child.getGdprTable().getTableName(), child.getGdprTable().getSchemaName())) {
            entity.setChildColumn(dto.getChildColumn());
        } else {
            throw new IllegalArgumentException(String.format("Could not update join condition, no column %s in table %s schema %s", dto.getChildColumn(), child.getGdprTable().getTableName(), child.getGdprTable().getSchemaName()));
        }

        if (dto.getParentColumn() != null) {
            GdprTableNode parent = entity.getNode().getParentNode();
            if (this.dbMetadataService.existsColumn(dto.getParentColumn(), parent.getGdprTable().getTableName(), parent.getGdprTable().getSchemaName())) {
                entity.setParentColumn(dto.getParentColumn());
                entity.setConstant(null);
            } else {
                throw new IllegalArgumentException(String.format("Could not update join condition, no column %s in table %s schema %s", dto.getParentColumn(), parent.getGdprTable().getTableName(), parent.getGdprTable().getSchemaName()));
            }
        } else {
            entity.setConstant(dto.getConstant());
            entity.setParentColumn(null);
        }

        entity.setOperator(dto.getOperator().name());
    }


    public GdprRootNodeGridDto toRootNodeGridDto(@NotNull GdprTableNode rootNode) {
        return new GdprRootNodeGridDto(rootNode.getId(), rootNode.getLabel(), rootNode.getGdprTable().getTableName(), rootNode.getGdprTable().getSchemaName());
    }

    public GdprTableNodeDto toSimpleDto(GdprTableNode node) {
        GdprTableNodeDto dto = new GdprTableNodeDto();

        dto.setId(node.getId());
        dto.setLabel(node.getLabel());
        dto.setIdentificationColumnName(node.getIdentificationColumnName());
        dto.setConditionsOperator(node.getConditionsOperator() == null ? null : Operator.valueOf(node.getConditionsOperator()));

        // table
        dto.setTableName(node.getGdprTable().getTableName());
        dto.setSchemaName(node.getGdprTable().getSchemaName());

        return dto;
    }

}
