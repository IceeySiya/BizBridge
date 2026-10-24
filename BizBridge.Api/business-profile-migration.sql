START TRANSACTION;
ALTER TABLE "Businesses" ADD "BusinessEmail" character varying(254);

ALTER TABLE "Businesses" ADD "BusinessPhone" character varying(30);

ALTER TABLE "Businesses" ADD "ImageUrl" character varying(2048);

ALTER TABLE "Businesses" ADD "WebsiteUrl" character varying(2048);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261023213359_AddBusinessContactAndImage', '9.0.4');

COMMIT;

