# QAP2CIA — versão final no plano gratuito Spark

## Recursos

- Login pelo RE e senha.
- Primeiro acesso sem Cloud Functions.
- RE `140965` como administrador inicial.
- Painel `admin.html` para usuários e auditoria.
- Ativação, desativação e promoção de administradores.
- Registro de criação e edição de lançamentos.
- Registro das alterações administrativas.
- Comparação de dados anteriores e novos.
- Exportação da auditoria em CSV.

## Publicação no GitHub Pages

Extraia o ZIP e envie todos os arquivos da pasta `QAP2CIA-main` para a raiz do repositório. Aguarde a publicação e atualize com `Ctrl + F5`.

## Publicação obrigatória das regras do banco

O GitHub não publica `database.rules.json`. No Firebase:

1. Abra **Realtime Database**.
2. Entre na aba **Regras**.
3. Substitua o conteúdo pelas regras do arquivo `database.rules.json` deste pacote.
4. Clique em **Publicar**.

Faça isso somente depois de confirmar que o administrador RE `140965` já aparece em `usuarios` no Realtime Database.

## Limitação do plano gratuito

A recuperação automática de senha por e-mail não está disponível. O administrador deve redefinir o acesso pelo Firebase Authentication ou recriar o cadastro. Nenhuma senha fica gravada no código ou no Realtime Database.
