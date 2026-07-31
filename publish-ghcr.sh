#!/bin/bash
# =====================================================================
# publish-ghcr.sh — Build, tag e publique a imagem no GHCR
#
# Uso:
#   ./publish-ghcr.sh [tag]
#
# Exemplos:
#   ./publish-ghcr.sh v1.0.0        # tag explícita
#   ./publish-ghcr.sh               # usa o último tag git + "-dev"
#   ./publish-ghcr.sh latest        # tag customizada
#
# Pré-requisitos:
#   - CR_PAT configurado como variável de ambiente ou no .env
#   - Docker instalado e logado no GHCR
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_DIR/service-hub-website"

GHCR_REGISTRY="ghcr.io"
GHCR_OWNER="lorax46"
IMAGE_NAME="service-hub-website"
FULL_IMAGE="$GHCR_REGISTRY/$GHCR_OWNER/$IMAGE_NAME"

# ---- Tag ----
TAG="${1:-}"
if [ -z "$TAG" ]; then
    # Tenta pegar o último tag git
    LAST_TAG=$(git -C "$PROJECT_DIR" tag --sort=-v:refname | head -1 2>/dev/null || echo "")
    if [ -n "$LAST_TAG" ]; then
        # Incrementa a patch version
        MAJOR=$(echo "$LAST_TAG" | sed 's/^v//' | cut -d. -f1)
        MINOR=$(echo "$LAST_TAG" | sed 's/^v//' | cut -d. -f2)
        PATCH=$(echo "$LAST_TAG" | sed 's/^v//' | cut -d. -f3)
        NEW_PATCH=$((PATCH + 1))
        TAG="v${MAJOR}.${MINOR}.${NEW_PATCH}"
    else
        TAG="v0.1.0"
    fi
fi

echo "=== Publish Service Hub para GHCR ==="
echo "Imagem: $FULL_IMAGE:$TAG"
echo ""

# ---- Login no GHCR ----
echo "--- Login no GHCR ---"
if [ -z "${CR_PAT:-}" ]; then
    # Tenta carregar de .env
    if [ -f "$APP_DIR/.env.local" ]; then
        CR_PAT=$(grep -E '^CR_PAT=' "$APP_DIR/.env.local" | cut -d= -f2-)
    fi
fi

if [ -z "${CR_PAT:-}" ]; then
    echo "ERRO: CR_PAT não definido. Defina a variável de ambiente CR_PAT ou coloque CR_PAT=... em .env.local"
    exit 1
fi

echo "$CR_PAT" | docker login "$GHCR_REGISTRY" -u "$GHCR_OWNER" --password-stdin
echo "Login realizado com sucesso."
echo ""

# ---- Build ----
echo "--- Build da imagem ---"
cd "$APP_DIR"
docker build -t "$FULL_IMAGE:$TAG" -t "$FULL_IMAGE:latest" .
echo "Build concluído."
echo ""

# ---- Push ----
echo "--- Push para GHCR ---"
docker push "$FULL_IMAGE:$TAG"
docker push "$FULL_IMAGE:latest"
echo "Push concluído."
echo ""

echo "=== Publicação completa! ==="
echo "Imagem disponível em: $FULL_IMAGE:$TAG"