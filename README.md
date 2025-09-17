# Conéctar API

API desenvolvida em **NestJS** com banco **SQLite**, como parte do desafio técnico Fullstack.  
Implementa autenticação com JWT, gerenciamento completo de usuários com CRUD, controle de acesso baseado em papéis (RBAC), documentação automática com Swagger e **cobertura completa de testes**.

---

## 🚀 Tecnologias

- [Node.js](https://nodejs.org/) (>= 20.x recomendado)
- [NestJS](https://nestjs.com/) (v11)
- [TypeORM](https://typeorm.io/) (com SQLite)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/) (auto-docs)
- [Jest](https://jestjs.io/) (testes unitários e e2e)
- [bcrypt](https://www.npmjs.com/package/bcrypt) (hash de senhas)
- [class-validator](https://github.com/typestack/class-validator) (validação de DTOs)

---

## 🏗️ Arquitetura

A arquitetura do projeto foi cuidadosamente desenhada para ser **modular**, **fácil de manter** e **escalável**. Os principais pontos são:

- **Modularização**: Cada domínio (ex: Auth, Users, Clients) está isolado em seu próprio módulo, facilitando a localização de bugs, a adição de novas funcionalidades e a manutenção do código.
- **Testabilidade**: A separação clara entre camadas e o uso de injeção de dependências permite testes unitários e de integração robustos, com mocks e isolamento total.
- **Inversão de Dependências**: Os módulos e serviços são desacoplados, utilizando interfaces e providers, o que facilita a troca de implementações e evita dependências rígidas.
- **Componentes Compartilhados**: Pipes, guards, interceptors, middlewares, filtros de exceção e utilitários ficam em `src/common`, promovendo reuso e padronização.
- **Configurações Centralizadas**: Todas as configurações sensíveis (banco, JWT, variáveis de ambiente) estão centralizadas em `src/common/config`.
- **Health Check**: Endpoint dedicado para verificação de saúde da API, facilitando monitoramento e integração com ferramentas externas.

Essa abordagem garante um código limpo, fácil de evoluir, com baixo acoplamento e alta coesão, além de facilitar a identificação e correção de bugs.

---

## 🌐 API Pública (Deploy)

A API está disponível publicamente em produção via Render:

👉 [https://conectar-api-vloa.onrender.com/api](https://conectar-api-vloa.onrender.com/api)

---

## ⚙️ CI/CD Integrado

O projeto conta com **integração contínua e deploy contínuo (CI/CD)** via **GitHub Actions** e **Render**:

- **Testes automáticos**: Todo push na branch `main` executa todos os testes unitários e e2e.
- **Build automatizado**: O build é realizado em ambiente isolado, garantindo que apenas código válido seja deployado.
- **Deploy automático**: Após sucesso nos testes e build, o deploy é disparado automaticamente para o Render.
- **Secrets seguros**: Variáveis sensíveis (tokens, chaves) são gerenciadas via *Secrets* do GitHub.

Workflow de CI/CD já está configurado em `.github/workflows/ci-cd-render.yml`.

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

---

## 🧪 Testes e2e e ambiente

Para rodar os testes e2e, é necessário um arquivo `.env.test` na raiz do projeto com as variáveis obrigatórias:

O projeto carrega automaticamente `.env.test` quando `NODE_ENV=test` (ex: ao rodar `npm run test:e2e`).
Veja o exemplo em `.env.test` já incluído no repositório.

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

### 👤 Admin Seed (Usuário Padrão)

Foi criado um **seed para o primeiro usuário admin**, que é executado automaticamente conforme o ambiente:

- **Desenvolvimento**: ✅ Admin seed é criado automaticamente
  - Email: `admin@conectar.com`
  - Senha: `admin123`
  - Papel: `ADMIN`

- **Produção**: ❌ Admin seed é **desabilitado** por segurança

- **Teste**: ❌ Admin seed é **desabilitado** para isolamento dos testes

```typescript
// Configuração condicional no AuthModule
providers: [
  AuthService,
  JwtStrategy,
  ...(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' ? [AdminSeed] : []),
]
```

> ⚠️ **Importante**: Em produção, você deve criar o primeiro admin manualmente através do endpoint `/auth/register` ou diretamente no banco de dados.

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

### 🔐 Endpoints Principais

#### Auth (Públicos)
- `POST /api/auth/register` - Registro de novos usuários
- `POST /api/auth/login` - Login e obtenção de tokens JWT

#### Users (Autenticados)
- `GET /api/users` - Listar usuários com filtros e paginação (Admin apenas)
- `GET /api/users/:id` - Buscar usuário por ID (Admin: qualquer usuário, User: apenas próprio)
- `POST /api/users` - Criar novo usuário (Admin apenas)
- `PUT /api/users/:id` - Atualizar usuário (Admin: qualquer usuário, User: apenas próprio)
- `DELETE /api/users/:id` - Deletar usuário (Admin apenas)

#### Filtros Disponíveis (GET /users)
- `role` - Filtrar por papel (admin/user)
- `search` - Buscar por nome ou email (correspondência parcial)
- `orderBy` - Ordenar por campo (name/createdAt)
- `order` - Direção da ordenação (ASC/DESC)
- `page` - Número da página (baseado em 1)
- `limit` - Itens por página (máx 100)

---

## 🧪 Testes

O projeto possui **cobertura completa de testes** com Jest, incluindo testes unitários, de integração e e2e (end-to-end).

### 📊 Cobertura Atual
- **Testes Unitários**: 62 testes passando
- **Testes E2E**: 39 testes passando
- **Módulos Testados**: Auth, Users (completos)
- **Cobertura**: Serviços, Controllers, Mappers, Guards, Pipes

### 🔧 Scripts de Teste Disponíveis

#### Testes Principais
```bash
# Todos os testes unitários
npm test

# Apenas testes unitários (excluindo e2e)
npm run test:unit

# Todos os testes e2e (com ambiente isolado)
npm run test:e2e

# Executar todos os testes (unitários + e2e)
npm run test:all
```

#### Testes em Modo Watch
```bash
# Watch mode para unitários
npm run test:watch

# Watch mode para e2e
npm run test:e2e:watch
```

#### Análise de Cobertura
```bash
# Gerar relatório de cobertura
npm run test:cov
```

Um relatório HTML será gerado em `coverage/lcov-report/index.html`.

### ⚙️ Configuração de Ambiente para Testes

O projeto utiliza diferentes configurações para cada ambiente:

- **Desenvolvimento**: Admin seed é criado automaticamente
- **Produção**: Admin seed é desabilitado
- **Teste**: Admin seed é desabilitado + banco isolado

```typescript
// Configuração no AuthModule
...(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' ? [AdminSeed] : [])
```

### 🧪 Estrutura de Testes

```
src/modules/
  auth/__tests__/           # Testes do módulo de autenticação
    auth.controller.spec.ts # Controller com guards e validações
    auth.service.spec.ts    # Service com lógica de negócio
    strategies/             # Estratégias JWT
    mappers/               # Transformação de dados
  users/__tests__/          # Testes do módulo de usuários
    users.controller.spec.ts # CRUD + permissões + validações
    users.service.spec.ts   # CRUD + filtros + paginação
    mappers/               # Create, Update, Get mappers
test/                      # Testes e2e (integração completa)
  auth.e2e-spec.ts        # Fluxos de registro e login
  users.e2e-spec.ts       # CRUD completo + autenticação
```

### 🔐 Características dos Testes

#### Testes Unitários
- **Mocking completo**: Repositórios, serviços e dependências mockados
- **Isolamento**: Cada teste é independente
- **Cobertura**: Todos os cenários (sucesso, erro, edge cases)
- **Validação**: DTOs, guards, pipes, mappers

#### Testes E2E
- **Banco real**: SQLite em memória para isolamento
- **Autenticação completa**: JWT tokens, guards, roles
- **Validação de API**: Status codes, response bodies, headers
- **Cenários reais**: Fluxos completos de usuário

---

## 🛠 Estrutura de pastas (resumida)

```
src/
  common/         # código compartilhado (guards, pipes, filters, config, etc.)
    guards/       # guards de autenticação e autorização
    pipes/        # pipes de validação (UUID, roles, etc.)
    config/       # configurações (DB, JWT, etc.)
  modules/        # módulos de domínio (auth, users, etc.)
    auth/         # autenticação e registro de usuários
    users/        # gestão completa de usuários (CRUD)
  main.ts         # bootstrap da aplicação
  app.module.ts   # módulo raiz
```

### 🔒 Sistema de Permissões

- **Admin**: Acesso total a todos os endpoints de usuários
- **User**: Pode apenas visualizar e editar seus próprios dados
- **Usuários não autenticados**: Acesso apenas aos endpoints de auth (register/login)

### 🗃️ Funcionalidades dos Usuários

- **CRUD Completo**: Criar, listar, visualizar, atualizar e deletar usuários
- **Filtros Avançados**: Por papel, busca textual, ordenação personalizada
- **Paginação**: Controle de performance para listas grandes
- **Validações**: UUID format, dados obrigatórios, tipos corretos
- **Segurança**: Controle de acesso baseado em papéis (RBAC)
- **Testes Completos**: 100% de cobertura em testes unitários e e2e

### 🔧 Arquitetura de Qualidade

- **Domain-Driven Design**: Separação clara entre DTOs, Commands, Domain Models
- **Mappers Pattern**: Transformação segura de dados entre camadas
- **Guard System**: Autenticação JWT + autorização baseada em papéis
- **Validation Pipes**: Validação automática de entrada com class-validator
- **Error Handling**: Tratamento consistente de erros com filtros globais
- **Swagger Integration**: Documentação automática e interativa

---

## 🚢 Deploy no Render

1. Crie um **Web Service** no [Render](https://render.com/).  
   - Runtime: Node  
   - Build Command: `npm ci && npm run build:ci`  
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
