# Auditoria e correção do banco — Edital Sesc 2027

## Escopo e regra de segurança

Foram preservados os 210 registros e a estrutura de login/progresso/ranking. Questões incompletas continuam bloqueadas para treino e XP. A classificação temática automática abaixo serve como triagem; não equivale a validação humana do conteúdo nem substitui a conferência visual dos PDFs.

## Correções aplicadas

- Corrigido o registro da questão 20 da prova de 2017: o gabarito oficial a declara **ANULADA**. O item não recebe alternativa correta nem pontuação e permanece bloqueado.
- Corrigido o ano exibido para a prova cujo PDF se chama `PROVA-2022.pdf`: o próprio gabarito identifica o processo como **ano letivo 2023**. Os IDs internos foram mantidos para evitar quebrar referências antigas.
- Normalizados nomes das áreas para os quatro rótulos usados pelo edital atual.
- Classificadas questões de 2020 pelo conteúdo da tarefa, não apenas pelo texto contextual. Essas classificações ficam identificadas como inferidas e requerem validação visual.
- Removidos painéis de texto de apoio que pareciam ser alternativas extraídas por engano; resíduos de rodapé foram removidos quando reconhecíveis.
- Questões sem enunciado, com alternativas incompletas ou sem gabarito válido foram mantidas em revisão, sem pontuação.

## Estado do banco

- Registros totais: **210**.
- Status atual: **{'revisar': 177, 'validar_conferida': 33}**.
- Registros sem enunciado: **64**.
- Registros incompletos (enunciado/alternativas/gabarito): **82**.
- Painéis de apoio suspeitos removidos: **21**.
- Campos de alternativa higienizados: **17**.

### Registros por edição e área

| Edição conforme prova | Língua Portuguesa | Matemática | Ciências Humanas | Ciências da Natureza | Área não identificada |
|---|---:|---:|---:|---:|---:|
| 2017 | 10 | 10 | 5 | 5 | 0 |
| 2018 | 10 | 2 | 0 | 0 | 18 |
| 2020 | 10 | 10 | 5 | 5 | 0 |
| 2023 | 10 | 10 | 5 | 5 | 0 |
| 2024 | 10 | 10 | 5 | 5 | 0 |
| 2025 | 10 | 10 | 5 | 5 | 0 |
| 2026 | 10 | 10 | 5 | 5 | 0 |

## Lacunas e bloqueios que ainda exigem revisão humana

### Prioridade 1 — reconstruir registros incompletos

- **2018: 28 registro(s)** — questões: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30.
- **2020: 3 registro(s)** — questões: 21, 25, 26.
- **2023: 10 registro(s)** — questões: 1, 4, 5, 11, 14, 16, 18, 22, 29, 30.
- **2024: 14 registro(s)** — questões: 2, 4, 7, 9, 10, 12, 14, 16, 18, 23, 25, 27, 29, 30.
- **2025: 13 registro(s)** — questões: 2, 4, 6, 7, 9, 11, 13, 16, 19, 20, 23, 24, 30.
- **2026: 14 registro(s)** — questões: 2, 4, 5, 6, 9, 10, 16, 17, 18, 20, 21, 23, 24, 30.

A prova de 2018 é o principal problema de integridade: vários registros têm enunciados e/ou alternativas ausentes na versão estruturada. O OCR contém parte do conteúdo, mas a associação automática de trechos às questões não foi considerada suficientemente confiável para preencher os campos silenciosamente. Esses itens devem ser reconstruídos e conferidos visualmente antes de serem liberados.

### Prioridade 2 — cobertura temática preliminar do Anexo II

Os números abaixo são apenas candidatos encontrados por busca de palavras no texto extraído. Uma questão pode tratar de um tópico sem conter as palavras-chave e uma palavra-chave pode aparecer só no contexto. Por isso, os números **não devem ser lidos como cobertura confirmada**.

| Código do edital | Tópico | Questões candidatas | Edições |
|---|---|---:|---|
| POR-001 | Interpretação, tema, inferência e finalidade textual | 33 | 2017, 2020, 2023, 2024, 2025, 2026 |
| POR-002 | Narrativa, intertextualidade e linguagem verbal/não verbal | 6 | 2017, 2020, 2025 |
| POR-003 | Semântica e figuras de linguagem | 28 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |
| POR-004 | Gramática e norma-padrão | 6 | 2017, 2020, 2023 |
| MAT-001 | Conjuntos numéricos e divisibilidade | 5 | 2017, 2023, 2025 |
| MAT-002 | Razão, proporção, porcentagem e juros simples | 30 | 2017, 2020, 2023, 2024, 2025, 2026 |
| MAT-003 | Potências, notação científica e álgebra de 1º grau | 8 | 2020, 2023, 2024, 2025, 2026 |
| MAT-004 | Equações de 2º grau e funções | 6 | 2020, 2023, 2026 |
| MAT-005 | Medidas e geometria | 40 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |
| MAT-006 | Trigonometria e triângulo retângulo | 1 | 2020 |
| MAT-007 | Estatística, gráficos e análise combinatória | 23 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |
| HIS-001 | Industrialização, revoluções e globalização histórica | 9 | 2017, 2020, 2023, 2024, 2025, 2026 |
| HIS-002 | Brasil Colônia, escravidão, Segundo Reinado e República | 7 | 2020, 2023 |
| GEO-001 | Espaço geográfico, redes e transformações urbanas | 46 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |
| CIEN-001 | Seres vivos, corpo humano, saúde e ecologia | 31 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |
| CIEN-002 | Matéria, química, energia e cinemática | 31 | 2017, 2018, 2020, 2023, 2024, 2025, 2026 |

## Critérios de liberação para treino

Uma questão só deve passar para `validar_conferida` depois de conferir no PDF original: enunciado completo, cinco alternativas legíveis, gabarito, área e elementos visuais/textos de apoio. O banco atualmente não tem validação visual automatizada; por segurança, as questões com dados ausentes permanecem bloqueadas.

## Fontes de conferência

- Edital 2027, Anexo II (conteúdo programático), pp. 20–21.
- Provas e gabaritos originais disponíveis no diretório do projeto para as edições 2017, 2018, 2020, 2023, 2024, 2025 e 2026.
