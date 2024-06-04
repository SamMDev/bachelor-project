package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.model.entity.GdprJoinCondition;
import sk.gdpr.gdpranonymizer.model.enums.JoinConditionOperator;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GdprJoinConditionDto {

    private Long id;
    @NotNull
    @Size(max = 255)
    private String childColumn;
    @Size(max = 255)
    private String parentColumn;
    @NotNull
    @Size(max = 10)
    private JoinConditionOperator operator;
    @Size(max = 255)
    private String constant;
    private Boolean isConstant;

    public GdprJoinConditionDto(GdprJoinCondition entity) {
        this.id = entity.getId();
        this.childColumn = entity.getChildColumn();
        this.parentColumn = entity.getParentColumn();
        this.operator = JoinConditionOperator.valueOf(entity.getOperator());
        this.constant = entity.getConstant();
        this.isConstant = entity.getConstant() != null;
    }

}
