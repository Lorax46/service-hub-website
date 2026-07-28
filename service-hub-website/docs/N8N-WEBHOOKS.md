# Configuração dos webhooks do n8n (Service Hub)

A conexão com o n8n é **global por ambiente** e é configurada em:

```
/dashboard/tools/workflow-automation/settings   (acesso admin)
```

Ou via card "Configurações do n8n" na aba **Ferramentas**.

## O que é configurável

| Campo | Onde vive | Descrição |
|-------|-----------|-----------|
| URL base do n8n | banco (`n8n_config.base_url`) | Endereço da instância, ex.: `https://n8n.empresa.com` |
| Apikey do n8n | banco (`n8n_config.api_key_encrypted`, criptografada) | Enviada nos headers `X-API-KEY` e `Authorization: Bearer` |
| Webhook de cada flow | banco (`n8n_config.flow_paths`) | Caminho relativo de cada workflow no n8n |

A URL final de um webhook é montada como:

```
<URL base>/<path do flow>
```

Ex.: base `https://n8n.empresa.com` + path `webhook/a9cfc4d5-...` →
`https://n8n.empresa.com/webhook/a9cfc4d5-...`

## Como configurar (passo a passo)

1. Acesse **Ferramentas → Configurações do n8n** (ou a página de Automação de Workflows → "Configurar n8n").
2. Preencha a **URL base** da sua instância n8n.
3. Cole a **apikey** (se já existir uma salva, deixe em branco para mantê-la).
4. Em **Webhooks por flow**, para cada um dos 6 workflows, informe o **path** do webhook correspondente
   no seu n8n (ex.: `webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1`). Deixe em branco para usar o padrão
   do código.
5. Salve.

A partir daí, todos os flows (Relatórios, Drift de dados, Steampipe, Tailpipe) disparam usando a
URL base + o path configurado, com a apikey nos headers.

## Lista de flows e paths padrão

Os paths abaixo são os **padrões do código** (`lib/n8n-flows.ts`). Se você configurar um path
diferente na UI, ele tem precedência.

| Flow (id) | Nome | Path padrão |
|-----------|------|-------------|
| `createReports` | Criar relatórios | `webhook/criar-relatorios` |
| `sendReports` | Enviar relatórios | `webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1` |
| `generateDataDrift` | Gerar drift de dados | `webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1` |
| `steampipeQuery` | Steampipe query | `webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1` |
| `steampipeUpdateDatabase` | Update database Steampipe | `webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1` |
| `tailpipeQuery` | Tailpipe query | `webhook/tailpipe-query` |

> Observação: `sendReports`, `generateDataDrift`, `steampipeQuery` e `steampipeUpdateDatabase`
> compartilham o mesmo path padrão — no n8n original eles eram um único webhook que roteia pelo
> conteúdo do payload. Ajuste conforme sua instância.

## Armazenamento

- Tabela: `n8n_config` (singleton, `id = 1`).
- `api_key_encrypted` / `api_key_nonce`: apikey criptografada com **AES-256-GCM** derivado de
  `SESSION_SECRET`. Nunca fica em texto puro no banco.
- `flow_paths`: JSONB `{ "flowId": "path", ... }`.
- Migrations: `003_n8n_config.sql` (tabela) e `004_n8n_flow_paths.sql` (coluna `flow_paths`).

## Troubleshooting

- **"Conexão com o n8n não configurada"**: ninguém salvou a config ainda. Vá em Configurações do n8n.
- **Webhook retorna 401/403**: apikey incorreta ou o n8n espera o header em outro formato. A apikey é
  enviada tanto em `X-API-KEY` quanto em `Authorization: Bearer`.
- **Webhook 404**: o path do flow está incorreto para sua instância — ajuste em "Webhooks por flow".
- Para inspecionar a config salva: `SELECT base_url, flow_paths FROM n8n_config WHERE id = 1;`
