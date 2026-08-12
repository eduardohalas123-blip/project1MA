# Arquitetura

## Stack

- HTML/CSS/JS puro no front, sem framework, sem build step.
- `app.js` é carregado como ES module (`<script type="module" src="app.js">`),
  por isso **precisa rodar via servidor HTTP** (não abre direto com
  duplo-clique / `file://`, os `import` quebram).
- Firebase SDK modular v10.13.0, importado direto via URL do CDN
  (`https://www.gstatic.com/firebasejs/10.13.0/firebase-*.js`) dentro do
  próprio `app.js` — sem npm, sem bundler.
- Uma exceção ao "sem backend": `netlify/functions/tts.js` é uma Netlify
  Function (Node.js) — só ela roda servidor de verdade, e só pra gerar a
  voz do Tradutor. Ver seção "Netlify Function: voz do Tradutor" abaixo.
- Outras dependências via CDN (sem npm/bundler, mesmo padrão do Firebase):
  Google Fonts (Manrope/Inter, `<link>` no `<head>`) e Twemoji
  (`twemoji.min.js`, script clássico carregado antes do `app.js` no fim
  do `<body>`) — usado só pra desenhar os emojis das matérias no Mural
  como `<img>` flat em vez do emoji nativo do sistema (que no Windows
  vem com um fundo "sticker" quadrado colorido, embutido no próprio
  glifo da fonte - não dá pra tirar com CSS). Ver `emojiForSubject()` e
  a chamada `window.twemoji.parse(...)` em `app.js`, e HISTORICO.md
  item 42.

## Dados (Firestore)

```
tarefas/{taskId}
  materia: string
  prazo: string (YYYY-MM-DD)
  descricao: string
  link: string | null
  concluida: boolean
  criadoEm: timestamp

tarefas/{taskId}/comentarios/{comentarioId}
  nome: string
  texto: string
  criadoEm: timestamp

duvidas/{duvidaId}
  nome: string
  duvida: string
  criadoEm: timestamp
  resposta: string (só existe depois que o admin responde)
  respondidoEm: timestamp (idem)

versiculoComentarios/{dataAAAA-MM-DD}/mensagens/{mensagemId}
  nome: string
  texto: string
  criadoEm: timestamp

visitasDiarias/{dataAAAA-MM-DD}
  contagem: number

ideias/{ideiaId}
  nome: string
  ideia: string
  criadoEm: timestamp

enquetes/{enqueteId}
  pergunta: string
  opcoes: string[]
  votos: { "0": number, "1": number, ... }  (mapa, uma chave por índice de opcoes)
  criadoEm: timestamp
```

Ver regras de acesso completas em [FIREBASE.md](FIREBASE.md).

## Estado local (sem Firestore)

Guardado em `localStorage`, só no navegador de cada pessoa:

- `theme` — nome do tema ativo: "dia" ou "noite"
- `viewMode` — "mobile" ou "desktop" (visual forçado)
- `meritoGrades` — notas digitadas no Mérito (JSON por matéria)
- `meritoItinerario` — "humanas" ou "exatas"
- `commentName` — último nome usado pra comentar (autopreenche o campo)

## `app.js` — mapa das seções do arquivo

1. **Matérias e cores** — `SUBJECTS` (15 matérias fixas), `MURAL_ONLY_CATEGORIES`
   (hoje só "Aviso" — aparece no Mural mas não no Mérito),
   `getMuralSubjectList()`, `colorForSubject()`.
2. **Elementos** — objeto `el` com todas as referências de DOM usadas no arquivo.
3. **Paleta de tema** — só "dia" e "noite" (`:root[data-theme="dia|noite"]`
   em style.css, blocos estáticos de ~15 variáveis CSS cada). Alternados
   pelo toggle animado de céu no cabeçalho (`#temaCeuToggle`, ver item 45
   do HISTORICO.md). `aplicarTema(nome)` seta `data-theme` e sincroniza o
   `aria-checked` do toggle. Existiu um modo "personalizado" (paleta
   editável por `<input type="color">`, portado do `audioT` original) —
   removido a pedido do usuário em 2026-08-11 (HISTORICO.md) por ser
   redundante com os dois temas prontos.
4. **Visual PC/celular** — switch que seta `data-view` no `<html>`, força
   layout via CSS (`:root[data-view="mobile"|"desktop"]`); se a pessoa nunca
   escolheu manualmente, acompanha o tamanho real da janela via `resize`.
   Desde o redesign de 2026-08-10 (HISTORICO.md item 36), esse toggle
   manual **não é mais a única fonte de responsividade**: `style.css` e
   `tradutor.css` também têm `@media (max-width: 860px)` reais, que reagem
   à largura física da janela independente do `data-view` — cobre telas
   estreitas (tablet, notebook com janela pequena) que ficariam presas no
   layout desktop antes disso. As regras de sidebar-vira-barra-horizontal
   aparecem duplicadas (uma vez em `@media`, uma vez em
   `:root[data-view="mobile"]`) de propósito: a primeira cobre qualquer
   tela física estreita, a segunda cobre o preview manual do visual
   celular numa tela larga. **Pegadinha de flexbox pra lembrar**: qualquer
   elemento com `max-width` + `margin: 0 auto` dentro de um flex container
   (`.app-shell`, `.header-actions`) precisa também de `width: 100%`
   explícito — sem isso, margem automática desliga o `stretch` padrão do
   flexbox e o elemento se dimensiona pelo conteúdo (shrink-to-fit) até o
   teto do `max-width`, ignorando o espaço real disponível (foi assim que
   a tabela do Horário "esticava" o `.app-viewport` pra 420px numa tela de
   390px). E qualquer regra que force `display` numa classe genérica tipo
   `.btn` precisa do `:not([hidden])`, senão sobrescreve o `[hidden]` da
   UA stylesheet e reexibe botões que deveriam estar escondidos.
5. **Navegação lateral** — `trocarSecaoAtiva()` troca qual `.app-section`
   fica visível (`hidden` liga/desliga na hora); a animação de entrada é só
   o fade+leve subida que já existe em CSS (`.app-section` com
   `@starting-style`, item 43 do HISTORICO.md). Existiu uma "revelação
   circular" (`clip-path` crescendo a partir do item clicado, item 47) —
   **removida no item 51**: mantinha as duas seções (antiga/nova) visíveis
   ao mesmo tempo por ~0.65s, e um re-render do Mural nessa janela
   (Firestore reconectando) ficava visível e parecia a página travando/
   recarregando (item 50). O fade simples nunca sobrepõe duas seções, imune
   a esse problema por construção. Ver também item 49 — um sistema de
   "revelação ao rolar" (`[data-reveal]`/`IntersectionObserver`) também foi
   tentado e removido, por interagir mal com a revelação circular (que já
   não existe mais de qualquer forma).
6. **Versículo do dia** — `fetch("versiculos.json")`, escolhe pelo dia do ano.
7. **Mérito** — grid de notas dinâmico por itinerário, cálculo de média.
   `getMeritoSubjectNames()` monta a lista a partir de `SUBJECTS` +
   `MERITO_EXTRA_COMUNS` + matérias do itinerário, **menos**
   `MERITO_MATERIAS_EXCLUIDAS` (hoje só `["Literatura"]"` — conta no
   Mural, não entra no Mérito). `computeMerito()` arredonda a média pro
   0,5 mais próximo (`Math.round(avgBruta * 2) / 2`) antes de comparar
   com os níveis Diamante/Ouro e de exibir — é assim que a escola do
   usuário arredonda o boletim.
8. **Modais** — abrir/fechar genérico (login, tarefa, comentários).
9. **Datas** — parse local, badge de urgência (vence hoje / faltam N dias).
   `isTarefaVencida(task)` (usa `dueBadge()` por baixo) é o filtro que
   tira tarefa com prazo passado do que é renderizado — ver item 12.
10. **Estado global** — `allTasks`, `isAdmin`, `activeFilter`, `editingTaskId`, `db`, etc.
11. **Filtro por matéria** — chips no topo do Mural. Só conta tarefa não
    vencida (`!isTarefaVencida(t)`) pra decidir quais chips aparecem.
12. **Renderização do Mural** — `renderBoard()`: filtra tarefas vencidas
    (`!isTarefaVencida(t)`) antes de qualquer outra coisa — elas nunca
    chegam a virar card, pra ninguém (nem admin) ver o badge "Atrasada".
    O resto segue igual: agrupa por matéria, ordena as seções pela tarefa
    mais urgente do grupo (menos tempo até o prazo primeiro), dentro do
    grupo ordena por prazo com concluídas por último.
13. **Formulário de tarefa** — abrir/editar/resetar, `toggleDone`, `handleDelete`.
14. **Dúvidas** — `buildReplyForm()`, `renderDuvidas()` (inbox admin, sempre
    com form de resposta), `renderDuvidasPublicas()` (só as respondidas,
    visível pra todo mundo), dois listeners separados (admin vs público)
    trocados no `onAuthStateChanged`.
14b. **Ideias** — cópia simplificada de Dúvidas (mesmo componente visual
    `.duvida-card`/`.duvida-list`, reusa `formatDuvidaDate()`): sem campo
    de resposta e sem lista pública, já que é uma caixa de sugestões
    (`ideias/{id}`) só pro admin ler. `renderIdeias()`/
    `startIdeiasListener()`/`stopIdeiasListener()`, um único listener
    (não dois como Dúvidas, não existe versão "pública" aqui).
14c. **Enquetes** — `votos` é um mapa (não array) de propósito: permite
    incrementar atomicamente só a chave da opção votada via
    `updateDoc(ref, { [\`votos.${indice}\`]: increment(1) })` (dot-path
    em campo de mapa é suportado pelo Firestore; em array não dá pra
    fazer isso). Um voto por pessoa por enquete é controlado 100%
    client-side (`localStorage.enqueteVotos`, um JSON `{enqueteId:
    indiceEscolhido}`) — não é à prova de gente limpando o navegador,
    mesmo nível de confiança do resto do site. `renderEnquetes()` decide
    por enquete, individualmente, se mostra os botões de opção (ainda
    não votou) ou o resultado em barra (já votou) - por isso é comum uma
    pessoa ver botão numa enquete e resultado em outra na mesma tela.
    Formulário de criar (só admin) tem opções dinâmicas
    (`criarLinhaOpcaoEnquete()`, mínimo 2 sempre, botão "✖" por linha só
    remove se sobrarem mais de 2). Regra do Firestore trava a
    atualização de voto pra não poder mudar `pergunta`/`opcoes`, só o
    mapa `votos` (mas não valida que o incremento é exatamente +1, como
    faz `visitasDiarias` - mapear "só uma chave de um mapa dinâmico subiu
    1" em regra do Firestore é bem mais complexo que o caso simples do
    contador de visitas; aceitável pro nível de confiança do site).
15. **Comentários por tarefa** — subcoleção, listener aberto ao abrir o modal,
    fechado ao fechar.
15b. **Chat do versículo do dia** — `chaveDataVersiculo()` monta a chave
    `AAAA-MM-DD` de hoje (data local, mesmo formato usado na Palavra do
    Dia do Tradutor); `iniciarChatVersiculo()` assina
    `versiculoComentarios/{data}/mensagens` com `onSnapshot` (chamado
    quando `db` fica pronto e de novo em todo `onAuthStateChanged`, pra
    atualizar os botões "Apagar" quando o admin loga/desloga).
    `renderVersiculoChat()` reusa as mesmas classes CSS dos comentários
    de tarefa (`.comment-item`, `.comment-form`, etc.) — sem modal, fica
    direto na seção Versículo. Não existe "resetar o chat": a chave muda
    de data sozinha à meia-noite, então o chat de um novo dia começa
    vazio (mensagens antigas continuam no Firestore, só nunca mais são
    lidas).
16. **Tradutor** — porta a parte central do projeto separado `audioT`
    (que lá roda em cima de um backend Python/Flask +
    `googletrans`/`gTTS`/`speech_recognition`) pra 100% client-side, sem
    nenhum backend próprio:
    - `IDIOMAS_TRADUTOR` (34 idiomas, portado de `audioT/idiomas.py`) +
      `LOCALE_VOZ_TRADUTOR` (mapa código de 2 letras → BCP-47, tipo
      `pt`→`pt-BR`, exigido pelas Web Speech APIs).
    - `traduzirTexto()`/`traduzirComCache()` chamam direto (via `fetch`) o
      endpoint público do Google Translate
      (`translate.googleapis.com/translate_a/single?client=gtx`) — mesmo
      mecanismo não-oficial da lib Python `googletrans`. Cache em
      `Map` (`cacheTraducaoTradutor`) evita re-traduzir a mesma
      palavra/idioma no quiz.
    - `tocarTTS()` toca a voz REAL do Google Tradutor apontando um
      `<audio>` direto pro endpoint público de voz
      (`translate.google.com/translate_tts?...&client=tw-ob`, o mesmo
      que a lib `gTTS` usa) — funciona sem CORS porque é o elemento
      `<audio>` carregando a URL (feito só de leitura de bytes via
      `fetch`/XHR precisaria de CORS; tocar mídia não). Texto longo
      (>200 caracteres, limite do endpoint) cai pro fallback
      `falarComVozNavegador()` (`SpeechSynthesis` nativo).
    - `reconhecerFala()` envolve `SpeechRecognition`/
      `webkitSpeechRecognition` numa Promise — só existe em navegadores
      Chromium (Chrome/Edge); `reconhecimentoDeVozSuportado()` faz
      feature-detection antes de usar, com aviso em vez de travar nos
      outros navegadores.
    - Botão Falar (`tradFalarBtn`): reconhece fala → se "Modo Papagaio"
      (`tradPapagaio`) estiver ligado, só ecoa a fala de volta no idioma
      de ORIGEM via `tocarTTS()` (prática de pronúncia, sem traduzir);
      senão, preenche o campo e traduz.
    - Favoritos: sem backend pra um `favoritos.csv` como no `audioT`,
      então viram uma lista no `localStorage`
      (`TRAD_FAVORITOS_KEY = "tradutorFavoritos"`, array de
      `{original, traduzido, origem, destino}`), com CRUD simples
      (`lerFavoritosTradutor`/`salvarFavoritosTradutor`/etc.) e um modal
      de listagem que também recarrega o favorito na tela principal.
    - Flashcards: usa os mesmos favoritos do `localStorage` (igual ao
      `audioT`, que também monta os flashcards a partir dos favoritos).
    - Quiz de Vocabulário/Pronúncia: `tradutor-dicionario.json` (cópia de
      `audioT/dicionario.json`, dict `facil`/`medio`/`dificil`) —
      `montarQuizVocabularioTradutor()`/`montarQuizPronunciaTradutor()`
      reimplementam em JS a lógica de `obter_quiz()`/`obter_quiz_pronuncia()`
      de `audioT/backend.py`: amostra palavras, traduz em paralelo
      (`Promise.all`), filtra traduções inválidas/sem-efeito, monta 10
      perguntas com 2 distratores cada (vocabulário) ou até 10 pares
      pt/traduzido pra falar (pronúncia). A comparação de pronúncia usa
      `similaridadeTradutor()` (distância de Levenshtein normalizada,
      aproximando o `difflib.SequenceMatcher.ratio()` do Python).
    - Idiomas fixados (📌): `TRAD_FIXADOS_KEY` no `localStorage`,
      `popularSelectIdiomas()` reordena os fixados pro topo dos dois
      selects toda vez que é chamada.
    - Devagar (🐢): sem servidor pra sintetizar palavra-por-palavra em
      `slow=True` como o `audioT`, `tocarTTS(texto, idioma, devagar)`
      simplesmente toca o mesmo `<audio>` com `playbackRate = 0.6`.
    - Histórico de traduções (📜): `TRAD_HISTORICO_KEY`, array de pares
      `[original, traduzido]` no `localStorage` (últimas 200),
      registrado a cada tradução bem-sucedida dentro de
      `executarTraducao()`.
    - Editor de vocabulário (📖): `TRAD_VOCAB_OVERLAY_KEY` guarda
      `{adicionadas, removidas}` por dificuldade; `obterDicionarioEfetivoTradutor()`
      mescla isso por cima da base (`tradutor-dicionario.json`) toda vez
      que algo precisa da lista de palavras — quiz de vocabulário, quiz
      de pronúncia e palavra do dia usam essa versão "efetiva", nunca a
      base crua diretamente.
    - Palavra do dia (📅): `mulberry32Tradutor()` (RNG determinístico)
      semeado por um hash da data de hoje — mesma ideia do
      `random.Random(data_de_hoje)` do `audioT`, só que sem precisar de
      estado no servidor.
    - Quiz Contra o Tempo (⏱️): reaproveita `montarQuizVocabularioTradutor()`
      (mesmas perguntas/distratores do Quiz de Vocabulário) e soma um
      cronômetro visual por pergunta (`setInterval` atualizando a largura
      de uma barra); tempo esgotado conta como erro automaticamente.
    - Quiz de Texto (📄): `tradutor-textos-quiz.json` (cópia de
      `audioT/textos_quiz.json`) fornece o parágrafo; a avaliação usa
      `lcsPalavrasTradutor()` (LCS entre as palavras do alvo e as
      reconhecidas) pra aproximar tanto a porcentagem quanto o
      `get_opcodes()`/destaque certa-errada do
      `difflib.SequenceMatcher` que o `audioT` usa no Python. Cada
      palavra do resultado ganha `.trad-palavra-clicavel` +
      `addEventListener("click", ...)`: `limparPalavraCliqueTradutor()`
      tira pontuação colada, `abrirPopupPalavraTradutor()` traduz a
      palavra (que está no idioma de destino) de volta pro português via
      `traduzirTexto()` e abre `#tradPopupPalavraModal`
      (`renderizarPopupPalavraTradutor()` reusa as classes
      `.trad-palavra-dia-*` já criadas pra Palavra do Dia) com botões de
      ouvir/copiar/favoritar — mesma ideia do popup de palavra que o
      `audioT` original já tinha no quiz de texto longo.
    - **🌍 Mundo Aberto**: mini-jogo de exploração portado quase 1:1 do
      `audioT` original (`static/app.js` linhas ~1696-2168 de lá).
      `mundo-mapas.json` (na raiz do projeto) tem toda a geometria dos 3
      mapas (retângulos de área caminhável/parede/obstáculo/objeto
      interativo, ponto de spawn, zona da lagoa) — foi **gerado uma vez**
      por um scriptzinho Python que importa `audioT/mundo_dados.py`
      direto e faz `json.dump` (evita transcrever à mão os ~140
      retângulos de colisão do Castelo). As 10 imagens
      (mapas/sprites do personagem/badge do "E") vieram de
      `audioT/static/imagesmap/` pra `imagesmap/` na raiz daqui (~7,9MB).
      No `audioT` original essa geometria vinha de um endpoint Flask
      (`/api/mundo/mapas`); aqui é só um `fetch("mundo-mapas.json")` —
      mesmo padrão dos outros dados do tradutor. O motor do jogo em si
      (`iniciarMundo()`) sempre foi 100% client-side no `audioT` (só a
      geometria vinha do servidor), então o loop de colisão/desenho em
      canvas (`setInterval(30ms)`, testa X/Y separado pra "deslizar" em
      paredes, `mundoDistanciaAteCaixa()` pra achar objeto/lagoa mais
      próximos) foi portado quase sem mudança nenhuma — só trocou
      `el(id)`/`.oculto` (helpers do `audioT`) por `tradEl.x`/`.hidden`
      (convenção daqui) e os 3 pontos que chamavam o backend Flask
      (mapa, tradução do objeto, TTS, favoritos) por funções que já
      existiam no tradutor do mural (`traduzirTexto()`, `tocarTTS()`,
      `renderizarPopupPalavraTradutor()`/`favoritoExisteTradutor()`) — o
      popup de objeto (tecla E ou clique num bicho da lagoa) reusa o
      mesmo `#tradPopupPalavraModal` do Quiz de Texto, só que traduzindo
      na direção contrária (pt → idioma de destino atual, com áudio
      tocando sozinho ao abrir, igual ao comportamento original). O jogo
      e a tela da lagoa (`#mundoJogoOverlay`/`#lagoaOverlay`) não usam a
      classe `.modal-overlay` de propósito — são telas cheias com
      teclado, e o atalho global de Esc fecha todo `.modal-overlay`
      aberto sem rodar a limpeza do jogo (parar o `setInterval`, tirar os
      listeners de tecla), então usar essa classe ali vazaria o loop
      rodando escondido.
    - **Controles de toque / paisagem forçada no visual celular** (pedido
      do usuário depois de ver o jogo funcionando): no `:root[data-view=
      "mobile"]`, só o *conteúdo* do jogo gira 90° (`#mundoJogoRotacionavel`,
      que embrulha canvas + analógico + botão de interagir) — a barra de
      cima (título/dica/✖) fica de fora da rotação de propósito, senão o
      texto ficaria de lado e ilegível. Mesma ideia pra lagoa
      (`#lagoaImagemWrap` gira, `.lagoa-topo` não). `ajustarRotacaoMundo()`
      calcula o tamanho/posição via `getBoundingClientRect()` da área
      disponível (não `100vh`/`100vw` do CSS — viewport units podem não
      bater com o espaço visual real, tipo quando a barra de endereço do
      navegador mobile aparece/some), e é chamado nas duas telas
      (`comecarJogo()`/`abrirLagoa()`) e de novo em cada `resize` enquanto
      o jogo está aberto.
      **Pegadinha da rotação** (perdi um tempo com isso, documentando pra
      não repetir): como só o miolo gira e não a tela toda, as posições
      `left/top/right/bottom` do analógico e do botão de toque, escritas
      no CSS, são coordenadas *locais* (antes de girar) — elas não
      correspondem ao canto visual que o nome sugere. Girar 90° (sentido
      horário, `transform-origin: top left`) faz o canto visual
      "embaixo-esquerda" corresponder ao canto local "direita+embaixo", e
      o canto visual "embaixo-direita" corresponder ao local
      "direita+topo" — por isso o analógico usa `right`+`bottom` (não
      `left`+`bottom`) e o botão de toque usa `right`+`top` (não
      `right`+`bottom`) no CSS, mesmo os dois aparecendo visualmente
      embaixo na tela. A mesma inversão vale pro *sentido do arrasto* do
      analógico: empurrar o dedo pra **direita** na tela vira `Up` no
      jogo (não `Right`), empurrar pra **baixo** vira `Right` (não
      `Down`) — dá pra conferir de novo fazendo as contas com
      `transform: rotate(90deg)` e a fórmula padrão de rotação 2D
      (`x' = x·cosθ - y·senθ`, `y' = x·senθ + y·cosθ`, com θ=90°), mas o
      jeito mais rápido de validar depois de mexer nisso é só abrir no
      visual celular e testar arrastando de verdade.
    - Toda tela de quiz (vocabulário/tempo/pronúncia/texto) passa antes
      por `renderizarTelaNomeTradutor()`, que pede um nome (prega no
      `localStorage` como sugestão da próxima vez) — é o nome usado no
      histórico/ranking.
    - Histórico/ranking de quiz (🏆): 4 chaves no `localStorage`
      (`TRAD_HIST_QUIZ_KEY` e as variantes `_TEMPO`/`_PRONUNCIA`/`_TEXTO`)
      — a de vocabulário vira ranking (top 5 por pontuação via
      `obterRankingQuizTradutor()`), as outras três só listam os últimos
      resultados. `limparHistoricosQuizTradutor()` some com as 4 de uma
      vez (botão 🗑️ Limpar Históricos, que também limpa o histórico de
      traduções — não mexe nos favoritos, igual ao `audioT`).
    - Ficou de fora, de propósito: só o Mundo Aberto/mapas (existia no
      `audioT` original e não faz sentido aqui — pedido explícito do
      usuário). Todo o resto do `audioT` (histórico, ranking, quiz
      contra o tempo, quiz de texto, editor de vocabulário) foi portado.
      O único recurso do `audioT` que não tem equivalente aqui é o
      editor de tema (dia/noite/frio/deserto/tundra/céu) — o Tradutor
      usa o claro/escuro que o mural já tem, ver nota em `tradutor.css`
      abaixo.
    - Fica posicionado antes do bloco Firebase de propósito — é 100%
      client-side, como o Versículo do dia.
    - `reconhecerFala()`/quem chama ele NÃO usa `SpeechRecognition` "cru":
      `criarReconhecimentoContinuoTradutor(idioma, duracaoMaxSegundos)`
      liga `continuous: true` (sem isso o navegador encerra sozinho na
      primeira pausa de silêncio, cedo demais) e acumula os resultados
      finais até um timer ou uma chamada manual de `parar()` — devolve
      `{ promise, parar }`. O botão Falar principal usa só a `promise`
      (com a duração vinda do slider `#tradSliderSegundos`, 5–30s); o
      Quiz de Texto usa o `parar()` direto num botão "⏹ Parar e
      conferir" (não dá pra ter uma duração fixa que sirva pra qualquer
      parágrafo), com um teto de 120s só de segurança.
    - `tocarTTS()` é uma cascata de 3 níveis, cada um só tentado se o
      anterior falhar (via `tentarTocarAudioTradutor()`, que resolve/
      rejeita ouvindo os eventos `playing`/`error` do `<audio>` — só o
      `.play().catch()` sozinho não pega falha assíncrona de
      carregamento): **(1)** a Netlify Function `/.netlify/functions/tts`
      (voz real, ver seção própria abaixo); **(2)** o endpoint público
      `translate_tts?client=tw-ob` direto (sem CORS porque `<audio>` só
      carrega a URL, não lê bytes via JS — funciona só como fallback, já
      que esse endpoint específico é instável e tem limite de ~200
      caracteres; tentado 2x antes de desistir); **(3)** a voz do
      navegador. O fallback do navegador (`falarComVozNavegador()`) não
      deixa mais o navegador escolher a voz sozinho —
      `obterMelhorVozTradutor()` procura entre `speechSynthesis.getVoices()`
      (cache atualizado via `onvoiceschanged`, já que carrega
      assíncrono) uma voz cujo `.lang` bata com o idioma; sem nenhuma
      voz instalada pra aquele idioma, ainda assim tenta falar (melhor
      um áudio imperfeito do que nenhum) e só avisa que a pronúncia pode
      sair errada.
17. **Bloco Firebase** — inicialização, checagem de config, listener de
    tarefas, `onAuthStateChanged`, handlers de submit dos formulários
    (dúvida, comentário, login, tarefa).

## `index.html` — estrutura

- Script inline no `<head>` que aplica `data-theme`/`data-view` salvos
  **antes do primeiro paint** (evita flash de tema errado).
- `.school-watermark` (logo) e `.credit-tag` são irmãos de `.app-shell`,
  posicionados fixos (não fazem parte do layout normal).
- `.app-shell` = `<nav class="sidebar">` (6 botões) + `.app-viewport`
  (header com switches/login + `<main>` com as 6 `<section class="app-section">`
  + footer).
- 3 modais: `#loginModal`, `#taskModal`, `#commentsModal`.

## `style.css`

Tokens de tema em `:root` (light) e redefinidos em
`@media (prefers-color-scheme: dark)` + `:root[data-theme="dark"]` /
`:root[data-theme="light"]` (o atributo sempre vence a media query, porque
o switch manual precisa funcionar independente do SO). Paleta categórica
`--c1`..`--c10` usada nas matérias. `--warning` usado pra "Aviso".

**Tipografia** (3 famílias, cada uma com um papel fixo, ver HISTORICO.md
item 48): `--font-body` (Inter, texto corrido), `--font-heading` (Manrope,
títulos de UI/menores: modais, nomes de matéria, marca "1MA" no cabeçalho),
`--font-display` (Big Shoulders Display, só nos `h2` grandes de cada seção
— `.section-intro h2`/`.merito-intro h2` — condensada/pesada de propósito,
pra não competir com o Manrope usado em todo o resto). **Não** usar
`--font-display` em textos curtos com números colados a letras tipo "1MA"
— o "1" dessa fonte é visualmente idêntico a "I" nesse peso, testado e
confirmado com Playwright. `--font-mono` é Space Mono (Google Fonts),
usado em eyebrows/badges/timestamps/horário.

**Motion**: `--ease-premium` (`cubic-bezier(0.16, 1, 0.3, 1)`) é usado só
no "brilho" (sheen) de hover do `.btn-primary` (gradiente diagonal que
desloca de posição, `::after` com `pointer-events:none` e
`border-radius:inherit`) — ver item 48 do HISTORICO.md. Existiu também uma
versão do sheen nos cards (Mural/Dúvidas/Artes) e um sistema de "revelação
ao rolar" (`[data-reveal]` + `IntersectionObserver`); **ambos foram
removidos no item 49** (brilho "muito aparente" nos cards, revelação ao
rolar competindo/desincronizada com a revelação circular ao trocar de
seção). As transições mais antigas (hover de botão secundário/chip/
sidebar, revelação circular ao trocar de seção) continuam com suas
próprias curvas/tempos já testados, não foram unificadas nessa variável.

**Ícones de seção**: cada `h2` de seção (`.section-intro`/`.merito-intro`)
tem um badge `.section-icon` com o mesmo gradiente do `.brand-mark`, SVG
desenhado à mão (não gerado por IA — a skill de geração de ícone precisa
de `GEMINI_API_KEY`, não configurada aqui). Os símbolos ficam num sprite
`<svg>` oculto (`<symbol id="icon-X">`) logo no início do `<body>` em
`index.html`, reusados via `<use href="#icon-X">` — evita repetir o SVG
inteiro nas seções que aparecem 2x (Dúvidas/Ideias: formulário público +
inbox do admin, mesmo ícone nos dois). Ver item 49 do HISTORICO.md.

## `tradutor.css`

Arquivo à parte (não misturado em `style.css`) só com o visual da seção
Tradutor. Toda regra é escopada com o prefixo `#tradutorSection ` e usa
classes próprias (`.trad-*`) — o `styleTranslator.css` original do audioT
tinha classes genéricas (`.card`, `.modal`, `.combo`, `.botao`...) que já
existem em `style.css` com outro visual (`.card` = card de tarefa do
Mural, `.modal` = sistema de modal do site inteiro); importar aquele
arquivo direto ia vazar estilo pro resto do site. Em vez de portar também
o sistema de temas do audioT (dia/noite/frio/deserto/tundra/céu), o
Tradutor reaproveita direto as variáveis de tema que já existem aqui
(`--surface`, `--border`, `--accent`, etc.), então ele já acompanha o
claro/escuro do mural sem precisar de nenhum CSS de tema duplicado.

Duas classes (`.trad-icon-btn`, `.trad-estrela`) são a exceção
deliberada à regra "tudo escopado em `#tradutorSection`": são reusadas
dentro dos modais do tradutor (favoritos, quiz, palavra do dia etc.),
que ficam fora da seção no DOM — são irmãos de `.app-shell`, mesmo
padrão dos outros modais do site (login, tarefa, comentários). Como os
nomes já são únicos (prefixo `trad-`), não há risco de colisão com o
resto do site mesmo sem o escopo — só não podiam ficar presas a
`#tradutorSection` porque aí não valeriam dentro dos modais.

## Netlify Function: voz do Tradutor (`netlify/functions/tts.js`)

Única parte do projeto que roda servidor de verdade — existe só porque o
navegador não consegue chamar o mecanismo real de voz do Google direto.

**Por que precisa disso**: a lib Python `gTTS` (que `audioT/backend.py`
usa) não chama o endpoint antigo `translate_tts?client=tw-ob` — ela chama
um RPC interno do Google
(`https://translate.google.com/_/TranslateWebserverUi/data/batchexecute`,
método `jQ1olc`), via **POST**, com headers específicos (`Referer`,
`User-Agent` fixos) e devolve o áudio em base64 dentro de um JSON. Esse
endpoint funciona bem e é a voz "de verdade" (mesma qualidade do projeto
antigo), mas a resposta **não tem** `Access-Control-Allow-Origin` — o
navegador bloqueia por CORS qualquer `fetch`/`XHR` tentando ler essa
resposta de um site diferente (não dá pra usar num `<audio src>` direto
porque o áudio vem embrulhado em base64 dentro de JSON, não como arquivo
puro). Servidor-pra-servidor não tem CORS (é regra só do navegador), então
a function faz essa chamada por trás e devolve o MP3 pronto, com
`Access-Control-Allow-Origin: *` na resposta dela mesma.

**O que faz**: `netlify/functions/tts.js` recebe `?texto=...&idioma=...
[&devagar=1]`, divide o texto em pedaços de até 100 caracteres (mesmo
limite que o gTTS usa — `dividirEmPedacos()`), monta o corpo RPC pra cada
pedaço (`montarCorpoRpc()`, mesma estrutura que `gTTS._package_rpc()`:
`[texto, idioma, velocidade, "null"]` — `velocidade: true` é o "devagar"
de verdade, sintetizado pelo Google, não só `playbackRate` reduzido),
extrai o áudio da resposta com a mesma regex que o gTTS usa
(`jQ1olc","\[\\"(.*)\\"]`), concatena os pedaços em Buffer e devolve como
`audio/mpeg`.

**Testado e validado** (não só escrito por analogia): a chamada real foi
reproduzida com `curl`/Python fora do navegador, confirmando que o RPC
funciona e que a regex + `base64.b64decode`/`Buffer.from(..., "base64")`
extraem um MP3 válido (cabeçalho `\xff\xf3`, frame sync MPEG-1 Layer 3).

**Efeito colateral no deploy**: Netlify Functions só rodam se o site for
publicado via Netlify processando o repositório (Git conectado, ou
`netlify deploy` pela CLI) — **não funcionam** com o Netlify Drop puro
(arrastar a pasta), que só sobe arquivos estáticos sem rodar nenhum
build/function. Ver seção Deploy em [HISTORICO.md](HISTORICO.md) pro passo
a passo atualizado.

**Teste local**: como este projeto usa só um `python -m http.server`
simples pra testar localmente, essa function **não roda** nesse setup —
`/.netlify/functions/tts` vai dar 404, e `tocarTTS()` cai pro plano B
(endpoint direto) automaticamente, então o resto do site continua
testável normalmente. Pra testar a function de verdade localmente,
precisa da Netlify CLI (`npm install -g netlify-cli` e rodar
`netlify dev` na raiz do projeto em vez do servidor Python).

## Testes locais (fora do projeto real)

Existe uma pasta de teste isolada na scratchpad da sessão
(`school-test/`) com mocks do Firebase (`mock-firebase-app.js`,
`mock-firebase-auth.js`, `mock-firebase-firestore.js`) simulando
Firestore + regras de segurança, usada só durante o desenvolvimento pra
testar sem mexer nos dados reais. Não faz parte do site publicado.

Servidor local de desenvolvimento: `scripts/dev_server.py` (porta 8091,
`python scripts/dev_server.py`) — `http.server.ThreadingHTTPServer`
simples forçando `charset=utf-8` nas respostas `.html` (sem isso os
acentos quebravam). Existia só como prática/documentação até 2026-08-11 —
o arquivo em si nunca tinha sido commitado; formalizado no item 48 do
HISTORICO.md.
