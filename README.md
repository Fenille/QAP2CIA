# QAP 2ª Cia — versão final com conta Google

Esta versão usa o Firebase Authentication com Google e permanece compatível com o plano gratuito Spark. Não há cadastro nem armazenamento de senha pelo QAP.

## O que está incluído

- Entrada com conta Google.
- Registro do nome e Gmail responsável por cada inclusão ou alteração.
- `rpfenille@gmail.com` definido como administrador principal.
- Painel administrativo para ativar/desativar usuários e conceder/remover perfil de administrador.
- Administrador principal protegido contra desativação ou perda do perfil.
- Trilha de auditoria com data/hora, nome, Gmail, ação, campos alterados e valores anteriores/novos.
- Exportação da auditoria em CSV.
- Regras de segurança do Realtime Database sem Cloud Functions.

## Configuração única no Firebase

1. Abra **Firebase Console > Authentication > Sign-in method**.
2. Selecione **Google**, marque **Ativar**, escolha o e-mail de suporte e salve.
3. Em **Authentication > Settings > Authorized domains**, confirme que `fenille.github.io` está autorizado.
4. Abra **Realtime Database > Rules**, substitua pelo conteúdo de `database.rules.json` e clique em **Publish**.

## Publicação no GitHub Pages

Substitua os arquivos do repositório pelos arquivos desta pasta, mantendo-os na raiz da branch publicada pelo GitHub Pages. Após o GitHub concluir a publicação, atualize a página com `Ctrl + F5`.

## Primeiro acesso administrativo

Entre pelo botão Google usando `rpfenille@gmail.com`. O perfil será criado automaticamente como administrador e o botão **Administração** aparecerá no QAP.

Os demais usuários entram com suas próprias contas Google e são criados inicialmente como usuários ativos. Para impedir o acesso de alguém, use **Administração > Desativar**. A desativação é preferível à exclusão, pois uma conta Google excluída do banco poderia simplesmente entrar de novo e recriar o cadastro.

## Observações

- O RE continua sendo um dado operacional do lançamento, mas a identidade responsável pela alteração é o Gmail autenticado.
- Para aproximadamente 100 acessos por dia, esta arquitetura simples normalmente cabe no plano gratuito, desde que o uso do banco permaneça moderado.
- Nunca inclua senhas no código ou no GitHub.
