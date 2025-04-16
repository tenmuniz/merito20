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

4. No seu projeto Railway, clique em "Add" e selecione "Database" > "PostgreSQL"
   - Isso criará automaticamente um banco de dados PostgreSQL e definirá a variável `DATABASE_URL`

5. Adicione as seguintes variáveis de ambiente adicionais no Railway (vá para "Variables"):
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: Uma string aleatória para segurança das sessões (por exemplo: `meritocracia20cipm2025`)

6. Na seção "Settings" do seu projeto:
   - Verifique se a porta principal está configurada para `$PORT` (Railway configura isso automaticamente)
   - Configure o "Health Check Path" para `/health`
   - Configure "Start Command" para `node dist/server/index.js`

7. O Railway detectará e usará o arquivo `railway.toml` para configurações específicas da plataforma

8. Para verificar logs e monitorar a aplicação, vá para a seção "Deployments" do seu projeto

9. Após o deploy, o Railway fornecerá um domínio no formato `https://seu-projeto.up.railway.app`

## Estrutura do Projeto

- `/public`: Arquivos estáticos servidos pelo Express
- `/server`: Código do servidor Node.js/Express
- `/shared`: Modelos e schemas compartilhados
- `/migrations`: Migrações do banco de dados geradas pelo Drizzle Kit

## Gerenciamento do Banco de Dados

### Migrações e Atualizações

1. Para criar/atualizar o banco de dados localmente:
   ```
   npm run db:push
   ```

2. Quando implantado no Railway, o aplicativo executará automaticamente a inicialização do banco de dados durante a primeira execução.

3. Se precisar redefinir o banco de dados:
   - Faça login na aplicação como administrador
   - Use o botão "Zerar Pontos" para resetar eventos e pontuações
   - Para redefinição completa da estrutura, use o Railway CLI:
     ```
     railway run npm run db:push
     ```

### Backup e Restauração

O Railway fornece funcionalidades de backup automático para o PostgreSQL. Para configurar:

1. Acesse o painel do PostgreSQL no Railway
2. Vá para a aba "Backups"
3. Configure backups automáticos diários
4. Para restaurar, selecione um ponto de backup e clique em "Restore"

## Autenticação

- Username: `admin`
- Senha padrão: `admin123` (altere em produção)

## Licença

Este projeto é proprietário da 20ª CIPM.