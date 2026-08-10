# QAP 2ª Cia com login por RE

Esta versão integra o sistema QAP2CIA com autenticação.

## Fluxos incluídos

- Login pelo RE e senha.
- Primeiro acesso com cadastro de RE, senha e e-mail de recuperação.
- Redefinição de senha por link enviado ao e-mail cadastrado.
- Bloqueio da página `qap.html` para usuários não autenticados ou inativos.
- Botão Sair e identificação do RE conectado.
- Leituras e gravações de `operacoes` autenticadas por token.
- Registro de criação do lançamento em `criadoPorUid`.

## Configuração obrigatória antes do teste

1. No Console Firebase do projeto `qap2cia-bd58b`, acesse **Configurações do projeto > Seus apps** e crie/abra um aplicativo Web.
2. Copie `apiKey`, `messagingSenderId` e `appId` para `public/firebase-config.js`.
3. Em **Authentication > Sign-in method**, habilite **E-mail/senha**.
4. Dentro de `functions`, execute `npm install`.
5. Configure os segredos do servidor de e-mail:

   ```bash
   firebase functions:secrets:set SMTP_HOST
   firebase functions:secrets:set SMTP_PORT
   firebase functions:secrets:set SMTP_USER
   firebase functions:secrets:set SMTP_PASS
   firebase functions:secrets:set SMTP_FROM
   ```

6. Publique a integração:

   ```bash
   firebase deploy --only functions,database,hosting
   ```

7. Abra a URL exibida pelo Firebase Hosting e teste **Primeiro acesso**.

## Observações

- A autenticação real não funciona simplesmente abrindo o HTML por duplo clique; use Firebase Hosting ou um servidor local.
- O e-mail técnico `reNUMERO@qap.local` é interno. O policial entra somente com RE e senha.
- O e-mail verdadeiro fica no perfil e é utilizado pela função segura de recuperação.
- A regra de dados exige usuário autenticado e ativo para consultar ou alterar `operacoes`.
