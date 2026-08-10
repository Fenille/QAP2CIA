# QAP2CIA — versão corrigida para GitHub Pages

Os arquivos públicos estão diretamente na raiz, como exigido pelo GitHub Pages:

- `index.html`: tela de login;
- `qap.html`: sistema protegido;
- `app.js`, `styles.css` e `firebase-config.js`: arquivos do login.

## Como publicar no GitHub

1. Exclua do repositório os arquivos da versão anterior, principalmente o antigo `index.html`.
2. Extraia este ZIP.
3. Envie **o conteúdo extraído**, e não a pasta nem o ZIP.
4. Aguarde o GitHub Pages concluir a publicação.

## Configuração do Firebase

O arquivo `firebase-config.js` já está preenchido com o aplicativo Web do projeto `qap2cia-bd58b`.

No Firebase, ainda é necessário habilitar **Authentication > E-mail/senha**. O primeiro acesso e a recuperação por e-mail também dependem da publicação das Functions incluídas na pasta `functions`.

O GitHub Pages publica somente o site. Ele não publica Firebase Functions nem regras do Realtime Database.
