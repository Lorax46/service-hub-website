-- Adiciona mapeamento de paths por flow à configuração do n8n.
-- flow_paths: JSONB no formato { "flowId": "webhook/xyz", ... }
-- Quando vazio/nulo, usa o path padrão de lib/n8n-flows.ts.
ALTER TABLE n8n_config ADD COLUMN IF NOT EXISTS flow_paths jsonb NOT NULL DEFAULT '{}'::jsonb;
