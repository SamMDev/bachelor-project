package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AnonymizeDataRequest {
    @NotNull
    private GdprSearchTreeRequest searchTreeCriteria;
    @NotNull
    private GdprSearchTreeNode chosenData;
}
