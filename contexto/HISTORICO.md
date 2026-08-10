# Histórico de pedidos e mudanças

Registro cronológico do que foi pedido e implementado. Mantido atualizado
a cada novo pedido — não é changelog técnico linha-a-linha, é o "porquê"
por trás de cada decisão, pra não se perder o contexto depois.

1. **Site em nuvem** — pedido inicial vago, virou portfólio pessoal
   primeiro, depois pivotou totalmente pro mural de turma.
2. **Mural de tarefas admin-only** — só o Eduardo (depois +1 representante)
   adiciona tarefa; turma só visualiza. Motivo: professor passa tarefa,
   alguém centraliza, resto da turma só confere.
3. **Cor por matéria**, **filtro por matéria**.
4. **Mérito** com cálculo de média e níveis (Diamante/Ouro) — depois
   ganhou escolha de itinerário (Humanas/Exatas) porque cada itinerário
   tem matérias extras diferentes.
5. **Dúvidas** — formulário público, inicialmente só admin lia; depois
   evoluiu pra admin poder **responder** e a dúvida respondida virar
   pública (mini FAQ) — não dá pra notificar quem perguntou (não tem
   login de aluno), então tornar a resposta pública é a única forma de
   ela "chegar" na pessoa.
6. **Comentários por tarefa** — chat por card, pede nome antes de comentar.
7. **Tema claro/escuro** — depois virou switch arrastável (não bastava
   ser um botão comum).
8. **Visual forçado PC/celular** — decisão explícita do usuário: não
   queria só responsivo automático, queria poder forçar o layout.
9. **Horário de aula** — tabela fixa a partir de um print da agenda real
   da turma (EM1MA, Colégio Adventista Portão).
10. **Simulados** (matéria nova, entra no Mural e no Mérito) e **Aviso**
    (categoria só de Mural, não é matéria com nota, não entra no Mérito).
11. **Campo "Outra matéria" removido** — usuário achou inútil depois de
    ver funcionando, foi tirado do formulário.
12. **Logo da escola como marca d'água** — preenchendo espaço vazio em
    telas largas; reposicionado uma vez a pedido do usuário.
13. **Crédito "Feito por Eduardo Halas"** no canto da página.
14. **Ordenação das seções do Mural por urgência** — quem tem menos tempo
    até o prazo aparece no topo, ao invés de ordem fixa de matérias.
15. **Redesign visual completo** ("melhore o design em 100%").
16. **Versículo do dia** — `versiculos.json` com lista de versos (expandida
    de 40 para 80), troca automática por dia do ano, sem backend.
17. **Restrição de admin por UID** — inicialmente só o e-mail do Eduardo
    seria confiável; depois usuário pediu **dois** admins (ela + outra
    representante) e passou as duas UIDs do Firebase Auth. Regras do
    Firestore reescritas com função `isAdmin()` checando as duas UIDs —
    corrigiu uma falha de segurança onde `request.auth != null` sozinho
    daria poder de admin pra qualquer um que se autocadastrasse (o método
    e-mail/senha permite auto-cadastro público por padrão, e a apiKey é
    pública).
18. **Revisão das regras do Firestore** (2x, a pedido do usuário) —
    achou e corrigiu um bug de `size()` contando bytes UTF-8 (acentos
    contam 2 bytes) vs `maxlength` do HTML contando caracteres; limites
    foram alargados pra não travar texto legítimo em português.
19. **Resposta às dúvidas pelo próprio site** — admin responde direto no
    inbox; dúvida respondida some do "privado" e aparece na lista pública
    "Perguntas já respondidas" (visível a todos, sem precisar de login).
20. **Tradutor** (2026-08-08) — trazido do projeto separado `audioT`
    (tradutor por voz/texto do Eduardo, com backend Python/Flask) pra
    virar uma 6ª seção do mural.
    - Primeira versão só trouxe o núcleo (texto + 34 idiomas +
      trocar/copiar/ouvir); o usuário achou pouco ("excluiu muita
      coisa") e pediu de volta falar/transcrever, áudio automático,
      modo papagaio, copiar, favoritar, flashcards e os quizzes de
      pronúncia/vocabulário nos 3 níveis — só **não** queria as partes
      de mapa (Mundo Aberto/lagoa/zoo/castelo), que eram só cenário do
      projeto antigo e não faziam sentido aqui.
    - Segunda versão (a atual) portou tudo isso de `audioT/backend.py`
      pra JS 100% client-side: reconhecimento de voz e leitura em voz
      alta usam a Web Speech API do navegador (só Chrome/Edge têm
      `SpeechRecognition`), a tradução usa `fetch` direto pro endpoint
      público do Google Tradutor (mesmo mecanismo não-oficial da lib
      `googletrans`), e o áudio da tradução usa a voz REAL do Google
      Tradutor via `<audio src="translate.google.com/translate_tts...">`
      (mesmo endpoint que a lib `gTTS` usa) — não precisou instalar
      nenhuma lib de verdade porque o projeto não tem build step/npm.
      Favoritos foram adaptados pra `localStorage` (sem backend pra um
      `favoritos.csv`); quiz de vocabulário/pronúncia reimplementa em JS
      a lógica de `obter_quiz()`/`obter_quiz_pronuncia()`, usando uma
      cópia de `audioT/dicionario.json` (`tradutor-dicionario.json`).
      Nessa segunda versão ainda ficaram de fora histórico de traduções,
      ranking de quiz, quiz contra o tempo, quiz de texto longo, editor
      de tema e editor de vocabulário (ver item 21 — voltaram quase
      todos numa terceira rodada).
    - O CSS original do tradutor (`styleTranslator.css`) tinha classes
      genéricas que colidiam com `.card`/`.modal` do mural, então virou
      um `tradutor.css` novo, escopado em `#tradutorSection`,
      reaproveitando os tokens de tema já existentes em vez de duplicar
      o sistema de temas do `audioT`.
21. **Tradutor, 3ª rodada** (2026-08-08) — dois pedidos na mesma leva:
    - **Bug de espaçamento**: os botões do tradutor estavam colando na
      sidebar. Causa: cada seção do mural (Mérito/Dúvidas/Horário/
      Versículo) tem sua própria classe `*-section` com o
      padding/max-width — a seção do Tradutor só tinha `.app-section`
      (a classe base, sem padding nenhum) e ficou faltando a sua. Virou
      `.tradutor-section` em `tradutor.css`.
    - **"Quero como estava no meu projeto de tradutor antigo"** — o
      usuário colou o projeto `audioT` inteiro numa pasta `translator/`
      dentro do 1MAtRAE (`backend.py`, `main.py`, `frontend.py`,
      `idiomas.py`, `dicionario.json`, `textos_quiz.json`, CSVs) como
      referência completa, e pediu de volta tudo que ainda faltava da
      2ª rodada: fixar idioma, devagar, histórico de traduções, palavra
      do dia, editor de vocabulário, quiz contra o tempo, quiz de
      texto e histórico/ranking de quiz. Tudo isso entrou, sempre
      client-side (localStorage no lugar de CSV/arquivo, Web Speech API
      no lugar de `speech_recognition`, endpoint público de TTS do
      Google no lugar de `gTTS`, LCS de palavras aproximando o
      `difflib.SequenceMatcher` do quiz de texto). Único recurso que
      continua de fora, por pedido explícito e reiterado do usuário: o
      Mundo Aberto (mapas/lagoa/zoo/castelo) — não tem nada a ver com um
      mural de turma. O editor de tema (dia/noite/frio/deserto/tundra/
      céu) do `audioT` também não foi portado (o Tradutor usa o
      claro/escuro que o mural já tem).
    - Durante essa rodada também apareceu um bug real: `.trad-icon-btn`/
      `.trad-estrela` estavam escopadas em `#tradutorSection`, mas são
      reusadas dentro dos modais (que ficam fora da seção no DOM) — os
      botões redondos ficariam sem estilo nos modais de favoritos/quiz/
      palavra do dia. Corrigido tirando o escopo dessas duas classes
      específicas (ver nota em `tradutor.css`, seção ARQUITETURA.md).
22. **Tradutor: microfone cortando muito cedo + voz ruim** (2026-08-08) —
    usuário reportou que o microfone "abre por 1 segundo só" (em Falar, no
    Quiz de Pronúncia e no Quiz de Texto) e que a voz de fallback "falou a
    palavra letra por letra". Duas causas raiz distintas, corrigidas juntas:
    - **Microfone curto**: o `SpeechRecognition` do navegador, sem
      `continuous: true`, encerra sozinho na primeira pausa depois da
      fala (~1s de silêncio) — rápido demais pra terminar uma frase.
      Virou `criarReconhecimentoContinuoTradutor()`, que liga
      `continuous: true` e acumula os resultados finais até um timer
      (duração escolhida) ou uma chamada manual de `parar()` encerrar.
      O botão Falar principal ganhou de volta o slider de segundos
      (5–30s) que o projeto antigo tinha (`#tradSliderSegundos`); o Quiz
      de Texto (parágrafo inteiro, sem duração fixa que faça sentido)
      ganhou um botão "⏹ Parar e conferir" — equivalente ao
      `reconhecer_fala_cancelavel`/botão "Terminar" do `audioT` — com um
      teto de 2 minutos só de segurança.
    - **Voz ruim/soletrando**: o áudio real do Google Tradutor (o bom)
      falha ocasionalmente (confirmado testando direto no Chrome -
      parece ser rate-limit intermitente do endpoint público, já que
      tentar de novo alguns milissegundos depois costuma funcionar) e
      caía direto pro fallback do navegador; esse fallback só setava
      `.lang` na `SpeechSynthesisUtterance` e deixava o navegador
      escolher a voz sozinho — sem voz instalada pra aquele idioma
      específico, o Windows/Chrome usa a voz padrão (inglês) e ela lê
      palavras estrangeiras soletrando letra por letra. Corrigido: (1)
      `tocarTTS()` agora tenta o áudio real do Google 2x (com um pequeno
      atraso entre tentativas) antes de cair pro fallback; (2) o
      fallback (`falarComVozNavegador()`) escolhe explicitamente a
      melhor `SpeechSynthesisVoice` instalada pra aquele idioma
      (`obterMelhorVozTradutor()`) e, se não existir nenhuma, avisa em
      vez de tentar falar errado.
23. **"Cadê a voz??" — fallback ficando mudo** (2026-08-08) — a correção
    do item 22 tinha um efeito colateral: quando não achava nenhuma voz
    instalada pro idioma, o fallback desistia em silêncio (só um toast
    discreto), e como o áudio real também falha às vezes, o resultado
    virou silêncio total em vez de "voz ruim". Corrigido pra nunca ficar
    mudo — sempre tenta falar (com a melhor voz que achar; sem achar
    nenhuma, ainda assim fala com a voz padrão e só avisa que pode sair
    errado). Nessa mesma leva, usuário reportou que o microfone continuava
    "abrindo e fechando em 1 segundo" mesmo com o `continuous: true` do
    item 22 — na real o reconhecimento não estava cortando cedo, estava
    terminando sem captar **nenhuma** fala (permissão/dispositivo), e
    isso falhava em silêncio (botão só resetava, sem mensagem nenhuma).
    Adicionada mensagem clara ("Não captei nenhuma fala...") nesse caso,
    em vez de falso-silêncio. O código em si estava certo; o problema era
    zero feedback quando as coisas davam errado.
24. **Erro "network" no microfone → achada a causa real da voz ruim**
    (2026-08-08) — usuário reportou o código de erro `"network"` do
    `SpeechRecognition` (aparece quando o Chrome não consegue falar com o
    serviço de reconhecimento de voz dele mesmo, que é na nuvem — dica
    dada: testar trocando `127.0.0.1` por `localhost` na URL, bug
    conhecido do Chrome nessa API). Pediu pra usar a pasta `audioT/`
    como fonte da verdade pra investigar tanto isso quanto a voz. Lendo o
    código-fonte real da lib `gTTS` instalada (a que `audioT/backend.py`
    usa), descobri que ela **não** usa aquele endpoint antigo
    `translate_tts?client=tw-ob` — usa um RPC interno do Google
    (`.../_/TranslateWebserverUi/data/batchexecute`, POST, headers
    específicos, áudio em base64 dentro de JSON). Testei esse RPC direto
    (curl + Python) e confirmei que funciona bem — só que a resposta não
    tem `Access-Control-Allow-Origin`, então o **navegador bloqueia por
    CORS** qualquer tentativa de ler essa resposta de um site diferente.
    É por isso, estruturalmente, que o `audioT` original precisava de um
    backend Flask: sem servidor, o site não tem como pegar a voz real.
    Apresentei a escolha pro usuário (manter só a voz do navegador vs.
    adicionar uma function serverless) — escolheu a function. Resultado:
    `netlify/functions/tts.js` (ver ARQUITETURA.md) — muda o método de
    deploy (não dá mais pra usar só Netlify Drop puro, precisa de
    repositório Git conectado ao Netlify). O erro de microfone `"network"`
    em si é um problema separado (não tem relação com Firebase, que o
    usuário também perguntou sobre) — provavelmente ambiente/rede do
    navegador, não código.
25. **Causa real do erro "network": era o Opera** (2026-08-08) — seguindo
    o item 24, o microfone continuava sem funcionar. Descartado por
    etapas: funcionava em testes fora do navegador (Windows) e em outro
    site de teste de voz — ou seja, hardware/driver/permissão do sistema
    estavam OK, o problema era só na nossa página. Motivo real: o usuário
    estava no **Opera**. Opera (e Brave, Vivaldi e outros Chromium
    "não-Google") não têm a chave de API do Google que o
    `SpeechRecognition` do navegador precisa pra funcionar — só o Chrome
    e o Edge de verdade têm isso embutido. Testou no Chrome e funcionou.
    Conclusão prática: **"baseado em Chromium" não é suficiente** — o
    aviso de navegador suportado (`reconhecimentoDeVozSuportado()`) foi
    atualizado nos docs pra deixar isso explícito.
26. **Leva de pedidos: mural, mérito, versículo, tradutor** (2026-08-08) —
    - **Crédito "Feito por Eduardo Halas"**: já existia desde o item 12,
      nenhuma mudança precisou ser feita.
    - **Tarefa vencida some sozinha do mural**: pedido explícito pra não
      ter card com etiqueta "Atrasada". Implementado como filtro na
      renderização (`isTarefaVencida()` em `renderBoard()`/
      `renderFilterBar()`) — a tarefa **não é apagada do Firestore**, só
      para de ser mostrada (decisão da IA: reversível é mais seguro que
      apagar de verdade, e resolve a reclamação do mesmo jeito).
    - **Mérito**: "Projeto Integrador de Linguagens e suas Tecnologias"
      removido de vez (não tinha uso fora do Mérito); "Literatura" só
      saiu do cálculo do Mérito, continua valendo no Mural normalmente
      (`MERITO_MATERIAS_EXCLUIDAS`). Média agora arredonda pro 0,5 mais
      próximo antes de definir o nível — confirmado com os exemplos que
      o usuário deu (9,45→9,5, 8,95→9,0) que é arredondamento matemático
      padrão pro múltiplo de 0,5 mais perto.
    - **Chat do versículo do dia**: nova coleção `versiculoComentarios/
      {data}/mensagens` no Firestore (mesmo padrão de permissão dos
      comentários de tarefa). O "reset" pedido pelo usuário (chat some
      quando o versículo muda) saiu de graça agrupando as mensagens pela
      data de hoje — não tem nenhuma rotina de limpeza, o dia seguinte
      só usa outra chave e começa vazio.
    - **Tradutor, Quiz de Texto**: palavras do resultado (certa/errada)
      viraram clicáveis — abre um popup com tradução de volta pro
      português, pronúncia (🔊) e favoritar (⭐), mesma ideia que o
      `audioT` original já tinha (popup de palavra no quiz de texto
      longo), reaproveitando a UI já criada pra Palavra do Dia.
27. **Contador de visitas de hoje** (2026-08-08) — usuário pediu, no meio
    da conversa, algo tipo "avisar quando alguém novo entra no site". A
    primeira ideia (o site criar um arquivo no computador do usuário) não
    é possível — um site não tem como escrever arquivo na máquina de quem
    visita (trava de segurança do navegador, não limitação de código).
    Depois de conversar sobre alternativas (toast ao vivo, push
    notification, script local escutando o Firestore), o usuário decidiu
    por algo bem mais simples: um "👁️ N hoje" do lado do crédito no
    rodapé, contando visitantes distintos do dia. Mesmo padrão do chat do
    versículo (documento por data no Firestore, reseta sozinho o dia
    seguinte) — `visitasDiarias/{data}` com campo `contagem`, incrementado
    via `increment(1)` uma vez por navegador por dia (guarda a data em
    `localStorage` pra não contar de novo em cada F5). Regra do Firestore
    só deixa o campo subir de 1 em 1 (compara com o valor atual), pra
    ninguém conseguir "zerar" ou pular pra um número qualquer via
    DevTools.
28. **Mundo Aberto de volta** (2026-08-08) — tinha sido excluído no port
    inicial do tradutor (item 22-ish, ver seção Tradutor acima) por ser
    "só cenário" a pedido do próprio usuário; pouco depois ele pediu de
    volta ("kkkkk"). Portado do `audioT` original quase sem alterar a
    lógica (o motor do jogo já era 100% client-side lá, só a geometria
    dos mapas vinha de um endpoint Flask) — ver ARQUITETURA.md pra
    detalhes de como a geometria foi extraída (script Python pontual que
    importa `mundo_dados.py` direto, sem transcrever à mão) e como os 3
    pontos que chamavam o backend Flask (mapa/tradução do objeto/TTS/
    favoritos) foram trocados pelas funções que já existiam no tradutor
    do mural. Testado de ponta a ponta com Playwright (headless, os 3
    mapas: Casa/Zoo/Castelo) — modal de escolha, canvas renderizando no
    tamanho/escala certos, personagem andando com colisão bloqueando
    corretamente, saída limpando o loop do jogo, zero erro de JS.
29. **Botão do Mundo Aberto redesenhado + controles de celular** (2026-08-08)
    — dois pedidos seguidos do usuário depois de ver o jogo funcionando:
    - Botão "🌍 Mundo Aberto" saiu do grid 2 colunas e virou um botão
      largo próprio (`.trad-btn-mundo`), mesmo formato do "🗑️ Limpar
      Históricos" mas com gradiente da cor de destaque em vez de vermelho
      — pedido explícito: "parecido com o de limpar histórico, longo mas
      de outra cor".
    - Controles pensados pra toque no visual celular: analógico
      (arrasta o dedo, substitui WASD/setas) + um botão único "👆
      Interagir/Ver lagoa" contextual (substitui as teclas E/R, que não
      existem no celular) + a tela do jogo/lagoa força modo paisagem
      (gira 90°) mesmo com o aparelho na vertical, já que o mapa é bem
      mais largo que alto.
      **Pedido original era "girar a tela em 180 graus"** — perguntei
      antes de implementar, porque 180° deixaria tudo de cabeça pra
      baixo (não ajudaria em nada); o usuário confirmou que era 90°/modo
      paisagem forçado mesmo, "180" foi só imprecisão de linguagem.
      Depois de girar só a tela toda (título incluso) e ver que a barra
      de cima ficava ilegível de lado, mudei pra girar só o conteúdo do
      jogo (canvas+controles), deixando a barra de cima sempre normal —
      bem melhor. Também bati a cabeça com o CSS `100vh`/`100vw` não
      batendo com o viewport visual real num teste automatizado
      (Playwright com emulação de celular) — troquei por medir com
      `getBoundingClientRect()` de verdade em JS, mais robusto de
      qualquer forma (evita o problema clássico da barra de endereço do
      navegador mobile mudando o `100vh`). A matemática de qual canto
      CSS local (`left`/`right`/`top`/`bottom`) corresponde a qual canto
      visual depois de girar 90° — e por que o sentido do arrasto do
      analógico não é "intuitivo" (empurrar pra direita na tela vira
      "Up" no jogo) — está documentada com detalhe no ARQUITETURA.md,
      pra não precisar rederivar da próxima vez que mexer nisso.
      Testado com Playwright simulando toque de verdade: arrastar o
      analógico moveu o personagem, o botão contextual apareceu perto de
      um objeto ("Interagir") e de um animal do Zoo, e tocar nele abriu
      o popup de tradução certo.
30. **3 correções nos controles de celular do Mundo Aberto** (2026-08-08)
    — usuário testou de verdade e reportou os problemas:
    - **"Analógico bugado, arrasto pra esquerda e ele vai pra direção
      aleatória (mas o personagem vai pra esquerda certinho)"**: o
      personagem estava certo porque o cálculo de direção usa dx/dy
      direto (sem passar por CSS). A bolinha do analógico é que estava
      errada — ela é filha do bloco que já girou 90°, então o
      `transform: translate(dx,dy)` dela sofria a rotação do pai de novo
      por cima, virando uma direção visual errada. Corrigido aplicando a
      rotação inversa só na bolinha: `translate(dy, -dx)` em vez de
      `translate(dx, dy)`. Confirmado medindo o deslocamento visual real
      antes/depois do arrasto via Playwright (bateu exatamente com a
      direção do dedo depois da correção).
    - **"Criar botão pra sair da tela da lagoa no celular"**: o botão já
      existia (`lagoaSairBtn`) e estava na posição certa — só que ficava
      **coberto pela própria imagem da lagoa**, porque `.lagoa-area`
      não tinha `position: relative`. Sem isso, o elemento que gira
      (`#lagoaImagemWrap`, `position: absolute`) usava a tela inteira
      como referência de posição em vez de só a área abaixo da barra de
      título, cobrindo ela também. Um `position: relative` faltando —
      mesma classe de bug que já tinha sido evitada em
      `.mundo-jogo-area` (essa já tinha a propriedade certa desde o
      início).
    - **Popup de palavra do objeto interagido também girado**: pedido
      novo, não bug. O popup (`#tradPopupPalavraModal`, reusado do Quiz
      de Texto) agora gira 90° junto quando aberto pelo Mundo Aberto no
      celular — só nesse caso; uma classe (`mundo-popup-girado`) liga em
      `abrirPopupObjetoMundo()` e desliga em `abrirPopupPalavraTradutor()`
      pra não vazar pro popup do Quiz de Texto, que não deve girar.
31. **Paleta de cores personalizável, portada do audioT** (2026-08-08) —
    pedido: "um botão de personalizar a paleta igual tinha no meu tradutor
    antigo". No `audioT` original isso valia pro app inteiro (era só
    tradutor); aqui o mural tem várias seções e já tinha um switch simples
    de claro/escuro — perguntei antes de mexer, e o usuário confirmou que
    queria **site inteiro, substituindo** o switch antigo (não deixar os
    dois sistemas coexistindo). Trocado: `#themeToggle` (switch binário)
    virou `#temaSeletor` (7 botões: Dia/Noite/Frio/Deserto/Tundra/Céu/
    Personalizado) + `#temaEditarBtn` (🖌️, abre editor com 10 seletores
    de cor). Os 6 temas prontos são blocos CSS estáticos adaptados das
    cores do `audioT` original pro conjunto maior de variáveis daqui (lá
    eram ~10 por tema, aqui ~15 — as variáveis "extras" tipo
    `border-strong`/sombras/cores de erro reusam os mesmos valores do
    tema dia/noite já existente, não foram tunadas uma a uma pros 4 temas
    novos). "Dia" e "Noite" são literalmente os antigos "light"/"dark" só
    renomeados (mesmos valores, sem mudança visual pra quem já usava o
    site). Testado com Playwright: os 7 botões existem, cada tema muda
    `--bg` (e o resto) corretamente, o editor abre com 10 inputs de cor,
    mudar uma cor aplica na hora E sobrevive a um reload da página
    (localStorage), e o botão "Redefinir cores" volta pro preto/branco
    neutro.
32. **Paleta reduzida pra 3 opções** (2026-08-08) — logo em seguida, o
    usuário pediu pra tirar os 4 temas extras (Frio/Deserto/Tundra/Céu),
    ficando só com Dia/Noite/Personalizado ("não preciso das outras").
    Removidos os 4 botões do `index.html` e os 4 blocos CSS
    correspondentes de `style.css` (não é só esconder - foram tirados de
    vez). Nenhuma mudança em app.js precisou (o clique nos botões já lê
    `data-tema` dinamicamente, então sumir com os botões já basta).
33. **Nova aba "Ideias"** (2026-08-08) — pedido: uma seção nova no menu
    lateral igual à de Dúvidas, mas pra receber ideias em vez de
    perguntas, "os admins veem ela". Implementada como uma cópia
    simplificada de Dúvidas: mesmo componente visual (`.duvida-card`),
    mesmo padrão de formulário público + inbox admin, mas **sem** o
    campo de resposta e **sem** lista pública — dúvida vira FAQ público
    depois de respondida, mas ideia é só uma sugestão pro admin, não faz
    sentido "responder" nem publicar. Nova coleção `ideias/{id}` no
    Firestore, leitura restrita a admin (diferente de dúvidas, que todo
    mundo lê as respondidas). Testado localmente — form aparece, envio
    falha por enquanto com "Missing or insufficient permissions" (regra
    nova, ainda não publicada no Firebase Console, mesma pendência de
    sempre).
34. **Nova aba "Enquetes"** (2026-08-08) — pedido explícito: só admin
    cria uma enquete, qualquer um vota, e se não tiver nenhuma criada
    ainda avisar em vez de mostrar lista vazia. Decisão de dados: `votos`
    é um **mapa** (`{"0": n, "1": m}`), não array - só assim dá pra
    incrementar atomicamente uma opção sozinha via
    `updateDoc(ref, {[\`votos.${indice}\`]: increment(1)})` (dot-path em
    campo de mapa funciona no Firestore, em elemento de array não). Voto
    único por pessoa controlado via `localStorage` (mesmo nível de
    confiança do resto do site - não impede alguém de limpar o navegador
    e votar de novo, mas ninguém pediu proteção mais forte que isso em
    nenhuma outra parte do mural). Card mostra os botões de opção antes
    de votar e vira barra de resultado com porcentagem depois. Testado
    com Playwright: modal de criar abre, opções dinâmicas (mínimo 2,
    adicionar/remover linha) funcionam, e o estado vazio mostra
    literalmente "Nenhuma enquete ainda." como pedido.
35. **Aba "Artes" — TEMPORÁRIA, pra remover depois** (2026-08-09) — pedido
    pra um trabalho específico da escola (a turma cria um Instagram
    fictício pra um artista cada). Diferente de Ideias/Enquetes: aqui é
    **público lê e cria** (igual comentário de tarefa), sem gate de
    admin nenhum pra postar - só apagar é admin. Cada post tem nome de
    quem criou, nome do artista e o @ escolhido (normalizado: tira @ que
    a pessoa digitou e recoloca um só, então "@x", "x", "@@x" viram todos
    "@x"). **O usuário avisou que essa aba é temporária e vai tirar
    depois** que o trabalho acabar - por isso ficou tudo bem marcado com
    comentários "TEMPORÁRIO" nos 4 lugares que precisam ser removidos
    juntos quando chegar a hora:
    - `index.html`: botão do menu lateral + `<section id="artesSection">`
    - `style.css`: bloco `.arte-*`
    - `app.js`: bloco inteiro `// Artes (TEMPORÁRIO...)` + as 3 linhas
      que conectam nele (`iniciarArtes()`, `renderArtes(allArtes)` no
      `onAuthStateChanged`, `el.arteForm.addEventListener`)
    - `firestore.rules`: `match /trabalhoArtes/{arteId}`
    (e depois de remover, também dá pra apagar a coleção `trabalhoArtes`
    inteira no Firebase Console, já que não serve mais pra nada).

36. **Segundo redesign visual — "refaz todo o front, mais profissional,
    ajuste melhor pro celular, mais intuitivo e versátil"** (2026-08-10) —
    diferente do primeiro redesign (item 15), que foi uma repaginação
    visual; esse pedido veio com foco explícito em responsividade real.
    Diagnóstico antes de mexer: o site não tinha responsividade fluida de
    verdade — só existia o sistema `data-view="mobile"/"desktop"`
    (alternado manualmente pelo botão 💻/📱 no header, ou automático uma
    vez no load via `innerWidth < 640`). Achado crítico: em telas entre
    640px e 1088px (tablet, notebook com janela não maximizada), o site
    ficava preso em `data-view="desktop"` mas `.app-viewport` tinha
    `min-width: 1000px` fixo — causava rolagem horizontal. Mudanças:
    - **Tipografia**: Google Fonts (Manrope pra títulos/marca, Inter pro
      corpo) via `<link>` no `<head>`, substituindo a pilha de fontes de
      sistema — dá uma cara mais "desenhada" sem mudar nenhuma estrutura.
    - **Responsividade real**: `min-width: 1000px` do `.app-viewport`
      removido; adicionado `@media (max-width: 860px)` que reage à
      largura real da janela (não depende mais só do toggle manual) e
      `@media (min-width: 861px) and (max-width: 1180px)` com respiro
      leve pra faixa intermediária.
    - **Sidebar horizontal no celular**: a barra lateral (nav vertical de
      88px/68px, comia ~17% da largura útil num celular) virou uma barra
      horizontal rolável no topo em telas estreitas — mesmas regras
      escritas duas vezes de propósito: uma vez presa a `@media
      (max-width: 860px)` (cobre qualquer tela física estreita,
      independente do toggle), outra presa a `:root[data-view="mobile"]`
      (cobre o preview manual do visual celular numa tela larga).
    - **Alvos de toque maiores** (~44px mínimo) pra botões/chips no
      celular, acessibilidade de toque.
    - Três bugs pegos e corrigidos durante o teste (Playwright, larguras
      320/390/800/1024/1440px, `document.documentElement.scrollWidth`
      comparado à largura da viewport pra achar overflow horizontal):
      1. `.btn:not([hidden])`/`.chip:not([hidden])` — a regra de alvo de
         toque (`display: inline-flex`) tinha mais especificidade que o
         `[hidden]` da UA stylesheet e reexibia botões escondidos (ex.
         "Sair" aparecia mesmo deslogado). Sempre testar visibilidade
         condicional depois de qualquer regra que force `display` numa
         classe genérica como `.btn`.
      2. `.header-actions` sem `width: 100%` — mesmo com `flex-wrap:
         wrap`, um flex item sem largura própria não é forçado a quebrar
         linha, só empurra a linha pra frente. `flex-wrap` sozinho não
         basta, precisa dar uma largura pro container quebrar dentro dela.
      3. `.app-viewport` com `margin: 0 auto` dentro de um flex container
         (`.app-shell` virou `flex-direction: column` no celular) sem
         `width: 100%` explícito — margem automática em item flex
         desliga o `stretch` padrão e faz o elemento se dimensionar pelo
         conteúdo (shrink-to-fit) até o teto do `max-width`, ignorando o
         espaço real disponível; com uma tabela larga dentro (Horário,
         6 colunas), o `.app-viewport` "esticava" pra 420px mesmo numa
         tela de 390px. Corrigido com `width: 100%; min-width: 0;`
         explícitos nos elementos flex que também têm `max-width` +
         `margin: auto`.
    - Testado (Playwright): Mundo Aberto (rotação 90°, analógico, escolha
      de mapa) continua funcionando sem alteração na lógica, todas as
      seções (Mural, Mérito, Dúvidas, Ideias, Enquetes, Horário,
      Versículo, Tradutor, Artes) e modais abrem sem estourar a largura
      da tela em nenhum breakpoint testado.

37. **"Não vi muita diferença" — reforço visual em cima do item 36**
    (2026-08-10) — o redesign do item 36 focou em responsividade real
    (bugs de mobile/tablet), invisível numa janela de desktop normal; a
    única mudança visível ali era a troca de fonte. Usuário pediu mais
    impacto visual, confirmado por pergunta (cores fortes + cabeçalho +
    cards + tipografia + "extremamente profissional"). Mudanças, todas
    em `style.css`, sem tocar HTML/JS estrutural:
    - **Glow de fundo**: `body::before` com dois radiais sutis
      (`color-mix` com `--accent`/`--accent-2`) atrás de tudo, tira o
      "chapado cinza". Precisou `position:relative; z-index:1` no
      `.app-shell` (e outros elementos fixos sem z-index próprio) pra não
      ficar por baixo do glow — pseudo-elemento com z-index:0 pinta por
      cima de conteúdo estático sem z-index, regra de stacking context
      do CSS.
    - **Cabeçalho**: faixa gradiente de 3px no topo (`::before`), marca
      "1MA" maior com mais sombra, nome da turma em Manrope 800.
    - **Eyebrow** (`// mural`, `// mérito`...) virou badge/pílula colorida
      em vez de texto mono solto; títulos de seção de 1.7rem → 2.35rem.
    - **Sidebar**: item ativo ganhou fundo em gradiente (antes era só uma
      tinta de 13% de opacidade) com sombra colorida.
    - **`.subject-dot`** (bolinha ao lado do nome da matéria no Mural)
      virou um chip quadrado arredondado de 34px com brilho e sombra
      colorida — precisou de **1 linha nova em `app.js`**
      (`colorForSubject`, função que monta o `<span class="subject-dot">`):
      além do `style="background:${color}"` que já existia, passou a
      setar `color:${color}` também, pra CSS poder usar `currentColor`
      nas sombras/realces (`background` sozinho não dá acesso à cor via
      `currentColor`, só `color` dá).
    - **Cards do Mural**: borda esquerda mais grossa (4px→5px), cantos
      mais arredondados, sombra tingida da cor da matéria, hover mais
      pronunciado (`translateY(-4px) scale(1.012)`).
    - **Botões**: `.btn-primary` com raio maior e sombra mais forte;
      `.btn-ghost` trocou de cinza neutro pra destacar com a cor de
      accent no hover.
    - **Badge do Mérito** e **card do Versículo** ganharam sombra colorida
      e (versículo) uma barra gradiente no topo, mesma linguagem visual
      do cabeçalho.
    - Retestado nas mesmas 5 larguras (320–1440px) via Playwright depois:
      nenhuma regressão de overflow horizontal.

## Deploy

- **Mudou em 2026-08-08** (item 24): o site agora tem uma Netlify
  Function (`netlify/functions/tts.js`, voz do Tradutor), então **não dá
  mais pra publicar só arrastando a pasta no Netlify Drop** — Netlify
  Drop sobe arquivos estáticos, mas não roda Functions.
- **Hospedagem atual**: publicar via repositório Git conectado ao
  Netlify (App → "Import from Git" no painel do Netlify, apontando pra
  um repo com este projeto) — o Netlify detecta `netlify.toml`
  automaticamente e já sobe a function junto. Toda vez que o repo for
  atualizado (push), o Netlify republica sozinho.
- Atualizações: editar local → testar local (servidor Python na porta
  8091 — a function de voz não roda nesse setup simples, mas o resto do
  site sim, `tocarTTS()` cai pro fallback automaticamente) → commit +
  push pro repositório conectado.
- Pra testar a Netlify Function de verdade localmente (não só o resto do
  site): precisa da Netlify CLI (`npm install -g netlify-cli`, depois
  `netlify dev` na raiz do projeto em vez do servidor Python).
- Sem custo pra manter no ar (Netlify free + Firebase Spark, ambos com
  cota gratuita generosa pro tamanho de uma turma; Netlify Functions
  também têm cota gratuita generosa no plano free).
