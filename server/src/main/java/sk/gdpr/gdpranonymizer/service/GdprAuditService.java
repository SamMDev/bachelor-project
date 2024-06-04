package sk.gdpr.gdpranonymizer.service;

import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.gdpr.gdpranonymizer.model.entity.*;
import sk.gdpr.gdpranonymizer.repository.GdprAuditRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GdprAuditService {

    private static final String CREATE_GDPR_DATA_MESSAGE_TEMPLATE = "Vytvorený typ osobného údaju %s, hodnota po anonymizácii %s, nachádza sa v: %s";
    private static final String UPDATE_GDPR_DATA_MESSAGE_TEMPLATE = "Upravený typ osobného údaju %s, hodnota po anonymizácii %s, nachádza sa v: %s";
    private static final String DELETE_GDPR_DATA_MESSAGE_TEMPLATE = "Odstránený typ osobného údaju %s";

    private static final String CREATE_GDPR_DATA_SOURCES_ROOT_TEMPLATE = "Vytvorený nový zdroj osobných údajov: %s, zdrojová tabuľka %s";
    private static final String UPDATE_GDPR_DATA_SOURCES_ROOT_TEMPLATE = "Upravený zdroj osobných údajov: %s, zdrojová tabuľka %s";
    private static final String DELETE_GDPR_DATA_SOURCES_ROOT_TEMPLATE = "Odstránený zdroj osobných údajov: %s, zdrojová tabuľka %s";
    private static final String CREATE_GDPR_DATA_SOURCES_NODE_TEMPLATE = "Vytvorený nový uzol osobných údajov: %s, zdrojová tabuľka %s";
    private static final String UPDATE_GDPR_DATA_SOURCES_NODE_TEMPLATE = "Upravený uzol osobných údajov: %s, zdrojová tabuľka %s";
    private static final String DELETE_GDPR_DATA_SOURCES_NODE_TEMPLATE = "Odstránený uzol osobných údajov: %s, zdrojová tabuľka %s";

    private static final String ANONYMIZE_DATASOURCE_PARENT_TEMPLATE = "Anonymizovaná osoba, zdroj %s, zdrojová tabuľka %s";
    private static final String ANONYMIZE_DATASOURCE_CHILD_TEMPLATE = "Anonymizovanie osoby, proces: %s";

    private static final String ANONYMIZE_ALL_PARENT_TEMPLATE = "Plošná anonymizácia spustená pre osobný údaj %s";
    private static final String ANONYMIZE_ALL_CHILD_TEMPLATE = "Anonymizovaný osobný údaj, proces: %s, počet ovplyvnených záznamov: %d";

    private final GdprAuditRepository gdprAuditRepository;


    @Transactional(readOnly = true)
    public List<GdprAudit> listAudits() {
        return this.gdprAuditRepository.findAllParentAuditsFetchChildren();
    }

    @Transactional
    public GdprAudit auditDeleteGdprData(@NotNull GdprData data) {
        GdprAudit audit = new GdprAudit();

        audit.setCreated(LocalDateTime.now());
        audit.setMessage(String.format(DELETE_GDPR_DATA_MESSAGE_TEMPLATE, data.getName()));

        return this.gdprAuditRepository.save(audit);
    }


    @Transactional
    public GdprAudit auditSaveGdprData(@NotNull GdprData data, boolean isNew) {
        GdprAudit audit = new GdprAudit();

        audit.setCreated(LocalDateTime.now());
        audit.setMessage(String.format(
                isNew ? CREATE_GDPR_DATA_MESSAGE_TEMPLATE : UPDATE_GDPR_DATA_MESSAGE_TEMPLATE,
                data.getName(),
                data.getDefaultValue(),
                data.getColumns()
                        .stream()
                        .map(GdprAuditService::formatColumn)
                        .collect(Collectors.joining(","))
                )
        );

        return this.gdprAuditRepository.save(audit);
    }

    @Transactional
    public GdprAudit auditSaveNode(@NotNull GdprTableNode node, boolean isNew) {
        GdprAudit audit = new GdprAudit();

        audit.setCreated(LocalDateTime.now());

        String auditTemplate;
        final boolean isRoot = node.getParentNode() == null;
        if (isRoot) {
            auditTemplate = isNew ? CREATE_GDPR_DATA_SOURCES_ROOT_TEMPLATE : UPDATE_GDPR_DATA_SOURCES_ROOT_TEMPLATE;
        } else {
            auditTemplate = isNew ? CREATE_GDPR_DATA_SOURCES_NODE_TEMPLATE : UPDATE_GDPR_DATA_SOURCES_NODE_TEMPLATE;
        }

        audit.setMessage(String.format(auditTemplate, node.getLabel(), formatTable(node.getGdprTable())));

        return this.gdprAuditRepository.save(audit);
    }

    @Transactional
    public GdprAudit auditDeleteNode(@NotNull GdprTableNode node) {
        final boolean isRoot = node.getParentNode() == null;
        final LocalDateTime now = LocalDateTime.now();

        GdprAudit parentAudit = new GdprAudit();
        parentAudit.setCreated(now);
        parentAudit.setMessage(String.format(
                isRoot ? DELETE_GDPR_DATA_SOURCES_ROOT_TEMPLATE : DELETE_GDPR_DATA_SOURCES_NODE_TEMPLATE,
                node.getLabel(),
                formatTable(node.getGdprTable())
        ));
        this.gdprAuditRepository.save(parentAudit);

        Deque<GdprTableNode> stack = new ArrayDeque<>(node.getChildNodes());
        while (!stack.isEmpty()) {
            GdprTableNode n = stack.pop();

            // audit
            GdprAudit audit = new GdprAudit();
            audit.setCreated(now);
            audit.setMessage(String.format(DELETE_GDPR_DATA_SOURCES_NODE_TEMPLATE, n.getLabel(), formatTable(n.getGdprTable())));
            audit.setParentAudit(parentAudit);
            this.gdprAuditRepository.save(audit);
            parentAudit.getChildAudits().add(audit);

            stack.addAll(n.getChildNodes());
        }

        return parentAudit;
    }

    @Transactional
    public GdprAudit auditAnonymizeAllGdprData(@NotNull GdprData gdprData, @NotNull Map<String, Integer> queryToAffectedRows) {
        final LocalDateTime now = LocalDateTime.now();

        GdprAudit parentAudit = new GdprAudit();
        parentAudit.setCreated(now);
        parentAudit.setMessage(String.format(ANONYMIZE_ALL_PARENT_TEMPLATE, gdprData.getName()));
        this.gdprAuditRepository.save(parentAudit);

        queryToAffectedRows.forEach((query, affectedRows) -> {

            GdprAudit audit = new GdprAudit();
            audit.setCreated(now);
            audit.setMessage(String.format(ANONYMIZE_ALL_CHILD_TEMPLATE, query, affectedRows));
            audit.setParentAudit(parentAudit);
            this.gdprAuditRepository.save(audit);
            parentAudit.getChildAudits().add(audit);

        });

        return parentAudit;
    }

    @Transactional
    public GdprAudit auditAnonymizeDatasourceParent(@NotNull GdprTableNode rootSource) {

        GdprAudit parentAudit = new GdprAudit();
        parentAudit.setCreated(LocalDateTime.now());
        parentAudit.setMessage(String.format(ANONYMIZE_DATASOURCE_PARENT_TEMPLATE, rootSource.getLabel(), formatTable(rootSource.getGdprTable())));

        return this.gdprAuditRepository.save(parentAudit);
    }

    @Transactional
    public GdprAudit auditAnonymizeDatasourceChild(@NotNull String query, @NotNull GdprAudit parent) {
        GdprAudit childAudit = new GdprAudit();
        childAudit.setCreated(LocalDateTime.now());
        childAudit.setMessage(String.format(ANONYMIZE_DATASOURCE_CHILD_TEMPLATE, query));
        childAudit.setParentAudit(parent);

        this.gdprAuditRepository.save(childAudit);
        parent.getChildAudits().add(childAudit);

        return childAudit;
    }


    @Transactional
    @Scheduled(cron = "@daily")
    public void removeOldAudit() {
        final LocalDateTime monthBefore = LocalDateTime.now().minusMonths(1);
        this.gdprAuditRepository.deleteAllByCreatedBefore(monthBefore);
    }


    private static String formatColumn(@NotNull GdprColumn c) {
        return String.format("%s.%s.%s", c.getGdprTable().getSchemaName(), c.getGdprTable().getTableName(), c.getColumnName());
    }

    private static String formatTable(@NotNull GdprTable t) {
        return String.format("%s.%s", t.getSchemaName(), t.getTableName());
    }


}
