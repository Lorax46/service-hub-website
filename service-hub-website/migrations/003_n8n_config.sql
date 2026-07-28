-- Tabela de configuração global do n8n (singleton: id=1).
-- Armazena a URL base e a apikey (criptografada na aplicação, nunca em texto puro aqui).
CREATE TABLE IF NOT EXISTS n8n_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_url text NOT NULL,
  api_key_encrypted text,
  api_key_nonce text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users (id) ON DELETE SET NULL
);
