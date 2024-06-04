package sk.gdpr.gdpranonymizer.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "gdpr_join_condition", schema = "gdpr")
@Getter @Setter
public class GdprJoinCondition extends AbstractEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private GdprTableNode node;

    @NotNull
    @Size(max = 255)
    @Column(name = "child_column")
    private String childColumn;

    @Size(max = 255)
    @Column(name = "parent_column")
    private String parentColumn;

    @NotNull
    @Size(max = 10)
    @Column(name = "operator", length = 10)
    private String operator;

    @Size(max = 255)
    @Column(name = "constant")
    private String constant;
}
