package sk.gdpr.gdpranonymizer.model.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "gdpr_data", schema = "gdpr")
@Getter @Setter
public class GdprData extends AbstractEntity {

    @NotNull
    @Size(max = 128)
    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @NotNull
    @Column(name = "created", nullable = false)
    private LocalDateTime created;

    @Size(max = 255)
    @Column(name = "default_value")
    private String defaultValue;

    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinTable(
            name = "gdpr_data_location",
            schema = "gdpr",
            joinColumns = @JoinColumn(name = "gdpr_data_id"),
            inverseJoinColumns = @JoinColumn(name = "gdpr_column_id")
    )
    private Set<GdprColumn> columns = new HashSet<>();
}
