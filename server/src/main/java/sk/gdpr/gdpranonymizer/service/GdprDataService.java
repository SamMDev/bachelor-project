package sk.gdpr.gdpranonymizer.service;

import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.gdpr.gdpranonymizer.db_metadata.service.DbMetadataService;
import sk.gdpr.gdpranonymizer.model.dto.GdprColumnViewDto;
import sk.gdpr.gdpranonymizer.model.dto.GdprDataDto;
import sk.gdpr.gdpranonymizer.model.entity.*;
import sk.gdpr.gdpranonymizer.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GdprDataService {

    private final DbMetadataService dbMetadataService;
    private final GdprAuditService gdprAuditService;

    private final GdprDataRepository gdprDataRepository;
    private final GdprColumnRepository gdprColumnRepository;
    private final GdprTableRepository gdprTableRepository;
    private final GdprColumnViewRepository gdprColumnViewRepository;

    @Transactional(readOnly = true)
    public List<GdprData> list() {
        return this.gdprDataRepository.listFetchCols();
    }

    @Transactional
    public GdprData createGdprData(@NotNull GdprDataDto data) {

        final GdprData entity = new GdprData();
        entity.setName(data.getName());
        entity.setCreated(LocalDateTime.now());
        entity.setDefaultValue(data.getDefaultValue());

        this.gdprDataRepository.save(entity);
        this.saveGdprDataColumns(entity, data.getColumns());

        this.gdprAuditService.auditSaveGdprData(entity, true);

        return entity;
    }

    @Transactional
    public GdprData updateGdprData(@NotNull GdprDataDto data) {
        final GdprData entity = this.gdprDataRepository.findById(data.getId()).orElseThrow();
        entity.setName(data.getName());
        entity.setDefaultValue(data.getDefaultValue());

        this.saveGdprDataColumns(entity, data.getColumns());

        this.gdprAuditService.auditSaveGdprData(entity, false);

        return entity;
    }

    @Transactional
    public void deleteGdprData(@NotNull Long id) {
        final GdprData entity = this.gdprDataRepository.findById(id).orElseThrow();
        this.gdprAuditService.auditDeleteGdprData(entity);

        entity.getColumns().clear();
        this.gdprDataRepository.delete(entity);
    }

    @Transactional
    public void saveGdprDataColumns(@NotNull GdprData entity, List<GdprColumnViewDto> dtoColumns) {
        this.gdprDataRepository.save(entity);

        if (dtoColumns == null || dtoColumns.isEmpty()) {
            entity.getColumns().clear();
            return;
        }

        // remove that are not in dto
        entity.getColumns().removeIf(col -> {
            final GdprTable table = col.getGdprTable();

            return dtoColumns.stream().noneMatch(dto ->
                            dto.getColumnName().equals(col.getColumnName()) &&
                            dto.getTableName().equals(table.getTableName()) &&
                            dto.getTableSchema().equals(table.getSchemaName()));
        });

        // add that are not in entity
        dtoColumns
                .stream()
                .filter(dto -> entity.getColumns().stream()
                        .noneMatch(e -> {
                            final GdprTable table = e.getGdprTable();

                            return e.getColumnName().equals(dto.getColumnName()) &&
                                    table.getTableName().equals(dto.getTableName()) &&
                                    table.getSchemaName().equals(dto.getTableSchema());
                        }))
                .forEach(newColumn -> {
                    GdprColumn column = this.gdprColumnRepository.findBySchemaAndTableAndColumn(newColumn.getTableSchema(), newColumn.getTableName(), newColumn.getColumnName())
                            .orElseGet(() -> this.createColumn(newColumn));
                    entity.getColumns().add(column);
                });
    }



    @Transactional
    public GdprColumn createColumn(@NotNull GdprColumnViewDto column) {
        if (!this.dbMetadataService.existsColumn(column.getColumnName(), column.getTableName(), column.getTableSchema())) {
            throw new IllegalArgumentException();
        }

        GdprColumn gdprColumn = new GdprColumn();
        gdprColumn.setColumnName(column.getColumnName());

        // assign to table if exists, otherwise create and assign
        GdprTable table = this.gdprTableRepository.findByTableNameAndSchemaName(column.getTableName(), column.getTableSchema()).orElse(null);
        if (table == null) {
            table = new GdprTable();
            table.setTableName(column.getTableName());
            table.setSchemaName(column.getTableSchema());

            this.gdprTableRepository.save(table);
        }
        gdprColumn.setGdprTable(table);

        return this.gdprColumnRepository.save(gdprColumn);
    }


    @Transactional(readOnly = true)
    public GdprDataDto toDto(@NotNull GdprData source, boolean includeColumns) {
        GdprDataDto dto = new GdprDataDto();

        dto.setId(source.getId());
        dto.setName(source.getName());
        dto.setCreated(source.getCreated());
        dto.setDefaultValue(source.getDefaultValue());

        if (includeColumns) {
            List<GdprColumnView> columnViews = this.gdprColumnViewRepository.findAllByIdIn(source.getColumns().stream().map(AbstractEntity::getId).toList());
            dto.setColumns(columnViews.stream().map(this::toDto).toList());
        }

        return dto;
    }

    public GdprColumnViewDto toDto(@NotNull GdprColumnView source) {
        return new GdprColumnViewDto(
                source.getId(),
                source.getColumnName(),
                source.getTableId(),
                source.getTableSchema(),
                source.getTableName(),
                this.dbMetadataService.toColumnType(source.getDataType())
        );
    }

}
