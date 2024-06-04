package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class GdprSearchTreeRequest {
    @NotNull
    private Long dataSourceId;  // node root id
    @NotNull
    private List<GdprDataSearchCriteria> dataTypes; // gdpr data of the root with search value
}
