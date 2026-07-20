# Deploy em outro ambiente

## 1. Pré-requisitos

- Node.js 20+ instalado
- npm ou pnpm instalado
- Acesso ao ambiente de destino (servidor, VPS, container ou VM)
- Variáveis de ambiente configuradas, se necessário

## 2. Clonar e instalar dependências

```bash
cd /caminho/do/projeto
npm install
```

## 3. Construir a aplicação

```bash
npm run build
```

## 4. Iniciar o serviço em produção

```bash
npm run start -- --hostname 0.0.0.0 --port 3000
```

## 5. Variáveis de ambiente recomendadas

Crie um arquivo `.env.local` com as configurações necessárias para o ambiente:

```env
NODE_ENV=production
PORT=3000
```

Se o projeto usar autenticação, webhooks ou outras integrações, adicione também as respectivas variáveis.

## 6. Processo recomendado para servidor

- Faça o deploy do código na máquina alvo
- Instale as dependências com `npm install`
- Gere a build com `npm run build`
- Inicie o processo com `npm run start`
- Se necessário, configure um gerenciador de processo como PM2 ou systemd para manter o serviço ativo após reinicializações

## 7. Exemplo com PM2

```bash
npm install -g pm2
pm2 start "npm run start -- --hostname 0.0.0.0 --port 3000" --name service-hub-website
pm2 save
pm2 startup
```
