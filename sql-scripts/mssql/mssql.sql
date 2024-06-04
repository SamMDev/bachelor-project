create schema gdpr
go

create table gdpr.gdpr_audit
(
    id              bigint identity
        constraint gdpr_audit_pk
            primary key,
    message         varchar(1024),
    created         datetime not null,
    parent_audit_id bigint
        constraint gdpr_audit_gdpr_audit_id_fk
            references gdpr.gdpr_audit
)
go

create table gdpr.gdpr_data
(
    Id            bigint identity
        constraint PK_GDPR_DATA
            primary key,
    name          varchar(128) not null
        unique,
    created       datetime     not null,
    default_value varchar(255)
)
go

create table gdpr.gdpr_table
(
    Id          bigint identity
        constraint PK_GDPR_TABLE
            primary key,
    table_name  varchar(128) not null,
    schema_name varchar(128) not null,
    constraint gdpr_unique_table_index
        unique (table_name, schema_name)
)
go

create table gdpr.gdpr_column
(
    Id            bigint identity
        constraint PK_GDPR_COLUMN
            primary key,
    gdpr_table_id bigint       not null
        constraint gdpr_column_gdpr_table_Id_fk
            references gdpr.gdpr_table,
    column_name   varchar(128) not null,
    constraint gdpr_column_unique
        unique (gdpr_table_id, column_name)
)
go

create table gdpr.gdpr_data_location
(
    Id             bigint identity
        constraint PK_GDPR_DATA_LOCATION
            primary key,
    gdpr_data_id   bigint not null
        constraint gdpr_data_location_gdpr_data_Id_fk
            references gdpr.gdpr_data,
    gdpr_column_id bigint not null
        constraint gdpr_data_location_gdpr_column_Id_fk
            references gdpr.gdpr_column,
    constraint gdpr_data_location_pk
        unique (gdpr_column_id, gdpr_data_id)
)
go

create table gdpr.gdpr_table_node
(
    Id                         bigint identity
        constraint gdpr_table_node_pk
            primary key,
    label                      varchar(255),
    gdpr_table_id              bigint       not null
        constraint gdpr_table_node_gdpr_table_Id_fk
            references gdpr.gdpr_table,
    identification_column_name varchar(255) not null,
    parent_node_id             bigint
        constraint gdpr_table_node_gdpr_table_node_Id_fk
            references gdpr.gdpr_table_node,
    conditions_operator        varchar(3)
)
go

create table gdpr.gdpr_join_condition
(
    Id            bigint identity
        constraint gdpr_join_condition_pk
            primary key,
    child_column  varchar(255) not null,
    parent_column varchar(255),
    operator      varchar(10)  not null,
    constant      varchar(255),
    node_id       bigint       not null
        constraint gdpr_join_condition_gdpr_table_node_Id_fk
            references gdpr.gdpr_table_node
)
go

CREATE view gdpr.gdpr_column_view as
    select c.Id          as 'Id',
           c.column_name as 'column_name',
           t.Id          as 'table_id',
           t.schema_name as 'table_schema',
           t.table_name  as 'table_name',
           col.DATA_TYPE as 'data_type'
    from gdpr.gdpr_column c
             join gdpr.gdpr_table t on c.gdpr_table_id = t.id
             JOIN information_schema.columns col on
        col.table_name = t.table_name and
        col.table_schema = t.schema_name and
        col.column_name = c.column_name
go

create view gdpr.gdpr_data_view as
SELECT
    d.id,
    d.name,
    d.created
FROM gdpr.gdpr_data d
go
