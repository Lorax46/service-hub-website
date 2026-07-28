# Pipeline CI/CD — Service Hub (pull-based + Docker)

Modelo escolhido: **cada ambiente puxa ativamente a versão aprovada** do
registry GHCR. O GitHub Actions só faz *build* (CI) e publica a imagem (release);
não precisa de acesso SSH de volta aos ambientes (que podem ficar atrás de
Tailscale/NAT, como a máquina de testes).

## Fluxo

```
máquina de testes (dev)                 GitHub                          outros ambientes
─────────────────────                   ───────                         ────────────────
editar código                            │                               │
git commit; git push main ────────────► │ CI: install, lint, tsc, build│
validar na máquina                       │ (garante que builda)          │
git tag vX.Y.Z; git push --tags ──────► │ Release: build+puda imagem    │
                                        │   ghcr.io/.../service-hub-website:vX.Y.Z
                                        │                               │
                                        │               imagem ────────►│ deploy-agent (timer 5min):
                                        │                               │   pull tag de .deploy/TARGET
                                        │                               │   migrate (Postgres local)
                                        │                               │   docker compose up (healthcheck)
                                        │                               │   rollback se healthcheck falhar
```

Promoção entre ambientes = trocar a tag em `.deploy/TARGET` de cada ambiente.

## 1. CI (build/test) — `.github/workflows/ci.yml`
Dispara em PR/push para `main`. Roda `npm ci`, lint (se houver config), type-check
e `next build`. OPR gate real é o build.

## 2. Release (imagem) — `.github/workflows/release.yml`
Dispara no push de tag `v*`. Builda multi-stage e publica em
`ghcr.io/lorax46/service-hub-website:<tag>` + `:latest`.

Pré-requisito: o repo precisa de **GHCR habilitado** (Settings → Packages, ou
deixar o padrão). O `GITHUB_TOKEN` já tem permissão de escrita de pacote no
mesmo repo.

## 3. CD pull-based por ambiente — `systemd/deploy-agent.sh`
Cada máquina (staging, prod, outras) roda o agente via systemd timer.

### Setup em um ambiente (ex.: servidor de produção)
```bash
# 1) clonar o repo (só para ter docker-compose.yml / .env / scripts)
git clone https://github.com/Lorax46/service-hub-website.git /opt/service-hub-website
cd /opt/service-hub-website/service-hub-website

# 2) prover credenciais (NÃO versionar). Pode copiar de .env.local existente:
cp .env.local .env            # ou criar .env com DATABASE_URL, SESSION_SECRET, ...
chmod 600 .env

# 3) login no GHCR (PAT com read:packages) — feito uma vez por ambiente:
echo "$GHCR_TOKEN" | docker login ghcr.io -u <usuario> --password-stdin

# 4) definir a tag alvo deste ambiente:
mkdir -p .deploy
cp .deploy/TARGET.example .deploy/TARGET
#   editar .deploy/TARGET → colocar a tag aprovada (ex.: v0.1.0)
cp .deploy/config.example .deploy/config   # ajustar paths se diferentes

# 5) instalar o agente no systemd:
sudo cp systemd/deploy-agent.sh /opt/service-hub-website/service-hub-website/systemd/deploy-agent.sh
sudo chmod +x /opt/service-hub-website/service-hub-website/systemd/deploy-agent.sh
sudo cp systemd/service-hub-deploy.service /etc/systemd/system/
sudo cp systemd/service-hub-deploy.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now service-hub-deploy.timer

# disparo manual (útil para promover na hora):
sudo systemctl start service-hub-deploy
```

### Como promover um ambiente para uma nova versão
Edite `/opt/service-hub-website/.deploy/TARGET` com a nova tag e rode
`systemctl start service-hub-deploy` (ou aguarde o timer de 5 min). O agente:
1. puxa a imagem,
2. roda `scripts/migrate.mjs` contra o Postgres local (idempotente),
3. sobe o container com healthcheck,
4. faz **rollback** para a versão anterior se o healthcheck falhar.

## Banco de dados
Cada ambiente usa **seu próprio Postgres** (não compartilhar DB entre staging/prod).
As migrations vivem versionadas em `migrations/*.sql` e são aplicadas pelo agente
antes de subir a app. Para usar um Postgres interno no compose:
`docker compose --profile with-db up -d` (ajuste `DATABASE_URL` para `db:5432`).
Para usar o Postgres do host, aponte `DATABASE_URL` para
`host.docker.internal:5432` (o compose já adiciona esse host).

## Variáveis de ambiente (.env)
`DATABASE_URL`, `SESSION_SECRET`, `SECURE_COOKIES`, `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, `NODE_ENV`, `PORT`.
Veja `.env.example`.

## Notas
- O app na máquina de testes continua rodando em modo dev/local (`next start`).
  O timer pull-based é para os **outros** ambientes. Nesta máquina você só o
  usa para validar o agente, se quiser.
- `npm run lint` requer ESLint configurado; o CI pula o lint se não houver.
- `next.config.mjs` tem `typescript.ignoreBuildErrors=true`, então o type-check
  no CI é informativo e não bloqueia.
