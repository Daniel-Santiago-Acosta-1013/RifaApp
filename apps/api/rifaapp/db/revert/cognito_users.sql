BEGIN;

DROP INDEX IF EXISTS write.users_cognito_sub_idx;
ALTER TABLE write.users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE write.users DROP COLUMN IF EXISTS cognito_sub;
UPDATE write.users SET password_hash = '' WHERE password_hash IS NULL;
UPDATE write.users SET password_salt = '' WHERE password_salt IS NULL;
ALTER TABLE write.users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE write.users ALTER COLUMN password_salt SET NOT NULL;

COMMIT;
