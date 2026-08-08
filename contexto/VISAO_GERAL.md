# Mural 1MA — Visão Geral

Site do mural da turma 1MA (Colégio Adventista Portão). Site estático
(HTML + CSS + JS puro, sem build/bundler) — hospedado no Netlify. Backend
é o Firebase (Firestore + Authentication, plano gratuito Spark), **mais**
uma única Netlify Function pequena (`netlify/functions/tts.js`) usada só
pela voz do Tradutor (ver item 6 abaixo) — por causa dela, o deploy deixou
de poder ser um simples "arrastar a pasta" no Netlify Drop; precisa ser
publicado via repositório Git conectado ao Netlify (ver seção Deploy em
[HISTORICO.md](HISTORICO.md)).

## Quem administra

Só duas pessoas têm poder de admin (ver [FIREBASE.md](FIREBASE.md)):
Eduardo Halas e a outra representante da turma. Cada uma loga com
e-mail/senha criados manualmente no Firebase Console (não existe
cadastro público no site).

## Seções do site (menu lateral)

1. **Mural** — quadro de tarefas por matéria, só admin adiciona/edita/apaga.
2. **Mérito** — calculadora de média por matéria (Diamante ≥9,5, Ouro 9,0–9,4).
3. **Dúvidas** — qualquer um manda uma dúvida; admin responde; dúvida
   respondida vira pública (tipo FAQ).
4. **Horário** — tabela fixa com o horário de aula da turma.
5. **Versículo** — versículo bíblico diferente a cada dia (client-side, sem backend).
6. **Tradutor** — praticamente todo o projeto `audioT` (tradutor por voz/
   texto) portado pro mural: 34 idiomas, falar/transcrever, áudio
   automático, modo papagaio, histórico, favoritos, flashcards, palavra
   do dia, editor de vocabulário e 4 modos de quiz — tudo client-side,
   sem backend (só ficou de fora o Mundo Aberto/mapas; ver
   [ARQUITETURA.md](ARQUITETURA.md) e [FUNCIONALIDADES.md](FUNCIONALIDADES.md)).

## Extras de interface

- Alternância manual de tema claro/escuro (switch arrastável).
- Alternância manual de visual "computador" ou "celular" (força o
  layout independente do tamanho real da tela).
- Logo da escola como marca d'água no espaço vazio em telas largas.
- Crédito "Feito por Eduardo Halas" no canto da página.

## Arquivos do projeto (raiz)

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura da página (todas as seções, modais) |
| `style.css` | Todo o visual (tokens de tema, responsivo, componentes) |
| `tradutor.css` | Visual só da seção Tradutor (escopado em `#tradutorSection`) |
| `tradutor-dicionario.json` | Palavras (fácil/médio/difícil) do quiz do Tradutor, cópia de `audioT/dicionario.json` |
| `tradutor-textos-quiz.json` | Parágrafos (fácil/médio/difícil) do Quiz de Texto, cópia de `audioT/textos_quiz.json` |
| `netlify/functions/tts.js` | Netlify Function — gera a voz real do Tradutor (proxy do RPC do Google que a lib `gTTS` usa, contornando CORS) |
| `netlify.toml` | Configuração do Netlify (aponta a pasta de Functions) |
| `app.js` | Toda a lógica (Firebase, renderização, formulários, listeners) |
| `firebase-config.js` | Chaves do projeto Firebase (públicas, não são segredo) |
| `firestore.rules` | Regras de segurança do Firestore (colar no Console) |
| `versiculos.json` | Lista de versículos bíblicos para o "Versículo do dia" |
| `LogotipoAdventista.svg.webp` | Logo da escola (marca d'água) |

Para detalhes técnicos de arquitetura veja [ARQUITETURA.md](ARQUITETURA.md),
pra lista de funcionalidades veja [FUNCIONALIDADES.md](FUNCIONALIDADES.md),
pra tudo sobre Firebase/regras veja [FIREBASE.md](FIREBASE.md), e pro
histórico de pedidos/mudanças veja [HISTORICO.md](HISTORICO.md).
