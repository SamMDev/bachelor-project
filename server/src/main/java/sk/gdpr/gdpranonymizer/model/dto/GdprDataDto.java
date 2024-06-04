package sk.gdpr.gdpranonymizer.model.dto;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class GdprDataDto {

    private Long id;
    @NotNull
    @Size(max = 128)
    private String name;
    @Size(max = 255)
    private String defaultValue;
    private LocalDateTime created;
    private List<GdprColumnViewDto> columns = new ArrayList<>();

}
