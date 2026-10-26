-- 1. Add a new UUID column with auto-generation
ALTER TABLE logins ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- 2. Drop the old integer ID and set the new UUID as the primary key
ALTER TABLE logins DROP CONSTRAINT IF EXISTS logins_pkey CASCADE;
ALTER TABLE logins DROP COLUMN id;
ALTER TABLE logins RENAME COLUMN new_id TO id;
ALTER TABLE logins ADD PRIMARY KEY (id);

-- (Optional) If you have dependent tables like 'admins' or 'food' that reference logins.id, 
-- you would need to add similar columns and migrate their foreign keys here. For example:
-- ALTER TABLE admins ADD COLUMN new_login_id UUID;
-- UPDATE admins a SET new_login_id = (SELECT new_id FROM logins l WHERE l.id = a.login_id);
-- ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_login_id_fkey;
-- ALTER TABLE admins DROP COLUMN login_id;
-- ALTER TABLE admins RENAME COLUMN new_login_id TO login_id;
