#!/usr/bin/env bash
# =====================================================================
# Service Hub — script de setup para novo ambiente
# Automatiza: instalar deps, criar .env.local, aplicar schema,
# criar admin inicial e gerar a build de produção.
# Uso: bash scripts/setup.sh
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Service Hub — Setup =="

# 1) Instalar dependências (pnpm se houver lock, senão npm)
if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  echo ">> Instalando dependências com pnpm..."
  pnpm install
elif command -v npm >/dev/null 2>&1; then
  echo ">> Instalando dependências com npm..."
  npm install
else
  echo "ERRO: npm/pnpm não encontrado. Instale Node.js 20+ primeiro." >&2
  exit 1
fi

# 2) Criar .env.local a partir do exemplo, se ainda não existir
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo ">> Criado .env.local a partir de .env.example."

    # Gera SESSION_SECRET forte automaticamente (se ainda vazio no template)
    if ! grep -q "^SESSION_SECRET=." .env.local 2>/dev/null; then
      if command -v openssl >/dev/null 2>&1; then
        GEN_SECRET="$(openssl rand -base64 48)"
        # substitui a linha SESSION_SECRET= (vazia) por uma com valor gerado
        sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=${GEN_SECRET}|" .env.local
        echo ">> SESSION_SECRET gerado automaticamente (openssl rand -base64 48)."
      else
        echo "AVISO: openssl indisponivel - defina SESSION_SECRET manualmente em .env.local."
      fi
    fi

    echo "   EDITE .env.local: ajuste DATABASE_URL e as credenciais de admin."
  else
    echo "AVISO: .env.example ausente. Crie .env.local manualmente com DATABASE_URL."
  fi
fi

# Carrega .env.local para os próximos passos (se existir)
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

# 3) Schema + seed do admin (requer DATABASE_URL acessível)
if [ -n "${DATABASE_URL:-}" ]; then
  echo ">> Aplicando migrations do banco (Postgres)..."
  node scripts/migrate.mjs
  echo ">> Garantindo usuário admin inicial..."
  node scripts/seed-admin.mjs
else
  echo "AVISO: DATABASE_URL não definida — pulando schema/seed."
  echo "   Defina em .env.local e rode depois:"
  echo "     node scripts/migrate.mjs && node scripts/seed-admin.mjs"
fi

# 4) Build de produção
echo ">> Gerando build de produção..."
npm run build

echo ""
echo "== Setup concluído =="
echo "Para subir em produção:"
echo "  npm run start -- --hostname 0.0.0.0 --port 3000"
echo "Ou com PM2:"
echo "  npm install -g pm2"
echo "  pm2 start \"npm run start -- --hostname 0.0.0.0 --port 3000\" --name service-hub-website"
echo "  pm2 save && pm2 startup"
