CREATE DATABASE IF NOT EXISTS gdpr;
USE gdpr;

CREATE SCHEMA gdpr;

CREATE TABLE gdpr.gdpr_audit
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    message         VARCHAR(1024),
    created         DATETIME NOT NULL,
    parent_audit_id BIGINT,
    CONSTRAINT gdpr_audit_gdpr_audit_id_fk FOREIGN KEY (parent_audit_id) REFERENCES gdpr.gdpr_audit(id)
);

CREATE TABLE gdpr.gdpr_data
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(128) NOT NULL UNIQUE,
    created       DATETIME NOT NULL,
    default_value VARCHAR(255)
);

CREATE TABLE gdpr.gdpr_table
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(128) NOT NULL,
    schema_name VARCHAR(128) NOT NULL,
    CONSTRAINT gdpr_unique_table_index UNIQUE (table_name, schema_name)
);

CREATE TABLE gdpr.gdpr_column
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    gdpr_table_id BIGINT NOT NULL,
    column_name   VARCHAR(128) NOT NULL,
    CONSTRAINT gdpr_column_gdpr_table_id_fk FOREIGN KEY (gdpr_table_id) REFERENCES gdpr.gdpr_table(id),
    CONSTRAINT gdpr_column_unique UNIQUE (gdpr_table_id, column_name)
);

CREATE TABLE gdpr.gdpr_data_location
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    gdpr_data_id   BIGINT NOT NULL,
    gdpr_column_id BIGINT NOT NULL,
    CONSTRAINT gdpr_data_location_gdpr_data_id_fk FOREIGN KEY (gdpr_data_id) REFERENCES gdpr.gdpr_data(id),
    CONSTRAINT gdpr_data_location_gdpr_column_id_fk FOREIGN KEY (gdpr_column_id) REFERENCES gdpr.gdpr_column(id),
    CONSTRAINT gdpr_data_location_pk UNIQUE (gdpr_column_id, gdpr_data_id)
);

CREATE TABLE gdpr.gdpr_table_node
(
    id                         BIGINT AUTO_INCREMENT PRIMARY KEY,
    label                      VARCHAR(255),
    gdpr_table_id              BIGINT NOT NULL,
    identification_column_name VARCHAR(255) NOT NULL,
    parent_node_id             BIGINT,
    conditions_operator        VARCHAR(3),
    CONSTRAINT gdpr_table_node_gdpr_table_id_fk FOREIGN KEY (gdpr_table_id) REFERENCES gdpr.gdpr_table(id),
    CONSTRAINT gdpr_table_node_gdpr_table_node_id_fk FOREIGN KEY (parent_node_id) REFERENCES gdpr.gdpr_table_node(id)
);

CREATE TABLE gdpr.gdpr_join_condition
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    child_column  VARCHAR(255) NOT NULL,
    parent_column VARCHAR(255),
    operator      VARCHAR(10) NOT NULL,
    constant      VARCHAR(255),
    node_id       BIGINT NOT NULL,
    CONSTRAINT gdpr_join_condition_gdpr_table_node_id_fk FOREIGN KEY (node_id) REFERENCES gdpr.gdpr_table_node(id)
);

CREATE VIEW gdpr.gdpr_column_view AS
    SELECT c.id AS Id,
           c.column_name AS column_name,
           t.id AS table_id,
           t.schema_name AS table_schema,
           t.table_name AS table_name,
           col.DATA_TYPE AS data_type
    FROM gdpr.gdpr_column c
    JOIN gdpr.gdpr_table t ON c.gdpr_table_id = t.id
    JOIN information_schema.columns col ON col.table_name = t.table_name
    AND col.table_schema = t.schema_name
    AND col.column_name = c.column_name;

CREATE VIEW gdpr.gdpr_data_view AS
SELECT
    d.id,
    d.name,
    d.created
FROM gdpr.gdpr_data d;
