import pg from 'pg'

const { Client } = pg

const columns = [
  'id serial PRIMARY KEY',
  'first text',
  'last text',
  'zip text',
  'email text'
]

const tblMemberCreate = `CREATE TABLE member (${columns.join(', ')});`

const fnMemberSearch = `
CREATE FUNCTION scrud_member_search (p_jsonb jsonb)
RETURNS jsonb
LANGUAGE SQL
AS $$
SELECT json_agg(member)::jsonb
FROM member
WHERE
  id = (p_jsonb->>'id')::integer OR
  first = p_jsonb->>'first' OR
  last = p_jsonb->>'last' OR
  zip = p_jsonb->>'zip' OR
  email = p_jsonb->>'email';
$$;
`

const fnMemberCreate = `
CREATE FUNCTION scrud_member_create (p_jsonb jsonb)
RETURNS jsonb
LANGUAGE SQL
AS $$
INSERT INTO member (
  first,
  last,
  zip,
  email
) VALUES (
  p_jsonb->>'first',
  p_jsonb->>'last',
  p_jsonb->>'zip',
  p_jsonb->>'email'
) RETURNING json_build_array(json_build_object(
  'id', id,
  'first', first,
  'last', last,
  'zip', zip,
  'email', email
))::jsonb;
$$;
`

const fnMemberRead = `
CREATE FUNCTION scrud_member_read (p_jsonb jsonb)
RETURNS jsonb
LANGUAGE SQL
AS $$
SELECT json_agg(member)::jsonb
FROM member
WHERE id = (p_jsonb->>'id')::integer
$$;
`

const fnMemberUpdate = `
CREATE FUNCTION scrud_member_update (p_jsonb jsonb)
RETURNS jsonb
LANGUAGE SQL
AS $$
UPDATE member
SET
  first = coalesce(p_jsonb->>'first', first),
  last = coalesce(p_jsonb->>'last', last),
  zip = coalesce(p_jsonb->>'zip', zip),
  email = coalesce(p_jsonb->>'email', email)
WHERE id = (p_jsonb->>'id')::integer;

SELECT json_agg(member)::jsonb
FROM member
WHERE id = (p_jsonb->>'id')::integer
$$;
`

const fnMemberDelete = `
CREATE FUNCTION scrud_member_delete (p_jsonb jsonb)
RETURNS jsonb
LANGUAGE SQL
AS $$
DELETE FROM member WHERE id = (p_jsonb->>'id')::integer;
SELECT '[{}]'::jsonb;
$$;
`

const setupDatabase = async (pgConfig) => {
  const client = new Client(pgConfig)
  await client.connect()

  await client.query(tblMemberCreate)

  await client.query(fnMemberSearch)
  await client.query(fnMemberCreate)
  await client.query(fnMemberRead)
  await client.query(fnMemberUpdate)
  await client.query(fnMemberDelete)

  await client.end()
}

export { setupDatabase }
