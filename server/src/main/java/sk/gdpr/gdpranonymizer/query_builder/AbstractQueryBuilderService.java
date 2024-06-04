package sk.gdpr.gdpranonymizer.query_builder;


import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;
import sk.gdpr.gdpranonymizer.model.entity.GdprColumn;
import sk.gdpr.gdpranonymizer.model.entity.GdprTable;
import sk.gdpr.gdpranonymizer.model.entity.GdprTableNode;
import sk.gdpr.gdpranonymizer.model.enums.JoinConditionOperator;

import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public abstract class AbstractQueryBuilderService {

    protected final EntityManager entityManager;
    protected final DbMetadataService dbMetadataService;

    /**
     * Generates query for simple select
     * @param schemaName    name of schema
     * @param tableName     table in schema
     * @param where         where conditions. key = columnName, value = compare value
     * @return              select query
     */
    public Query select(@NotNull String schemaName, @NotNull String tableName, @NotNull @NotEmpty Map<String, Object> where) {

        String queryStr = String.format(
                "SELECT * FROM %s.%s WHERE %s",
                schemaName,
                tableName,
                where.keySet().stream().map(col -> this.generateCondition(col, JoinConditionOperator.EQUALS, null, col)).collect(Collectors.joining(" AND "))
        );

        Query query = this.entityManager.createNativeQuery(queryStr, Tuple.class);
        for (var whereEntry : where.entrySet()) {
            query.setParameter(whereEntry.getKey(), whereEntry.getValue());
        }

        return query;
    }


    public Query selectOneLevelDeep(@NotNull Object parentRecordId, @NotNull GdprTableNode currentTable) {

        StringBuilder queryBuilder = new StringBuilder();

        GdprTableNode parentTable = Optional.ofNullable(currentTable.getParentNode()).orElseThrow();
        // alias in case of table or column name conflicts
        String currentTableAlias = currentTable.getGdprTable().getTableName();
        String parentTableAlias = parentTable.getGdprTable().getTableName();
        if (currentTableAlias.equals(parentTableAlias)) {
            // in case of joining two tables with same name, different alias
            currentTableAlias += 0;
            parentTableAlias += 1;
        }

        // current table select
        queryBuilder.append(String.format(
                "SELECT %s.* FROM %s.%s AS %s",
                currentTableAlias,
                currentTable.getGdprTable().getSchemaName(),
                currentTable.getGdprTable().getTableName(),
                currentTableAlias
        ));

        // join parent table
        List<String> onConditions = new ArrayList<>();                                          // join conditions
        List<String> constantParameters = new ArrayList<>();                                    // constant parameter values, keep order
        for (var joinCondition : currentTable.getJoinConditions()) {
            String currentTableColumn = String.format("%s.%s", currentTableAlias, joinCondition.getChildColumn());
            JoinConditionOperator operator = JoinConditionOperator.valueOf(joinCondition.getOperator());

            String onCondition;
            if (joinCondition.getConstant() != null) {
                // comparing with constant
                constantParameters.add(joinCondition.getConstant());    // add to list
                onCondition = this.generateCondition(currentTableColumn, operator, null, "constant" + (constantParameters.size() - 1));   // condition param name will be its index in list
            } else {
                // comparing with parent column
                String parentTableColumn = String.format("%s.%s", parentTableAlias, joinCondition.getParentColumn());
                onCondition = this.generateCondition(currentTableColumn, operator, parentTableColumn, null);
            }
            onConditions.add(onCondition);
        }
        queryBuilder
                .append(String.format(" JOIN %s.%s AS %S ON ", parentTable.getGdprTable().getSchemaName(), parentTable.getGdprTable().getTableName(), parentTableAlias))
                .append(String.join(" " + currentTable.getConditionsOperator() + " ", onConditions));


        // add primary key of parent to the query
        queryBuilder.append(String.format(" WHERE %s.%s = :parentIdent", parentTableAlias, parentTable.getIdentificationColumnName()));

        Query query = this.entityManager.createNativeQuery(queryBuilder.toString(), Tuple.class);
        query.setParameter("parentIdent", parentRecordId);
        for (int i = 0; i < constantParameters.size(); i++) {
            query.setParameter("constant" + i, constantParameters.get(i));
        }

        return query;
    }

    public Query anonymizeQuery(@NotNull Object recordId, @NotNull GdprTableNode table, @NotNull @NotEmpty Map<String, Object> setValues) {

        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append(String.format("UPDATE %s.%s ", table.getGdprTable().getSchemaName(), table.getGdprTable().getTableName()));

        // set params
        queryBuilder.append("SET ");
        List<String> setConditions = new ArrayList<>();
        setValues.keySet().forEach(columnName -> {
            String condition = String.format("%s = :%s", columnName, columnName);
            setConditions.add(condition);
        });
        queryBuilder.append(String.join(",", setConditions));

        // where statement
        queryBuilder.append(String.format(" WHERE %s = :ident", table.getIdentificationColumnName()));

        // build query and set parameters
        Query query = this.entityManager.createNativeQuery(queryBuilder.toString());
        query.setParameter("ident", recordId);
        setValues.forEach(query::setParameter);

        return query;
    }

    public String anonymizeQueryPreview(@NotNull Object recordId, @NotNull GdprTableNode table, @NotNull @NotEmpty Map<String, Object> setValues) {

        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append(String.format("UPDATE %s.%s ", table.getGdprTable().getSchemaName(), table.getGdprTable().getTableName()));

        // set params
        queryBuilder.append("SET ");
        List<String> setConditions = new ArrayList<>();
        setValues.forEach((columnName, value) -> {
            String condition = String.format("%s = %s", columnName, value == null ? null : "'" + value + "'");
            setConditions.add(condition);
        });
        queryBuilder.append(String.join(",", setConditions));

        // where statement
        queryBuilder.append(String.format(" WHERE %s = '%s'", table.getIdentificationColumnName(), recordId));

        return queryBuilder.toString();
    }

    public Query anonymizeAllQuery(@NotNull GdprColumn gdprColumn, Object setValue) {
        final GdprTable table = gdprColumn.getGdprTable();

        String queryString = String.format("UPDATE %s.%s SET %s = :value", table.getSchemaName(), table.getTableName(), gdprColumn.getColumnName());
        Query query = this.entityManager.createNativeQuery(queryString);
        query.setParameter("value", setValue);

        return query;
    }

    public String anonymizeAllQueryPreview(@NotNull GdprColumn gdprColumn, Object setValue) {
        final GdprTable table = gdprColumn.getGdprTable();
        return String.format("UPDATE %s.%s SET %s = %s", table.getSchemaName(), table.getTableName(), gdprColumn.getColumnName(), setValue);
    }

    public abstract String generateCondition(@NotNull String column1Name, @NotNull JoinConditionOperator operator, @Nullable String column2Name, @Nullable String constantParamName);

}
