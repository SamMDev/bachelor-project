package sk.gdpr.gdpranonymizer.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter @Setter
public class GdprSearchTreeNode {

    private String uuid;    // to track nodes, unique
    private String parentUuid;
    private GdprSearchTreeNode parent;

    @NotNull
    private Boolean isDataNode;
    // if is data node, contains this information
    @NotNull
    private Boolean isSelected = false;
    private Object dataId;
    private Map<String, Object> data = new HashMap<>();

    // if not data node (only folder), contains this information
    private GdprTableNodeDto node;


    private List<GdprSearchTreeNode> children = new ArrayList<>();
}
