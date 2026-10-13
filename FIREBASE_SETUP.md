# Firebase — Sesc Polo Educacional

## O que foi preparado
- Cadastro livre por e-mail/senha e login/logout via Firebase Authentication.
- Cloud Firestore com documento `users/{uid}` para o progresso de cada conta.
- Sincronização automática com atraso curto após alterações e gravação no logout.
- Exportação/importação local existente preservada.
- O progresso não é escrito no repositório GitHub; é armazenado no navegador como cópia local e no Firestore para a conta autenticada.

## Configuração necessária antes de testar
1. No Firebase Console, abra o projeto `sesc-polo-educacional`.
2. Authentication > Método de login: confirme E-mail/senha ativado.
3. Firestore Database > Regras: copie o conteúdo de `FIRESTORE_RULES.txt`, substitua as regras atuais e clique em Publicar.
4. Em Authentication > Configurações, confira os domínios autorizados. Ao publicar no GitHub Pages, adicione o domínio real `SEU-USUARIO.github.io` (sem `https://` e sem caminho) à lista de domínios autorizados, se não estiver lá.
5. Sirva o projeto por HTTP/HTTPS. Não abra `index.html` por `file://`.

## Estrutura Firestore
Cada usuário tem um documento `users/{uid}` com campos `state` e `updatedAt`. Não se deve guardar senhas no Firestore. O Firebase Authentication gerencia as credenciais.

## Segurança
As regras em `FIRESTORE_RULES.txt` permitem `get` do documento próprio e criação/atualização apenas do próprio documento. Não liberam listagem nem exclusão. Não publique regras permissivas.

## Primeiro login
Se houver progresso significativo salvo no navegador e a conta ainda não tiver documento na nuvem, o sistema pergunta se deseja migrar esse progresso para a conta. Se escolher não, inicia a conta com estado limpo. O progresso de uma conta existente é carregado da nuvem.

## Observação
A configuração do Firebase Web fica no código cliente. A API key web não é uma senha; a segurança depende das regras do Firestore e das configurações do Authentication. Não adicionar service-account keys, tokens privados ou senhas ao repositório.
