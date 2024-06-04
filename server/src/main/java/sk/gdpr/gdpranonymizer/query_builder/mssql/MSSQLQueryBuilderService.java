package sk.gdpr.gdpranonymizer.query_builder.mssql;

import jakarta.persistence.EntityManager;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;
import sk.gdpr.gdpranonymizer.model.enums.JoinConditionOperator;
import sk.gdpr.gdpranonymizer.query_builder.AbstractQueryBuilderService;


@Service
@ConditionalOnExpression("'${spring.datasource.driver-class-name}'.equals('com.microsoft.sqlserver.jdbc.SQLServerDriver') || '${spring.datasource.driver}'.equals('com.microsoft.sqlserver.jdbc.SQLServerDriver')")
public class MSSQLQueryBuilderService extends AbstractQueryBuilderService {

    @Autowired
    public MSSQLQueryBuilderService(EntityManager entityManager, DbMetadataService dbMetadataService) {
        super(entityManager, dbMetadataService);
    }


    @Override
    public String generateCondition(@NotNull String column1Name, @NotNull JoinConditionOperator operator, @Nullable String column2Name, @Nullable String constantParamName) {
        if (column2Name == null && constantParamName == null && operator != JoinConditionOperator.EMPTY && operator != JoinConditionOperator.NOT_EMPTY) {
            throw new IllegalArgumentException();
        }

        return switch (operator) {
            case EQUALS -> column2Name != null ? String.format("%s = %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) = :%s", column1Name, constantParamName);
            case GT -> column2Name != null ? String.format("%s > %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) > :%s", column1Name, constantParamName);
            case LT -> column2Name != null ? String.format("%s < %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) < :%s", column1Name, constantParamName);
            case GT_EQUALS -> column2Name != null ? String.format("%s >= %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) >= :%s", column1Name, constantParamName);
            case LT_EQUALS -> column2Name != null ? String.format("%s <= %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) <= :%s", column1Name, constantParamName);
            case NOT_EQUALS -> column2Name != null ? String.format("%s <> %s", column1Name, column2Name) : String.format("cast(%s as nvarchar) <> :%s", column1Name, constantParamName);
            case STARTS_W -> column2Name != null ? String.format("cast(%s as nvarchar) LIKE (cast(%s as nvarchar) + '%%')", column1Name, column2Name) : String.format("cast(%s as nvarchar) LIKE (:%s + '%%')", column1Name, constantParamName);
            case ENDS_W -> column2Name != null ? String.format("cast(%s as nvarchar) LIKE ('%%' + cast(%s as nvarchar))", column1Name, column2Name) : String.format("cast(%s as nvarchar) LIKE ('%%' + :%s)", column1Name, constantParamName);
            case CONTAINS -> column2Name != null ? String.format("cast(%s as nvarchar) LIKE ('%%' + cast(%s as nvarchar) + '%%')", column1Name, column2Name) : String.format("cast(%s as nvarchar) LIKE ('%%' + :%s + '%%')", column1Name, constantParamName);
            case EMPTY -> String.format("(%s is null or cast(%s as nvarchar) = '')", column1Name, column1Name);
            case NOT_EMPTY -> String.format("%s is not null and cast(%s as nvarchar) <> ''", column1Name, column1Name);
        };
    }

}
