# Instruções para Deploy no Railway

## Arquivos Atualizados
Os seguintes arquivos foram modificados para melhorar a compatibilidade com o Railway:

- `railway.toml`: Configurações simplificadas sem healthcheck
- `Procfile`: Inicia o aplicativo no modo de produção
- `.dockerignore`: Evita incluir arquivos desnecessários

## Passos para Deploy

1. Baixe o arquivo `project-finale.zip` que contém todas as mudanças
2. Crie um repositório no GitHub e faça upload do conteúdo descompactado
3. Crie um novo projeto no Railway
4. Conecte o Railway ao seu repositório GitHub
5. **Importante**: Configure as variáveis de ambiente:
   - `DATABASE_URL`: URL do banco de dados PostgreSQL criado no Railway
   - `NODE_ENV`: `production`
   - `PORT`: Deixe o Railway definir automaticamente

## Solução de Problemas

Se o deploy continuar falhando, tente estas opções:

### Opção 1: Desabilitar completamente o healthcheck
O Railway pode continuar tentando fazer healthcheck mesmo quando desabilitado no arquivo de configuração. Neste caso, no dashboard do Railway:
1. Vá para as configurações do seu projeto
2. Encontre a seção "Health Check"
3. Desative completamente esta opção

### Opção 2: Usar um Buildpack personalizado
Se o deploy ainda falhar:
1. No dashboard do Railway, vá para as configurações
2. Mude o builder para "Heroku"
3. Especifique o buildpack como `heroku/nodejs`

### Opção 3: Deploy direto da CLI do Railway
Se as opções acima não funcionarem:
1. Instale a CLI do Railway: `npm i -g @railway/cli`
2. Faça login: `railway login`
3. Link ao projeto: `railway link`
4. Deploy local: `railway up`

## Variáveis de Ambiente
Certifique-se de configurar todas as variáveis de ambiente necessárias no Railway:

```
DATABASE_URL=postgres://...
NODE_ENV=production
PORT=deixe_o_railway_definir
```

## Credenciais de Acesso
Após o deploy bem-sucedido, use estas credenciais para acessar o sistema:

- **Usuário**: admin
- **Senha**: admin123