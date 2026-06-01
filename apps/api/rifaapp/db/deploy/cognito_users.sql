BEGIN;

ALTER TABLE write.users ADD COLUMN IF NOT EXISTS cognito_sub text;
ALTER TABLE write.users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE write.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE write.users ALTER COLUMN password_salt DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_cognito_sub_idx
    ON write.users (cognito_sub)
    WHERE cognito_sub IS NOT NULL;

COMMIT;
