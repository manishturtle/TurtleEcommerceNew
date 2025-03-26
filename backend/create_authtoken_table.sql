-- Create authtoken_token table
CREATE TABLE IF NOT EXISTS authtoken_token (
    key varchar(40) NOT NULL PRIMARY KEY,
    created timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL UNIQUE REFERENCES auth_user(id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS authtoken_token_user_id_idx ON authtoken_token(user_id);
