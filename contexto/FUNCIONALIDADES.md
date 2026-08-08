# Funcionalidades

## Mural (tarefas)

- Só admin loga com "Entrar como Admin" (e-mail/senha), aí aparece
  "+ Nova tarefa" e os controles de cada card (Feita / Editar / Apagar).
  Todo mundo (sem login) só vê e comenta.
- Tarefa tem: matéria (lista fixa, ver `SUBJECTS` em `app.js`), prazo
  (data), descrição, link opcional.
- Cards mostram badge de urgência: "Vence hoje", "Vence amanhã",
  "Faltam N dias". **Tarefa vencida (prazo já passou) some sozinha do
  mural** — não existe mais badge "Atrasada" (pedido do usuário); a tarefa
  não é apagada do Firestore, só deixa de ser renderizada pra todo mundo
  (inclusive admin) enquanto o prazo estiver no passado.
- Seções por matéria no mural são ordenadas pela tarefa mais urgente de
  cada matéria (quem tem menos tempo até o prazo aparece no topo).
- Filtro por matéria (chips no topo).
- Comentários por tarefa: botão "💬 Comentários" abre um chat daquela
  tarefa; qualquer um comenta (pede nome antes, salva no navegador pra
  não pedir de novo); só admin apaga comentário.

## Mérito

- Escolhe itinerário (Humanas ou Exatas) — isso muda quais matérias
  extras aparecem no grid de notas.
- Digita a nota de cada matéria (fica salvo no navegador, `localStorage`).
- Calcula a média automaticamente, **arredondada pro 0,5 mais próximo**
  (ex: 9,45 vira 9,5; 8,95 vira 9,0 — é assim que a escola do usuário
  arredonda o boletim) antes de comparar com os níveis: **Diamante** (💎)
  se ≥9,5, **Ouro** (🥇) se 9,0–9,4, senão nenhum nível ainda.
- "Aviso" e "Simulados" não entram no Mérito — Aviso porque não é
  matéria com nota, Simulados hoje conta normal (está em `SUBJECTS`).
  **Literatura também não entra no Mérito** (pedido do usuário) — mas
  continua valendo no Mural normalmente, só não é cobrada nessa média.
  "Projeto Integrador de Linguagens e suas Tecnologias" foi removido de
  vez (não existe mais em lugar nenhum, nem Mural nem Mérito).

## Dúvidas

- Formulário público: nome + dúvida.
- Visitante comum só vê as dúvidas **já respondidas** (pergunta + resposta),
  numa lista "Perguntas já respondidas" — funciona como mini FAQ.
- Admin vê **todas** as dúvidas (respondidas ou não) numa caixa de entrada,
  cada uma com um campo pra responder (ou atualizar a resposta) e um botão
  de apagar.
- Não existe notificação — quem perguntou precisa voltar na aba Dúvidas
  pra ver se já foi respondido (não há sistema de conta/login de aluno).

## Ideias

- Mesmo mecanismo das Dúvidas, mas mais simples: **caixa de sugestões**
  só pro admin ler — não tem resposta nem lista pública.
- Formulário público: nome + ideia.
- Só o admin vê as ideias enviadas (numa caixa de entrada, com botão de
  apagar cada uma); visitante comum só vê o formulário de envio.

## Enquetes

- **Só o admin cria** uma enquete (botão "+ Nova enquete"): pergunta +
  lista de opções (mínimo 2, máximo 6, com botões pra adicionar/remover
  linha no formulário).
- **Qualquer um vota** — clica numa opção, o voto conta na hora. Depois
  de votar, aquela enquete vira um gráfico de barras com porcentagem e
  contagem por opção (a opção escolhida fica marcada com ✓); antes de
  votar, aparecem só os botões das opções.
- Um voto por pessoa por enquete, guardado no navegador (não é ligado a
  conta/login).
- **Se não tiver nenhuma enquete criada ainda, mostra "Nenhuma enquete
  ainda."** em vez de uma lista vazia.
- Admin também pode apagar uma enquete (some pra todo mundo).

## Horário

- Tabela fixa (não vem do Firestore, é HTML estático) com o horário da
  turma 1MA a partir de 21/07. Pra mudar, edita a tabela direto no
  `index.html` (seção `#horarioSection`).

## Versículo do dia

- `versiculos.json` na raiz tem uma lista de versículos (referência + texto).
- A cada dia, o site escolhe um verso diferente por conta própria
  (`diaDoAno % quantidadeDeVersos`), sem precisar de backend nem de
  ninguém trocar manualmente.
- **💬 Chat do dia** — qualquer um comenta sobre o versículo de hoje (pede
  nome, mesmo campo salvo no navegador que os comentários de tarefa usam);
  só admin apaga comentário. Quando o dia vira e o versículo muda, o chat
  **reseta sozinho** — as mensagens ficam guardadas por data no Firestore,
  então o chat de um novo dia já nasce vazio (nada é apagado de propósito,
  só nunca mais aparece).

## Tradutor

Trazido do projeto separado `audioT` (tradutor por voz/texto do Eduardo,
que lá tem um backend Python/Flask) pra virar uma seção do mural, 100%
client-side (sem Firebase, sem servidor próprio) — replica o `audioT`
original quase por completo, incluindo o Mundo Aberto (mapas/lagoa/zoo/
castelo — tinha sido excluído no port inicial por pedido do usuário, e
depois voltou a pedido dele mesmo, ver item 26 do HISTORICO.md):

- Traduz texto entre **34 idiomas** (mesma lista do `audioT`), com opção
  "Detectar automaticamente" pra origem, botão de trocar origem/destino
  e **📌 fixar idioma** (o idioma de destino escolhido sobe pro topo dos
  dois selects, salvo no navegador).
- **Falar/transcrever** — botão 🎤 grava a voz e transcreve pro campo de
  texto (Web Speech API do navegador), depois traduz automaticamente. Um
  slider ao lado (5–30s, igual ao projeto antigo) controla por quanto
  tempo o microfone fica aberto — o reconhecimento fica escutando o
  tempo todo (não corta na primeira pausa de silêncio). **Só funciona
  bem no Google Chrome e no Microsoft Edge de verdade** — não basta ser
  "baseado em Chromium": Opera, Brave, Vivaldi etc. não têm a chave de
  API do Google que o `SpeechRecognition` do navegador depende, e falham
  (geralmente com erro `network`, ou o microfone nem chega a ligar) —
  confirmado testando na prática (Opera falhava, Chrome funcionou).
  Firefox e Safari nem implementam `SpeechRecognition`; nesses (e no
  Opera/Brave/Vivaldi) o botão só avisa em vez de travar sem explicação.
- **Áudio da tradução toca sozinho** assim que a tradução termina, com a
  voz REAL do Google Tradutor (mesma qualidade do projeto antigo) —
  gerada por uma Netlify Function (`netlify/functions/tts.js`) que faz o
  mesmo pedido que a lib `gTTS` faz por baixo dos panos (o navegador
  sozinho não consegue: a resposta do Google não libera CORS). Se a
  function não estiver disponível (ex: testando local sem Netlify),
  cai pro endpoint público antigo direto (2 tentativas) e, por último,
  pra voz do navegador (só fala se achar uma voz de verdade instalada
  pra aquele idioma; sem achar, ainda assim tenta, só avisando que pode
  sair errado — nunca fica mudo). Botão 🔊 pra repetir e **🐢 Devagar**
  pra ouvir mais devagar — devagar de verdade (sintetizado pelo Google)
  quando vem da function, ou só `playbackRate` reduzido nos fallbacks.
- **Modo Papagaio** — switch que muda o que o botão Falar faz: em vez de
  traduzir, repete de volta a fala reconhecida no idioma de ORIGEM
  (prática de pronúncia/eco, sem tradução).
- **Copiar** (📋) e **Favoritar** (☆/⭐) a tradução atual.
- **📜 Histórico de Traduções** — todo texto traduzido fica registrado
  (localStorage, últimas 200), visível numa lista simples.
- **⭐ Favoritos** — lista guardada no `localStorage` do navegador (não
  tem backend pra um favoritos.csv como no `audioT`); dá pra reabrir um
  favorito direto na tela principal do tradutor.
- **🎴 Flashcards** — estuda os favoritos: carta com a palavra original,
  toca pra virar e ver a tradução, navega com anterior/próxima.
- **📅 Palavra do Dia** — sorteia (com semente determinística pela data
  de hoje, igual ao `audioT`) uma palavra do dicionário e traduz; muda
  só à meia-noite.
- **📖 Vocabulário** — editor de palavras do quiz por dificuldade
  (adicionar/remover); como não tem servidor pra reescrever
  `dicionario.json`, as edições ficam num "overlay" no `localStorage`
  por cima da lista base.
- **🧠 Quiz de Vocabulário** — escolhe dificuldade (🟢 Fácil / 🟡 Médio /
  🔴 Difícil, mesmas listas de palavras do `audioT/dicionario.json`),
  pede um nome, 10 perguntas de múltipla escolha (palavra em português,
  3 opções de tradução, 2 delas erradas).
- **⏱️ Quiz Contra o Tempo** — mesmas perguntas do quiz de vocabulário,
  mas com um cronômetro visual por pergunta (5/10/15s à escolha); tempo
  esgotado conta como erro.
- **🎤 Quiz de Pronúncia** — mesma escolha de dificuldade, mas em vez de
  escolher a tradução, o site mostra a palavra traduzida e pede pra
  falar (mic); compara o que foi dito com a palavra alvo (tolerando
  pequenas diferenças) e marca certo/errado.
- **📄 Quiz de Texto** — sorteia um parágrafo (`audioT/textos_quiz.json`,
  por dificuldade), traduz inteiro, pede pra ler em voz alta e destaca
  palavra por palavra (verde/vermelho) o que bateu com o que foi dito,
  com uma porcentagem final. Como não dá pra saber de antemão quanto
  tempo alguém leva pra ler um parágrafo, o microfone fica escutando até
  a pessoa mesma tocar em "⏹ Parar e conferir" (só um teto de 2 minutos
  de segurança). **Cada palavra do resultado é clicável** — toca numa
  palavra (certa ou errada) e abre um popup com a tradução dela pro
  português, botão pra ouvir a pronúncia, copiar e favoritar.
- **🏆 Histórico do Quiz** — ranking (top 5) do Quiz de Vocabulário +
  últimos resultados dos outros três modos de quiz, tudo no
  `localStorage`.
- **🗑️ Limpar Históricos** — apaga histórico de traduções e de todos os
  quizzes (pede confirmação; não mexe nos favoritos, igual ao `audioT`).
- Tradução usa uma chamada direta do navegador ao serviço público do
  Google Tradutor (mesmo mecanismo não-oficial da lib `googletrans`) —
  funciona em qualquer hospedagem estática (Netlify Drop incluso), sem
  precisar de servidor.
- **🌍 Mundo Aberto** — trazido de volta a pedido do usuário (tinha sido
  excluído no port inicial). Mini-jogo de exploração top-down: escolhe um
  dos 3 mapas (🏠 Casa, 🦁 Zoo, 🏰 Castelo), anda com WASD/setas (com
  colisão de verdade contra paredes/móveis/obstáculos de cada mapa) e
  aperta **E** perto de um objeto/animal pra abrir um popup com a
  tradução dele pro idioma de destino atual, pronúncia automática,
  favoritar e copiar (reaproveita o mesmo popup do clique de palavra do
  Quiz de Texto). No mapa do Zoo, chegar perto da água mostra um botão
  "Ver lagoa (**R**)" que abre uma tela cheia com a lagoa ampliada e 4
  bichos marinhos clicáveis (polvo, raia, tubarão, peixe). Não é um quiz
  com pontuação — é só um jeito lúdico de "passear" vendo vocabulário.
  **No visual celular**, os controles mudam: aparece um **analógico** no
  canto (arrasta o dedo pra andar, no lugar do WASD/setas) e um **botão
  de toque contextual** com ícone de dedo (👆) no lugar das teclas E/R —
  mostra "Interagir" ou "Ver lagoa" dependendo do que estiver por perto.
  A tela do jogo (e a da lagoa) também **força modo paisagem** — o
  conteúdo gira deitado mesmo com o celular na posição vertical, pra
  aproveitar melhor o espaço (o mapa é bem mais largo que alto). A barra
  de cima (título/dica/botão de sair) continua sempre normal, sem virar
  — e o popup de tradução que abre ao interagir com um objeto/animal
  também gira junto (só nesse caso; o popup do Quiz de Texto continua
  normal).

## Tema e visual

- **🎨 Paleta de cores** — portado do "personalizar paleta" que existia no
  tradutor antigo (`audioT`), agora valendo pro **mural inteiro**
  (substituiu o switch simples de claro/escuro). 3 opções lado a lado no
  cabeçalho: ☀️ Dia, 🌙 Noite (padrão) e 🎨 Personalizado — o `audioT`
  original tinha mais 4 temas prontos (Frio/Deserto/Tundra/Céu), mas o
  usuário pediu só esses 3. O botão 🖌️ ao lado abre um editor com 10
  seletores de cor (fundo, cartão, texto, destaque etc.) que aplicam na
  hora e salvam sozinhos — dá pra montar uma paleta 100% sua. Um botão
  "🔄 Redefinir cores" volta o personalizado pra uma paleta neutra
  preto/branco/cinza. Escolha salva no navegador, continua igual na
  próxima visita.
- Switch de visual "computador" (💻) / "celular" (📱) — força o layout
  independente do tamanho real da tela; se a pessoa nunca mexeu no
  switch, o site se adapta sozinho ao tamanho da janela.

## Identidade visual

- Logo da escola como marca d'água nas laterais em telas largas.
- "Feito por Eduardo Halas" fixo num canto da página.
- **👁️ Contador de visitas de hoje** ao lado do crédito — soma 1 por
  navegador por dia (não conta refresh repetido da mesma pessoa), guardado
  no Firestore por data (`visitasDiarias/AAAA-MM-DD`); reseta sozinho
  todo dia, mesma ideia do chat do versículo.
