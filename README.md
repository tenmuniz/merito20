# Sistema de Meritocracia 20ª CIPM

Sistema de acompanhamento de desempenho das guarnições da 20ª CIPM, com recursos para registrar eventos, pontuações e visualização de rankings.

## Requisitos

- Node.js
- PostgreSQL

## Variáveis de ambiente

As seguintes variáveis de ambiente são necessárias:

- `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
- `SESSION_SECRET`: Chave secreta para criptografar sessões
- `PORT`: (Opcional) Porta onde o servidor será executado, padrão 5000

## Como executar localmente

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (crie um arquivo `.env` baseado no `.env.example`)

3. Execute as migrações do banco de dados:
```bash
npm run db:push
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Deploy no Railway

Este projeto está configurado para ser implantado facilmente no Railway. Siga os passos abaixo:

1. Crie uma conta no [Railway](https://railway.app/)

2. Clique em "New Project" e selecione "Deploy from GitHub repo"

3. Conecte sua conta GitHub e selecione este repositório

4. O Railway detectará automaticamente a configuração do projeto. Adicione os seguintes serviços:

   - **PostgreSQL**: Clique em "Add" e escolha "Database" > "PostgreSQL"

5. Configure as variáveis de ambiente:
   - `SESSION_SECRET`: Gere uma string aleatória para segurança das sessões

6. O Railway conectará automaticamente a variável `DATABASE_URL` do serviço PostgreSQL ao seu aplicativo

7. Espere o deploy terminar e clique no botão "View" para acessar sua aplicação

## Conectando um domínio personalizado

Para conectar o domínio 20cipm.com.br:

1. No dashboard do Railway, vá até o serviço do seu aplicativo
2. Clique na aba "Settings"
3. Role até "Domains" e clique em "Generate Domain" ou "Custom Domain"
4. Siga as instruções para configurar os registros DNS do seu domínio

## Sistema de recuperação do usuário administrador

Em caso de problemas com a autenticação do usuário administrador, foram implementados mecanismos de emergência para resetar as credenciais para o padrão original:

### Opção 1: Usando os scripts de emergência

Foram disponibilizados scripts para facilitar o reset do administrador:

- **Windows**: Execute o arquivo `reset-admin.bat` com duplo clique
- **Linux/Mac**: Execute o arquivo `reset-admin.sh` com o comando `./reset-admin.sh`

Estes scripts irão resetar o usuário administrador para:
- Usuário: `admin`
- Senha: `admin123`

### Opção 2: Usando o endpoint de emergência

Se o sistema estiver em execução mas você não consegue acessar como administrador, acesse:

```
https://seu-dominio.com.br/api/reset-admin
```

ou localmente:

```
http://localhost:5000/api/reset-admin
```

Este endpoint recriará o usuário admin com as credenciais padrão.

### Opção 3: No Railway

Em casos extremos, conecte-se ao Railway e execute:

```bash
npm run reset-admin
```

Isso executará o script de reset diretamente no servidor.