package sk.gdpr.gdpranonymizer.service;

import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.gdpr.gdpranonymizer.model.dto.AnonymizeDataRequest;
import sk.gdpr.gdpranonymizer.model.dto.GdprDataSearchCriteria;
import sk.gdpr.gdpranonymizer.model.dto.GdprSearchTreeNode;
import sk.gdpr.gdpranonymizer.model.dto.GdprSearchTreeRequest;
import sk.gdpr.gdpranonymizer.model.entity.*;
import sk.gdpr.gdpranonymizer.query_builder.AbstractQueryBuilderService;
import sk.gdpr.gdpranonymizer.repository.GdprDataRepository;
import sk.gdpr.gdpranonymizer.repository.GdprTableNodeRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GdprAnonymizationService {

    private final GdprRelationsService gdprRelationsService;
    private final GdprAuditService gdprAuditService;
    private final GdprTableNodeRepository gdprTableNodeRepository;
    private final AbstractQueryBuilderService queryBuilderService;
    private final GdprDataRepository gdprDataRepository;

    /**
     * Searches data according to request and returns result as tree
     * @param searchTreeRequest request
     * @return                  tree result
     */
    @Transactional(readOnly = true)
    public GdprSearchTreeNode searchData(@NotNull GdprSearchTreeRequest searchTreeRequest) {
        // must have search criteria
        if (searchTreeRequest.getDataTypes() == null || searchTreeRequest.getDataTypes().isEmpty() || searchTreeRequest.getDataTypes().stream().allMatch(s -> s.getValue() == null)) {
            throw new IllegalArgumentException();
        }

        // find root source
        GdprTableNode rootSource = this.gdprTableNodeRepository.findById(searchTreeRequest.getDataSourceId()).orElseThrow();
        GdprSearchTreeNode result = new GdprSearchTreeNode();
        result.setUuid(UUID.randomUUID().toString());
        result.setIsDataNode(false);
        result.setNode(this.gdprRelationsService.toSimpleDto(rootSource));

        // fetch entities of root
        Map<String, Object> where = this.generateWhereConditionsMap(searchTreeRequest.getDataTypes(), rootSource);
        Query physicalEntityQuery = this.queryBuilderService.select(rootSource.getGdprTable().getSchemaName(), rootSource.getGdprTable().getTableName(), where);
        for (var physicalEntityObj : physicalEntityQuery.getResultList()) {

            Tuple physicalEntity = (Tuple) physicalEntityObj;
            Object physicalEntityId = physicalEntity.get(rootSource.getIdentificationColumnName());

            GdprSearchTreeNode physicalEntityNode = new GdprSearchTreeNode();
            physicalEntityNode.setUuid(UUID.randomUUID().toString());
            physicalEntityNode.setParentUuid(result.getUuid());
            physicalEntityNode.setParent(result);

            physicalEntityNode.setIsDataNode(true);
            physicalEntityNode.setDataId(physicalEntityId);
            physicalEntityNode.setData(this.toMapFromTuple(physicalEntity));

            for (var subSourceNode : rootSource.getChildNodes()) {
                GdprSearchTreeNode physicalEntitySearchTree = this.constructSubtree(physicalEntityId, subSourceNode);

                physicalEntitySearchTree.setParentUuid(physicalEntityNode.getUuid());
                physicalEntitySearchTree.setParent(physicalEntityNode);

                physicalEntityNode.getChildren().add(physicalEntitySearchTree);
            }

            result.getChildren().add(physicalEntityNode);
        }

        return result;
    }

    private GdprSearchTreeNode constructSubtree(@NotNull Object parentRecordId, @NotNull GdprTableNode currentTable) {
        GdprSearchTreeNode res = new GdprSearchTreeNode();
        res.setUuid(UUID.randomUUID().toString());
        res.setIsDataNode(false);
        res.setNode(this.gdprRelationsService.toSimpleDto(currentTable));

        Query query = this.queryBuilderService.selectOneLevelDeep(parentRecordId, currentTable);
        for (var recordObj : query.getResultList()) {
            Tuple recordTuple = (Tuple) recordObj;
            Object recordId = recordTuple.get(currentTable.getIdentificationColumnName());

            GdprSearchTreeNode dataNode = new GdprSearchTreeNode();
            dataNode.setIsDataNode(true);
            dataNode.setParent(res);
            dataNode.setParentUuid(res.getUuid());
            dataNode.setDataId(recordId);
            dataNode.setData(this.toMapFromTuple(recordTuple));

            for (var subSourceNode : currentTable.getChildNodes()) {
                GdprSearchTreeNode subSourceTree = this.constructSubtree(recordId, subSourceNode);

                subSourceTree.setParentUuid(dataNode.getParentUuid());
                subSourceTree.setParent(dataNode);

                dataNode.getChildren().add(subSourceTree);
            }

            res.getChildren().add(dataNode);
        }

        return res;
    }

    @Transactional
    @SuppressWarnings("all")
    public void anonymizeData(@NotNull AnonymizeDataRequest anonymizeDataRequest) {
        // finds root we will scan
        GdprTableNode rootSource = this.gdprTableNodeRepository.findById(anonymizeDataRequest.getSearchTreeCriteria().getDataSourceId()).orElseThrow();
        GdprSearchTreeNode dtoRootSource = anonymizeDataRequest.getChosenData();

        // parent audit of anonymization
        GdprAudit parentAudit = this.gdprAuditService.auditAnonymizeDatasourceParent(rootSource);
        // cache gdpr data for table
        Map<GdprTable, List<GdprData>> gdprDataForTableCache = new HashMap<>();

        Map<String, Object> where = this.generateWhereConditionsMap(anonymizeDataRequest.getSearchTreeCriteria().getDataTypes(), rootSource);
        Query query = this.queryBuilderService.select(rootSource.getGdprTable().getSchemaName(), rootSource.getGdprTable().getTableName(), where);
        for (var recordObj : query.getResultList()) {
            // each found record from root
            Tuple recordTuple = (Tuple) recordObj;
            Object recordId = recordTuple.get(rootSource.getIdentificationColumnName());

            if (dtoRootSource.getChildren().stream().anyMatch(c -> Objects.equals(String.valueOf(recordId), String.valueOf(c.getDataId())))) {
                // if this record is also in dto, anonymize subtree
                this.anonymizeSubtree(dtoRootSource, rootSource, recordId, parentAudit, gdprDataForTableCache);
            }
        }
    }

    @Transactional
    @SuppressWarnings("all")
    public void anonymizeSubtree(
            @NotNull GdprSearchTreeNode dtoNode,
            @NotNull GdprTableNode entityNode,
            @NotNull Object recordId,
            @NotNull GdprAudit parentAudit,
            @NotNull Map<GdprTable, List<GdprData>> gdprDataForTableCache
    ) {
        if (!this.isAnySelectedNodeInTree(dtoNode)) {
            return;
        }

        // checks if given record id has its equivalent in dto
        GdprSearchTreeNode dtoRecord = dtoNode.getChildren().stream().filter(c -> Objects.equals(String.valueOf(recordId), String.valueOf(c.getDataId()))).findFirst().orElse(null);
        if (!this.isAnySelectedNodeInTree(dtoRecord)) {
            return;
        }

        for (GdprTableNode subtreeNode : entityNode.getChildNodes()) {
            GdprSearchTreeNode subtreeNodeDto = dtoRecord.getChildren().stream().filter(c -> subtreeNode.getId().equals(c.getNode().getId())).findFirst().orElse(null);
            if (!this.isAnySelectedNodeInTree(subtreeNodeDto)) {
                continue;
            }

            Query select = this.queryBuilderService.selectOneLevelDeep(recordId, subtreeNode);
            for (var recordObj : select.getResultList()) {
                Tuple recordTuple = (Tuple) recordObj;
                Object id = recordTuple.get(subtreeNode.getIdentificationColumnName());

                this.anonymizeSubtree(subtreeNodeDto, subtreeNode, id, parentAudit, gdprDataForTableCache);
            }
        }

        // not selected dto node, do not anonymize
        if (!Boolean.TRUE.equals(dtoRecord.getIsSelected())) {
            return;
        }

        // find gdpr data in this table (check cache, if not, fetch and add to cache
        List<GdprData> gdprData = gdprDataForTableCache.computeIfAbsent(
                entityNode.getGdprTable(),
                table -> this.gdprDataRepository.findAllForTable(table.getTableName(), table.getSchemaName())
        );
        Map<String, Object> setValues = new HashMap<>();
        for (GdprData data : gdprData) {
            data.getColumns()
                    .stream()
                    .filter(c -> c.getGdprTable().getTableName().equals(entityNode.getGdprTable().getTableName()))
                    .filter(c -> c.getGdprTable().getSchemaName().equals(entityNode.getGdprTable().getSchemaName()))
                    .forEach(c -> setValues.put(c.getColumnName(), data.getDefaultValue()));
        }
        if (setValues.isEmpty()) {
            return;
        }

        Query anonymizeQuery = this.queryBuilderService.anonymizeQuery(recordId, entityNode, setValues);
        int affectedRows = anonymizeQuery.executeUpdate();
        if (affectedRows != 1) {
            // should affect exactly one anonymized row because of id
            throw new IllegalStateException();
        }
        // audit
        String anonimizeQueryPreview = this.queryBuilderService.anonymizeQueryPreview(recordId, entityNode, setValues);
        this.gdprAuditService.auditAnonymizeDatasourceChild(anonimizeQueryPreview, parentAudit);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("all")
    public List<String> generateAnonymizationQueryPreview(@NotNull AnonymizeDataRequest anonymizeDataRequest) {
        List<String> updateQueries = new ArrayList<>();

        GdprTableNode rootSource = this.gdprTableNodeRepository.findById(anonymizeDataRequest.getSearchTreeCriteria().getDataSourceId()).orElseThrow();
        GdprSearchTreeNode dtoRootSource = anonymizeDataRequest.getChosenData();

        // cache gdpr data for table
        Map<GdprTable, List<GdprData>> gdprDataForTableCache = new HashMap<>();

        Map<String, Object> where = this.generateWhereConditionsMap(anonymizeDataRequest.getSearchTreeCriteria().getDataTypes(), rootSource);
        Query query = this.queryBuilderService.select(rootSource.getGdprTable().getSchemaName(), rootSource.getGdprTable().getTableName(), where);
        for (var recordObj : query.getResultList()) {
            // each found record from root
            Tuple recordTuple = (Tuple) recordObj;
            Object recordId = recordTuple.get(rootSource.getIdentificationColumnName());

            if (dtoRootSource.getChildren().stream().anyMatch(c -> Objects.equals(String.valueOf(recordId), String.valueOf(c.getDataId())))) {
                // if this record is also in dto, anonymize subtree
                this.generateAnonymizationQueryPreview(dtoRootSource, rootSource, recordId, updateQueries, gdprDataForTableCache);
            }
        }

        return updateQueries;
    }

    @SuppressWarnings("all")
    @Transactional(readOnly = true)
    public void generateAnonymizationQueryPreview(
            @NotNull GdprSearchTreeNode dtoNode,
            @NotNull GdprTableNode entityNode,
            @NotNull Object recordId,
            @NotNull List<String> previewQueries,
            @NotNull Map<GdprTable, List<GdprData>> gdprDataForTableCache
    ) {
        if (!this.isAnySelectedNodeInTree(dtoNode)) {
            return;
        }

        // checks if given record id has its equivalent in dto
        GdprSearchTreeNode dtoRecord = dtoNode.getChildren().stream().filter(c -> Objects.equals(String.valueOf(recordId), String.valueOf(c.getDataId()))).findFirst().orElse(null);
        if (!this.isAnySelectedNodeInTree(dtoRecord)) {
            return;
        }

        for (GdprTableNode subtreeNode : entityNode.getChildNodes()) {
            GdprSearchTreeNode subtreeNodeDto = dtoRecord.getChildren().stream().filter(c -> subtreeNode.getId().equals(c.getNode().getId())).findFirst().orElse(null);
            if (!this.isAnySelectedNodeInTree(subtreeNodeDto)) {
                continue;
            }

            Query select = this.queryBuilderService.selectOneLevelDeep(recordId, subtreeNode);
            for (var recordObj : select.getResultList()) {
                Tuple recordTuple = (Tuple) recordObj;
                Object id = recordTuple.get(subtreeNode.getIdentificationColumnName());

                this.generateAnonymizationQueryPreview(subtreeNodeDto, subtreeNode, id, previewQueries, gdprDataForTableCache);
            }
        }

        // not selected dto node, do not anonymize
        if (!Boolean.TRUE.equals(dtoRecord.getIsSelected())) {
            return;
        }

        // find gdpr data in this table (check cache, if not, fetch and add to cache
        List<GdprData> gdprData = gdprDataForTableCache.computeIfAbsent(
                entityNode.getGdprTable(),
                table -> this.gdprDataRepository.findAllForTable(table.getTableName(), table.getSchemaName())
        );
        Map<String, Object> setValues = new HashMap<>();
        for (GdprData data : gdprData) {
            data.getColumns()
                    .stream()
                    .filter(c -> c.getGdprTable().getTableName().equals(entityNode.getGdprTable().getTableName()))
                    .filter(c -> c.getGdprTable().getSchemaName().equals(entityNode.getGdprTable().getSchemaName()))
                    .forEach(c -> setValues.put(c.getColumnName(), data.getDefaultValue()));
        }
        if (setValues.isEmpty()) {
            return;
        }

        String updateQueryPreview = this.queryBuilderService.anonymizeQueryPreview(recordId, entityNode, setValues);
        previewQueries.add(updateQueryPreview);
    }

    @Transactional
    public void anonymizeAll(@NotNull @NotEmpty Set<Long> gdprDataIds) {

        for (GdprData gdprData : this.gdprDataRepository.findAllByIdsFetchColumns(gdprDataIds)) {
            Map<String, Integer> queryToAffectedRows = new HashMap<>();

            for (GdprColumn gdprColumn : gdprData.getColumns()) {
                Query updateQuery = this.queryBuilderService.anonymizeAllQuery(gdprColumn, gdprData.getDefaultValue());
                String queryPreview = this.queryBuilderService.anonymizeAllQueryPreview(gdprColumn, gdprData.getDefaultValue());
                int affectedRows = updateQuery.executeUpdate();

                queryToAffectedRows.put(queryPreview, affectedRows);
            }

            this.gdprAuditService.auditAnonymizeAllGdprData(gdprData, queryToAffectedRows);
        }
    }

    @Transactional(readOnly = true)
    public Map<Long, Set<String>> anonymizeAllPreview(@NotNull @NotEmpty Set<Long> gdprDataIds) {

        Map<Long, Set<String>> queries = new HashMap<>();

        for (GdprData gdprData : this.gdprDataRepository.findAllByIdsFetchColumns(gdprDataIds)) {

            Set<String> queriesForGdprData = new HashSet<>();
            for (GdprColumn gdprColumn : gdprData.getColumns()) {
                String updateQuery = this.queryBuilderService.anonymizeAllQueryPreview(gdprColumn, gdprData.getDefaultValue());
                queriesForGdprData.add(updateQuery);
            }
            queries.put(gdprData.getId(), queriesForGdprData);

        }

        return queries;
    }

    private Map<String, Object> toMapFromTuple(@NotNull Tuple tuple) {
        Map<String, Object> res = new HashMap<>();

        for (var tupleElm : tuple.getElements()) {
            String alias = tupleElm.getAlias();
            Object value = tuple.get(tupleElm);

            res.put(alias, value);
        }

        return res;
    }

    private Map<String, Object> generateWhereConditionsMap(@NotNull List<GdprDataSearchCriteria> statements, @NotNull GdprTableNode rootSource) {
        Map<String, Object> res = new HashMap<>();

        for (var criteria : statements) {
            if (criteria.getValue() == null || criteria.getValue().toString().isEmpty()) {
                continue;
            }

            GdprData gdprData = this.gdprDataRepository.findById(criteria.getId()).orElseThrow();
            GdprColumn column = gdprData.getColumns()
                    .stream()
                    .filter(c -> c.getGdprTable().getTableName().equals(rootSource.getGdprTable().getTableName()) && c.getGdprTable().getSchemaName().equals(rootSource.getGdprTable().getSchemaName()))
                    .findFirst()
                    .orElseThrow();

            res.put(column.getColumnName(), criteria.getValue());
        }

        return res;
    }

    public void normalizeTreeForJson(GdprSearchTreeNode tree) {
        if (tree == null) {
            return;
        }

        Deque<GdprSearchTreeNode> stack = new ArrayDeque<>();
        stack.push(tree);
        while (!stack.isEmpty()) {
            GdprSearchTreeNode node = stack.pop();
            // must not have cyclic dependencies
            node.setParent(null);

            for (var child : node.getChildren()) {
                stack.push(child);
            }
        }
    }

    private boolean isAnySelectedNodeInTree(GdprSearchTreeNode root) {
        if (root == null) {
            return false;
        }

        Deque<GdprSearchTreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            GdprSearchTreeNode node = stack.pop();
            if (Boolean.TRUE.equals(node.getIsSelected()) && Boolean.TRUE.equals(node.getIsDataNode())) {
                return true;
            }

            for (var child : node.getChildren()) {
                stack.push(child);
            }
        }

        return false;
    }

}
