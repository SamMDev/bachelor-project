package sk.gdpr.gdpranonymizer.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "gdpr_table_node", schema = "gdpr")
@Getter
@Setter
public class GdprTableNode extends AbstractEntity {

    @Size(max = 255)
    @Column(name = "label")
    private String label;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gdpr_table_id", referencedColumnName = "id")
    private GdprTable gdprTable;

    @NotNull
    @Size(max = 255)
    @Column(name = "identification_column_name")
    private String identificationColumnName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_node_id")
    private GdprTableNode parentNode;

    @OneToMany(
            fetch = FetchType.LAZY,
            mappedBy = "parentNode",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<GdprTableNode> childNodes = new HashSet<>();

    @Size(max = 3)
    @Column(name = "conditions_operator")
    private String conditionsOperator;  // AND/OR

    @OneToMany(
            fetch = FetchType.LAZY,
            mappedBy = "node",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<GdprJoinCondition> joinConditions = new HashSet<>();

}
