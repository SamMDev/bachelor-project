package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.model.enums.Operator;

import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class GdprTableNodeDto {

    private Long id;
    @Size(max = 255)
    private String label;
    @NotNull
    @Size(max = 255)
    private String identificationColumnName;

    // parent info
    private Long parentNodeId;
    private GdprTableNodeDto parentNode;
    @Size(max = 3)
    private Operator conditionsOperator;
    private List<GdprJoinConditionDto> joinConditions = new ArrayList<>();

    // table
    @NotNull
    @Size(max = 128)
    private String tableName;
    @NotNull
    @Size(max = 128)
    private String schemaName;

    private List<GdprTableNodeDto> childNodes = new ArrayList<>();
}
