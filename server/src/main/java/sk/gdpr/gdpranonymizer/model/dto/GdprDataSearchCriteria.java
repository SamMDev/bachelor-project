package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import sk.gdpr.gdpranonymizer.db_metadata.model.ColumnType;

@Getter @Setter
public class GdprDataSearchCriteria {
    @NotNull
    private Long id;
    private String name;
    private ColumnType columnType;
    private Object value;
}
