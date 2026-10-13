# Atualização: Banco de Questões + Ranking Global

## Conteúdo adicionado
- Aba **Questões** com filtro por ano e área, correção automática e métricas individuais.
- +10 XP por questão respondida corretamente pela primeira vez.
- Aba **Ranking** que exibe apelido, XP, acertos e carro equipado.
- Arquivo `database/banco-questoes.json` com registros das provas e gabaritos fornecidos.
- `FIRESTORE_RULES_COMPLETAS.txt` com regras necessárias para progresso individual e leitura/publicação do perfil público do ranking.
- `REVISAO_BANCO_QUESTOES.md` com limitações de extração e contagem dos itens para revisão.

## Antes de testar
1. Faça uma cópia de segurança da pasta atual.
2. No Firebase Console, abra Firestore Database → Rules, confira o projeto `sesc-polo-educacional` e publique o conteúdo de `FIRESTORE_RULES_COMPLETAS.txt`.
3. Não apague os documentos `users/{uid}` existentes: o progresso atual é preservado pela estrutura da aplicação.
4. Abra `index.html` por Live Server ou publique a pasta em GitHub Pages.
5. Entre com duas contas diferentes e confira que ambas aparecem no ranking, cada uma com seu XP, apelido e carro selecionado.

## Observações
- Não há progresso pessoal dos alunos salvo no GitHub; o progresso fica no Firestore, por conta.
- Os PDFs não são incluídos nesta pasta; apenas os registros de questão extraídos.
- O banco contém extração automática. Consulte `REVISAO_BANCO_QUESTOES.md` antes de tratar o material como definitivo.
- A exclusividade transacional de carros raros e a validação anti-fraude do XP no servidor ainda não fazem parte desta entrega.
