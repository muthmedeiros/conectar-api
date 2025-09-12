# Conéctar API

API desenvolvida em **NestJS** com banco **SQLite**, como parte do desafio técnico Fullstack.  
Implementa autenticação com JWT, gerenciamento de usuários e documentação automática com Swagger.

---

## 🚀 Tecnologias

- [Node.js](https://nodejs.org/) (>= 20.x recomendado)
- [NestJS](https://nestjs.com/) (v11)
- [TypeORM](https://typeorm.io/) (com SQLite)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/) (auto-docs)
- [Jest](https://jestjs.io/) (testes unitários e e2e)

---

## ⚙️ Requisitos

- Node.js **v20 ou superior**  
- npm **>=10** ou [yarn](https://yarnpkg.com/)  
- (opcional) [nvm](https://github.com/nvm-sh/nvm) para gerenciar versões de Node  

```bash
# verificar versão instalada
node -v
npm -v
```

---

## 📦 Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/muthmedeiros/conectar-api.git
cd conectar-api
npm install
```

---

## 🔑 Configuração de ambiente

O projeto usa variáveis de ambiente em um arquivo `.env` na raiz.  
Um arquivo de exemplo já está disponível em **`.example.env`**.  
Basta copiá-lo e preencher com os valores adequados:

```bash
cp .example.env .env
```

> ℹ️ Foi criado um **seed para o primeiro usuário admin**, que é executado automaticamente quando a aplicação inicia em ambiente não-produtivo.

---

## ▶️ Execução local

Rodar a aplicação em modo dev (com watch mode):

```bash
npm run start:dev
```

Rodar em modo produção (após build):

```bash
npm run build
npm run start:prod
```

A API estará disponível em:  
👉 http://localhost:3000/api  

---

## 📖 Documentação Swagger

Acesse:  
👉 http://localhost:3000/docs  

Lá você encontra todos os endpoints, exemplos de requests e responses, além dos schemas de DTO.

---

## 🧪 Testes

O projeto usa Jest para testes unitários e e2e.

### Rodar todos os testes
```bash
npm test
```

### Rodar em watch mode
```bash
npm run test:watch
```

### Testes de integração (e2e)
```bash
npm run test:e2e
```

### Cobertura de testes
```bash
npm run test:cov
```

Um relatório HTML será gerado em `coverage/lcov-report/index.html`.

---

## 🛠 Estrutura de pastas (resumida)

```
src/
  common/         # código compartilhado (guards, pipes, filters, config, etc.)
  modules/        # módulos de domínio (auth, users, etc.)
    auth/         # autenticação e registro de usuários
    users/        # gestão de usuários
  main.ts         # bootstrap da aplicação
  app.module.ts   # módulo raiz
```

---

## 🚢 Deploy no Render

1. Crie um **Web Service** no [Render](https://render.com/).  
   - Runtime: Node  
   - Build Command: `npm ci && npm run build`  
   - Start Command: `npm run start:prod`  
   - Configure as variáveis de ambiente conforme o `.example.env`.

2. **Observação sobre o SQLite**  
   - No plano **Free** do Render, não há disco persistente disponível.  
   - Isso significa que o banco SQLite será **apagado a cada deploy**.  
   - Para persistência, seria necessário um plano pago com **Persistent Disk**.

3. Configure o **CI/CD com GitHub Actions**:  
   - Adicione `RENDER_API_KEY` e `RENDER_SERVICE_ID` como *Secrets* no repositório.  
   - Use o workflow já configurado em `.github/workflows/ci-cd-render.yml`.  
   - Cada `push` na branch `main` executará testes, build e disparará o deploy no Render.

---
