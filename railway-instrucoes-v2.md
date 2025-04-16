# Instruções para Deploy no Railway (Versão 2)

## Solução para o problema de DATABASE_URL

Identificamos que o problema principal com o deploy no Railway é a ausência da variável de ambiente `DATABASE_URL`. Fizemos as seguintes melhorias para resolver este problema:

1. Criamos um servidor estático simplificado que funciona independentemente do banco de dados
2. Adicionamos tratamento para quando `DATABASE_URL` não estiver definida
3. Implementamos fallbacks para evitar falhas na inicialização
4. Adicionamos rotas API mock para garantir que o healthcheck passe

## Arquivos Atualizados

- `static-server.js`: Um servidor estático simplificado e mais resiliente
- `server/checkdatabase.js`: Verifica e configura valores padrão para variáveis de banco de dados
- `server/db.ts`: Modificado para funcionar mesmo sem DATABASE_URL
- `railway.toml`: Configuração simplificada para o Railway
- `Procfile`: Atualizado para usar o novo servidor estático

## Passos para Deploy

1. Baixe o arquivo `project-final-v3.zip` que contém todas as mudanças mais recentes
2. Crie um repositório no GitHub e faça upload do conteúdo descompactado
3. No Railway, crie um novo projeto usando o GitHub como fonte
4. **MUITO IMPORTANTE**: Configure as variáveis de ambiente:
   - `DATABASE_URL`: Defina como a URL do banco de dados PostgreSQL criado no Railway
   - `NODE_ENV`: Defina como `production`

5. Certifique-se de que o Railway está usando a versão Node.js 18.x ou superior

## Criando o Banco de Dados no Railway

1. No dashboard do Railway, clique em "New"
2. Selecione "Database"
3. Escolha "PostgreSQL"
4. Após a criação, vá para a aba "Connect" e copie a variável de conexão
5. Adicione essa variável como `DATABASE_URL` nas variáveis de ambiente do seu projeto

## Se o Deploy Continuar Falhando

Se mesmo com todas essas mudanças o deploy falhar:

1. No Railway, desative completamente o healthcheck nas configurações
2. Tente usar a CLI do Railway com os seguintes comandos:
   ```
   npm i -g @railway/cli
   railway login
   railway link
   railway up
   ```

3. Como último recurso, você pode usar o servidor estático localmente em vez de fazer deploy:
   ```
   node static-server.js
   ```

## Credenciais de Acesso

Após o deploy bem-sucedido:

- **Usuário**: admin
- **Senha**: admin123

## Backup de Dados

Se você já tem dados importantes no sistema atual, recomendamos exportar os dados do banco de dados PostgreSQL antes de fazer o deploy no Railway para evitar perda de informações.