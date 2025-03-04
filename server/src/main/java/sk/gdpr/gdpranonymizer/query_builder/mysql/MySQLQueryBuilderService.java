package sk.gdpr.gdpranonymizer.query_builder.mysql;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;
import sk.gdpr.gdpranonymizer.model.enums.JoinConditionOperator;
import sk.gdpr.gdpranonymizer.query_builder.AbstractQueryBuilderService;


@Service
@ConditionalOnExpression("'${spring.datasource.driver-class-name}'.equals('com.mysql.cj.jdbc.Driver') || '${spring.datasource.driver}'.equals('com.mysql.cj.jdbc.Driver')")
public class MySQLQueryBuilderService extends AbstractQueryBuilderService {

    @Autowired
    public MySQLQueryBuilderService(EntityManager entityManager, DbMetadataService dbMetadataService) {
        super(entityManager, dbMetadataService);
    }

    @Override
    public String generateCondition(String column1Name, JoinConditionOperator operator, String column2Name, String constantParamName) {
        if (column2Name == null && constantParamName == null && operator != JoinConditionOperator.EMPTY && operator != JoinConditionOperator.NOT_EMPTY) {
            throw new IllegalArgumentException();
        }

        return switch (operator) {
            case EQUALS -> column2Name != null ? String.format("%s = %s", column1Name, column2Name) : String.format("%s = :%s", column1Name, constantParamName);
            case GT -> column2Name != null ? String.format("%s > %s", column1Name, column2Name) : String.format("%s > :%s", column1Name, constantParamName);
            case LT -> column2Name != null ? String.format("%s < %s", column1Name, column2Name) : String.format("%s < :%s", column1Name, constantParamName);
            case GT_EQUALS -> column2Name != null ? String.format("%s >= %s", column1Name, column2Name) : String.format("%s >= :%s", column1Name, constantParamName);
            case LT_EQUALS -> column2Name != null ? String.format("%s <= %s", column1Name, column2Name) : String.format("%s <= :%s", column1Name, constantParamName);
            case NOT_EQUALS -> column2Name != null ? String.format("%s <> %s", column1Name, column2Name) : String.format("%s <> :%s", column1Name, constantParamName);
            case STARTS_W -> column2Name != null ? String.format("%s LIKE concat(%s, '%%')", column1Name, column2Name) : String.format("%s LIKE concat(:%s, '%%')", column1Name, constantParamName);
            case ENDS_W -> column2Name != null ? String.format("%s LIKE concat('%%', %s)", column1Name, column2Name) : String.format("%s LIKE concat('%%', :%s)", column1Name, constantParamName);
            case CONTAINS -> column2Name != null ? String.format("%s LIKE concat('%%', %s, '%%')", column1Name, column2Name) : String.format("%s LIKE concat('%%', :%s, '%%')", column1Name, constantParamName);
            case EMPTY -> String.format("(%s is null or %s = '')", column1Name, column1Name);
            case NOT_EMPTY -> String.format("%s is not null and %s <> ''", column1Name, column1Name);
        };
    }
}
