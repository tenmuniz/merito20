# Sistema de Meritocracia 20ª CIPM

Sistema de acompanhamento de desempenho das guarnições da 20ª CIPM, rastreando ocorrências e pontuações.

## Tecnologias Utilizadas

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle ORM

## Requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL
- Git

## Configuração Local

1. Clone o repositório:
   ```
   git clone <seu-repositorio-git>
   cd <nome-do-diretorio>
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`
   - Configure a URL do seu banco de dados PostgreSQL

4. Execute as migrações do banco de dados:
   ```
   npm run db:push
   ```

5. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

## Deploy no Railway

1. Crie uma conta no [Railway](https://railway.app/)

2. No dashboard do Railway, clique em "New Project" e selecione "Deploy from GitHub repo"

3. Conecte sua conta GitHub e selecione o repositório

4. Adicione as seguintes variáveis de ambiente no Railway:
   - `DATABASE_URL`: A URL de conexão do PostgreSQL (Railway gerará automaticamente se você adicionar um banco de dados PostgreSQL)
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: Uma string aleatória para segurança das sessões

5. No seu projeto Railway, clique em "Add" e selecione "Database" > "PostgreSQL"

6. No painel do banco de dados, vá para "Connect" e copie a "Connection URL"

7. Volte para o painel do seu aplicativo, vá para "Variables" e defina a variável `DATABASE_URL` com o valor copiado

8. O Railway detectará automaticamente os scripts em seu package.json e executará a aplicação

## Estrutura do Projeto

- `/public`: Arquivos estáticos servidos pelo Express
- `/server`: Código do servidor Node.js/Express
- `/shared`: Modelos e schemas compartilhados
- `/migrations`: Migrações do banco de dados geradas pelo Drizzle Kit

## Autenticação

- Username: `admin`
- Senha padrão: `admin123` (altere em produção)

## Licença

Este projeto é proprietário da 20ª CIPM.