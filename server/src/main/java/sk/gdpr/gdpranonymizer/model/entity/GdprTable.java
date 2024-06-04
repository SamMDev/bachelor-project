package sk.gdpr.gdpranonymizer.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "gdpr_table", schema = "gdpr")
@Getter @Setter
public class GdprTable extends AbstractEntity {

    @NotNull
    @Size(max = 128)
    @Column(name = "table_name", nullable = false, length = 128)
    private String tableName;

    @NotNull
    @Size(max = 128)
    @Column(name = "schema_name", nullable = false, length = 128)
    private String schemaName;

    @OneToMany(
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            mappedBy = "gdprTable"
    )
    private Set<GdprColumn> gdprColumns = new HashSet<>();
}
