# Firebase

Projeto: `project1ma` (plano gratuito Spark — sem custo, com cota diária
generosa, mais que suficiente pra uma turma).

## Configuração

`firebase-config.js` tem as chaves públicas do projeto (apiKey, authDomain
etc.) — isso **não é segredo**, quem protege os dados são as regras do
Firestore, não a apiKey escondida.

## Autenticação

- Método: e-mail/senha (Firebase Authentication).
- **Não existe tela de cadastro no site.** As duas contas de admin foram
  criadas manualmente no Firebase Console:
  - Eduardo Halas — UID `lKoiuGL5TEfkaDASCCSpl1227XC2`
  - Outra representante da turma — UID `V6ErJPAiS8QPU7ZKQqX4c1Io0nA3`
- Importante: o método e-mail/senha do Firebase permite auto-cadastro por
  padrão se alguém souber a apiKey (que é pública). Por isso as regras do
  Firestore **não confiam só em `request.auth != null`** — só as duas UIDs
  acima têm poder de admin, mesmo que outra pessoa crie uma conta nova.

## Regras de segurança (`firestore.rules`)

Arquivo local sempre reflete o que deveria estar publicado no Firebase
Console (Firestore Database → Regras). **Toda vez que esse arquivo muda,
é preciso colar o conteúdo novo lá e clicar em Publicar** — o arquivo
local sozinho não afeta o site em produção.

Resumo das regras atuais:

- `tarefas/{id}`: leitura pública; criar/editar/apagar só admin
  (valida que `materia`, `prazo`, `descricao` são strings não-vazias).
- `tarefas/{id}/comentarios/{id}`: leitura pública; qualquer um cria
  (valida nome/texto não-vazios e dentro do limite de tamanho); só admin
  apaga; edição sempre bloqueada.
- `duvidas/{id}`: leitura — admin vê tudo, público só vê as que já têm
  campo `resposta` preenchido; qualquer um cria (nome/duvida validados);
  só admin edita (responder) ou apaga.
- `versiculoComentarios/{dataAAAA-MM-DD}/mensagens/{id}`: mesma regra dos
  comentários de tarefa (leitura pública, qualquer um cria, só admin
  apaga). Agrupado por data — o "reset" diário do chat não é uma regra
  nem uma limpeza, é só o app sempre ler/escrever na subcoleção do dia de
  hoje; o dia seguinte usa outro caminho e começa vazio sozinho.
- `visitasDiarias/{dataAAAA-MM-DD}`: leitura pública; qualquer um
  cria/atualiza, mas só pode subir o campo `contagem` de 1 em 1 (regra
  compara com o valor atual) — ninguém consegue zerar ou pular pra um
  número qualquer; só admin apaga.
- `ideias/{id}`: leitura só admin (é uma caixa de sugestões, não um FAQ
  público como dúvidas); qualquer um cria (nome/ideia validados); só
  admin apaga.

Cuidado ao ajustar limites de tamanho (`size()`): no Firestore `.size()`
de string conta **bytes UTF-8**, não caracteres — acentos em português
ocupam 2 bytes cada. Os limites atuais já foram folgados pra não travar
texto legítimo por causa disso.

## Histórico de mudanças nas regras

Ver [HISTORICO.md](HISTORICO.md) pra saber quando/por que cada trecho das
regras mudou.
