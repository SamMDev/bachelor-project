package sk.gdpr.gdpranonymizer.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "gdpr_column", schema = "gdpr")
@Getter
@Setter
public class GdprColumn extends AbstractEntity {

    @NotNull
    @Size(max = 128)
    @Column(name = "column_name", nullable = false, length = 128)
    private String columnName;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gdpr_table_id", referencedColumnName = "id")
    private GdprTable gdprTable;

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "columns")
    private Set<GdprData> gdprData = new HashSet<>();

}
