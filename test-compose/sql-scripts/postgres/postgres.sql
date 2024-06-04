CREATE SCHEMA IF NOT EXISTS gdpr;

CREATE TABLE gdpr.gdpr_audit
(
    id              BIGSERIAL PRIMARY KEY,
    message         VARCHAR(1024),
    created         TIMESTAMP NOT NULL,
    parent_audit_id BIGINT,
    CONSTRAINT gdpr_audit_gdpr_audit_id_fk FOREIGN KEY (parent_audit_id) REFERENCES gdpr.gdpr_audit(id)
);

CREATE TABLE gdpr.gdpr_data
(
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(128) NOT NULL UNIQUE,
    created       TIMESTAMP NOT NULL,
    default_value VARCHAR(255)
);

CREATE TABLE gdpr.gdpr_table
(
    id          BIGSERIAL PRIMARY KEY,
    table_name  VARCHAR(128) NOT NULL,
    schema_name VARCHAR(128) NOT NULL,
    CONSTRAINT gdpr_unique_table_index UNIQUE (table_name, schema_name)
);

CREATE TABLE gdpr.gdpr_column
(
    id            BIGSERIAL PRIMARY KEY,
    gdpr_table_id BIGINT NOT NULL,
    column_name   VARCHAR(128) NOT NULL,
    CONSTRAINT gdpr_column_gdpr_table_id_fk FOREIGN KEY (gdpr_table_id) REFERENCES gdpr.gdpr_table(id),
    CONSTRAINT gdpr_column_unique UNIQUE (gdpr_table_id, column_name)
);

CREATE TABLE gdpr.gdpr_data_location
(
    id             BIGSERIAL PRIMARY KEY,
    gdpr_data_id   BIGINT NOT NULL,
    gdpr_column_id BIGINT NOT NULL,
    CONSTRAINT gdpr_data_location_gdpr_data_id_fk FOREIGN KEY (gdpr_data_id) REFERENCES gdpr.gdpr_data(id),
    CONSTRAINT gdpr_data_location_gdpr_column_id_fk FOREIGN KEY (gdpr_column_id) REFERENCES gdpr.gdpr_column(id),
    CONSTRAINT gdpr_data_location_pk UNIQUE (gdpr_column_id, gdpr_data_id)
);

CREATE TABLE gdpr.gdpr_table_node
(
    id                         BIGSERIAL PRIMARY KEY,
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
    id            BIGSERIAL PRIMARY KEY,
    child_column  VARCHAR(255) NOT NULL,
    parent_column VARCHAR(255),
    operator      VARCHAR(10) NOT NULL,
    constant      VARCHAR(255),
    node_id       BIGINT NOT NULL,
    CONSTRAINT gdpr_join_condition_gdpr_table_node_id_fk FOREIGN KEY (node_id) REFERENCES gdpr.gdpr_table_node(id)
);

CREATE VIEW gdpr.gdpr_column_view AS
    SELECT c.id AS id,
           c.column_name AS column_name,
           t.id AS table_id,
           t.schema_name AS table_schema,
           t.table_name AS table_name,
           col.data_type AS data_type
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


-- TEST DATA
CREATE SCHEMA IF NOT EXISTS crs;

-- Create Person table
CREATE TABLE crs.Person (
                            PersonID SERIAL PRIMARY KEY,
                            FirstName VARCHAR(50),
                            LastName VARCHAR(50),
                            BirthDate DATE,
                            Gender VARCHAR(10),
                            BirthNumber VARCHAR(15)
);

-- Create ContactInfo table
CREATE TABLE crs.ContactInfo (
                                 ContactInfoID SERIAL PRIMARY KEY,
                                 PersonID INT,
                                 Email VARCHAR(100),
                                 PhoneNumber VARCHAR(15),
                                 FOREIGN KEY (PersonID) REFERENCES crs.Person(PersonID)
);

-- Create MedicalRecord table
CREATE TABLE crs.MedicalRecord (
                                   RecordID SERIAL PRIMARY KEY,
                                   PersonID INT,
                                   Description TEXT,
                                   RecordDate DATE,
                                   BirthNumber VARCHAR(15),
                                   Gender VARCHAR(10),
                                   FOREIGN KEY (PersonID) REFERENCES crs.Person(PersonID)
);

-- Create MedicalRecordInvoice table
CREATE TABLE crs.MedicalRecordInvoice (
                                          InvoiceID SERIAL PRIMARY KEY,
                                          medical_record_id INT,
                                          amount MONEY,
                                          FOREIGN KEY (medical_record_id) REFERENCES crs.MedicalRecord(RecordID)
);
DO $$
    DECLARE
        PersonIDD INT;
        RecordIDD INT;
        i INT;
        j INT;
        k INT;
    BEGIN
        -- Insert 3 records into the Person table
        INSERT INTO crs.Person (FirstName, LastName, BirthDate, Gender, BirthNumber)
        VALUES ('John', 'Doe', '1980-01-01', 'Male', '8011011234'),
               ('Jane', 'Smith', '1990-02-02', 'Female', '9002025678'),
               ('Jim', 'Brown', '1975-03-03', 'Male', '7503032468');

        -- Loop to insert contact info and medical records for each person
        FOR PersonIDD IN
            SELECT p.PersonID FROM crs.Person p
            ORDER BY p.PersonID DESC
            LIMIT 3
            LOOP
                -- Insert 20 ContactInfo records for each person
                i := 1;
                WHILE i <= 20 LOOP
                        INSERT INTO crs.ContactInfo (PersonID, Email, PhoneNumber)
                        VALUES (PersonIDD, CONCAT('user', i, '@example.com'), CONCAT('555-010', LPAD(i::TEXT, 3, '0')));
                        i := i + 1;
                    END LOOP;

                -- Insert 5 MedicalRecord records for each person
                j := 1;
                WHILE j <= 5 LOOP
                        INSERT INTO crs.MedicalRecord (PersonID, Description, RecordDate, BirthNumber, Gender)
                        VALUES (
                                PersonIDD,
                                CONCAT('Record Description ', j),
                                CURRENT_DATE + j,
                                (SELECT p.BirthNumber FROM crs.Person p WHERE p.PersonID = PersonIDD),
                                (SELECT p.Gender FROM crs.Person p WHERE p.PersonID = PersonIDD))
                        RETURNING RecordID INTO RecordIDD;

                        -- Insert 3 MedicalRecordInvoice records for each medical record
                        k := 1;
                        WHILE k <= 3 LOOP
                                INSERT INTO crs.MedicalRecordInvoice (medical_record_id, amount)
                                VALUES (RecordIDD, k * 100);
                                k := k + 1;
                            END LOOP;
                        j := j + 1;
                    END LOOP;
            END LOOP;
    END $$;

    INSERT INTO gdpr.gdpr_table (id, table_name, schema_name) VALUES (1, 'person', 'crs');
    INSERT INTO gdpr.gdpr_table (id, table_name, schema_name) VALUES (2, 'medicalrecord', 'crs');
    INSERT INTO gdpr.gdpr_table (id, table_name, schema_name) VALUES (3, 'contactinfo', 'crs');
    INSERT INTO gdpr.gdpr_table (id, table_name, schema_name) VALUES (4, 'medicalrecordinvoice', 'crs');

    INSERT INTO gdpr.gdpr_column (id, gdpr_table_id, column_name) VALUES (1, 1, 'birthnumber');
    INSERT INTO gdpr.gdpr_column (id, gdpr_table_id, column_name) VALUES (2, 2, 'birthnumber');
    INSERT INTO gdpr.gdpr_column (id, gdpr_table_id, column_name) VALUES (3, 1, 'lastname');
    INSERT INTO gdpr.gdpr_column (id, gdpr_table_id, column_name) VALUES (4, 3, 'email');
    INSERT INTO gdpr.gdpr_column (id, gdpr_table_id, column_name) VALUES (5, 4, 'amount');

    INSERT INTO gdpr.gdpr_data (id, name, created, default_value) VALUES (1, 'Rodné číslo', '2024-05-29 07:08:44.144993', 'xxx');
    INSERT INTO gdpr.gdpr_data (id, name, created, default_value) VALUES (2, 'Priezvisko', '2024-05-29 07:10:37.536934', 'aaa');
    INSERT INTO gdpr.gdpr_data (id, name, created, default_value) VALUES (3, 'Email', '2024-05-29 07:11:23.264339', 'xxx@xxx');

    INSERT INTO gdpr.gdpr_data_location (id, gdpr_data_id, gdpr_column_id) VALUES (1, 1, 1);
    INSERT INTO gdpr.gdpr_data_location (id, gdpr_data_id, gdpr_column_id) VALUES (2, 1, 2);
    INSERT INTO gdpr.gdpr_data_location (id, gdpr_data_id, gdpr_column_id) VALUES (3, 2, 3);
    INSERT INTO gdpr.gdpr_data_location (id, gdpr_data_id, gdpr_column_id) VALUES (4, 3, 4);

    INSERT INTO gdpr.gdpr_table_node (id, label, gdpr_table_id, identification_column_name, parent_node_id, conditions_operator) VALUES (1, 'Hlavný zdroj fyzických osôb', 1, 'personid', null, null);
    INSERT INTO gdpr.gdpr_table_node (id, label, gdpr_table_id, identification_column_name, parent_node_id, conditions_operator) VALUES (2, 'Zdravotne zaznamy', 2, 'recordid', 1, 'OR');
    INSERT INTO gdpr.gdpr_table_node (id, label, gdpr_table_id, identification_column_name, parent_node_id, conditions_operator) VALUES (3, 'Faktury za zdravotne zaznamy', 4, 'invoiceid', 2, 'AND');
    INSERT INTO gdpr.gdpr_table_node (id, label, gdpr_table_id, identification_column_name, parent_node_id, conditions_operator) VALUES (4, 'Kontaktné údaje', 3, 'contactinfoid', 1, 'AND');

    INSERT INTO gdpr.gdpr_join_condition (id, child_column, parent_column, operator, constant, node_id) VALUES (1, 'personid', 'personid', 'EQUALS', null, 2);
    INSERT INTO gdpr.gdpr_join_condition (id, child_column, parent_column, operator, constant, node_id) VALUES (2, 'medical_record_id', 'recordid', 'EQUALS', null, 3);
    INSERT INTO gdpr.gdpr_join_condition (id, child_column, parent_column, operator, constant, node_id) VALUES (3, 'personid', 'personid', 'EQUALS', null, 4);
    INSERT INTO gdpr.gdpr_join_condition (id, child_column, parent_column, operator, constant, node_id) VALUES (4, 'birthnumber', 'birthnumber', 'EQUALS', null, 2);
