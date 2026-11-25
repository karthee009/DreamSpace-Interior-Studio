-- Run this ONLY on an existing database created before image_url was added to schema.sql.
USE dreamspace_db;
ALTER TABLE products ADD COLUMN image_url VARCHAR(255) NULL AFTER price;
