package sk.gdpr.gdpranonymizer.model.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GdprRootNodeGridDto {
    private Long id;
    private String label;
    private String tableName;
    private String schemaName;
}
