-- =====================================================================
-- Migração: status de convite + catálogo de grupos compartilhados
-- Service Hub
-- =====================================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_group_memberships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON user_group_memberships(group_id);

UPDATE users SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
WHERE status IS DISTINCT FROM (CASE WHEN is_active THEN 'active' ELSE 'inactive' END);

INSERT INTO groups (name, description)
SELECT DISTINCT g, 'Grupo migrado automaticamente'
FROM users, unnest(users.groups) AS g
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_group_memberships (user_id, group_id)
SELECT u.id, gr.id
FROM users u
CROSS JOIN LATERAL unnest(u.groups) AS ug
JOIN groups gr ON gr.name = ug
ON CONFLICT (user_id, group_id) DO NOTHING;

UPDATE users u
SET groups = COALESCE(
  (SELECT array_agg(gr.name ORDER BY gr.name) FROM user_group_memberships m
   JOIN groups gr ON gr.id = m.group_id WHERE m.user_id = u.id),
  '{}'::text[]
)
WHERE u.groups IS DISTINCT FROM COALESCE(
  (SELECT array_agg(gr.name ORDER BY gr.name) FROM user_group_memberships m
   JOIN groups gr ON gr.id = m.group_id WHERE m.user_id = u.id),
  '{}'::text[]
);

COMMIT;
