import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------------------------------------------------------------------------
// Matérias conhecidas e suas cores. Edite à vontade para bater com sua turma.
// ---------------------------------------------------------------------------
const SUBJECTS = [
  { name: "Biologia", color: "var(--c1)", emoji: "🧬" },
  { name: "Química", color: "var(--c2)", emoji: "🧪" },
  { name: "Matemática", color: "var(--c3)", emoji: "🧮" },
  { name: "Inglês", color: "var(--c4)", emoji: "🇬🇧" },
  { name: "História", color: "var(--c5)", emoji: "🏛️" },
  { name: "Física", color: "var(--c6)", emoji: "⚛️" },
  { name: "Projeto de Vida", color: "var(--c7)", emoji: "🎯" },
  { name: "Educação Física", color: "var(--c8)", emoji: "⚽" },
  { name: "Arte", color: "var(--c9)", emoji: "🎨" },
  { name: "Ensino Religioso", color: "var(--c10)", emoji: "✝️" },
  { name: "Geografia", color: "var(--c11)", emoji: "🗺️" },
  { name: "Argumentação", color: "var(--c12)", emoji: "🗣️" },
  { name: "Língua Portuguesa", color: "var(--c13)", emoji: "✍️" },
  { name: "Literatura", color: "var(--c14)", emoji: "📚" },
  { name: "Simulados", color: "var(--c15)", emoji: "🎓" },
];
const FALLBACK_PALETTE = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)", "var(--c8)", "var(--c9)", "var(--c10)", "var(--c11)", "var(--c12)", "var(--c13)", "var(--c14)", "var(--c15)"];
const FALLBACK_EMOJI = "📘";

// Categorias extras que só existem no Mural (não entram no Mérito, já que não são matéria com nota).
const MURAL_ONLY_CATEGORIES = [
  { name: "Aviso", color: "var(--warning)", emoji: "📢" },
];

function getMuralSubjectList() {
  return [...MURAL_ONLY_CATEGORIES, ...SUBJECTS];
}

function colorForSubject(name) {
  const known = getMuralSubjectList().find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (known) return known.color;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

function emojiForSubject(name) {
  const known = getMuralSubjectList().find((s) => s.name.toLowerCase() === name.toLowerCase());
  return known ? known.emoji : FALLBACK_EMOJI;
}

// ---------------------------------------------------------------------------
// Elementos
// ---------------------------------------------------------------------------
const el = {
  setupNotice: document.getElementById("setupNotice"),
  filterBar: document.getElementById("filterBar"),
  board: document.getElementById("board"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  loginModal: document.getElementById("loginModal"),
  loginForm: document.getElementById("loginForm"),
  loginError: document.getElementById("loginError"),
  taskModal: document.getElementById("taskModal"),
  taskForm: document.getElementById("taskForm"),
  taskError: document.getElementById("taskError"),
  taskTitle: document.getElementById("taskTitle"),
  taskSubmitBtn: document.getElementById("taskSubmitBtn"),
  taskMateria: document.getElementById("taskMateria"),
  taskPrazo: document.getElementById("taskPrazo"),
  taskDescricao: document.getElementById("taskDescricao"),
  taskLink: document.getElementById("taskLink"),
  toast: document.getElementById("toast"),
  temaSeletor: document.getElementById("temaSeletor"),
  temaEditarBtn: document.getElementById("temaEditarBtn"),
  temaEditarModal: document.getElementById("temaEditarModal"),
  temaCoresArea: document.getElementById("temaCoresArea"),
  temaRedefinirBtn: document.getElementById("temaRedefinirBtn"),
  viewToggle: document.getElementById("viewToggle"),
  duvidaFormWrap: document.getElementById("duvidaFormWrap"),
  duvidaListWrap: document.getElementById("duvidaListWrap"),
  duvidaForm: document.getElementById("duvidaForm"),
  duvidaNome: document.getElementById("duvidaNome"),
  duvidaTexto: document.getElementById("duvidaTexto"),
  duvidaError: document.getElementById("duvidaError"),
  duvidaList: document.getElementById("duvidaList"),
  duvidaEmpty: document.getElementById("duvidaEmpty"),
  ideiaFormWrap: document.getElementById("ideiaFormWrap"),
  ideiaListWrap: document.getElementById("ideiaListWrap"),
  ideiaForm: document.getElementById("ideiaForm"),
  ideiaNome: document.getElementById("ideiaNome"),
  ideiaTexto: document.getElementById("ideiaTexto"),
  ideiaError: document.getElementById("ideiaError"),
  ideiaList: document.getElementById("ideiaList"),
  ideiaEmpty: document.getElementById("ideiaEmpty"),
  addEnqueteBtn: document.getElementById("addEnqueteBtn"),
  enqueteEmpty: document.getElementById("enqueteEmpty"),
  enqueteList: document.getElementById("enqueteList"),
  enqueteModal: document.getElementById("enqueteModal"),
  enqueteForm: document.getElementById("enqueteForm"),
  enquetePergunta: document.getElementById("enquetePergunta"),
  enqueteOpcoesArea: document.getElementById("enqueteOpcoesArea"),
  enqueteAddOpcaoBtn: document.getElementById("enqueteAddOpcaoBtn"),
  enqueteError: document.getElementById("enqueteError"),
  arteForm: document.getElementById("arteForm"),
  arteNome: document.getElementById("arteNome"),
  arteArtista: document.getElementById("arteArtista"),
  arteInstagram: document.getElementById("arteInstagram"),
  arteError: document.getElementById("arteError"),
  arteEmpty: document.getElementById("arteEmpty"),
  arteList: document.getElementById("arteList"),
  duvidaPublicList: document.getElementById("duvidaPublicList"),
  duvidaPublicEmpty: document.getElementById("duvidaPublicEmpty"),
  commentsModal: document.getElementById("commentsModal"),
  commentsTitle: document.getElementById("commentsTitle"),
  commentsList: document.getElementById("commentsList"),
  commentsEmpty: document.getElementById("commentsEmpty"),
  commentForm: document.getElementById("commentForm"),
  commentNome: document.getElementById("commentNome"),
  commentTexto: document.getElementById("commentTexto"),
  versiculoChatEmpty: document.getElementById("versiculoChatEmpty"),
  versiculoChatList: document.getElementById("versiculoChatList"),
  versiculoChatForm: document.getElementById("versiculoChatForm"),
  versiculoChatNome: document.getElementById("versiculoChatNome"),
  versiculoChatTexto: document.getElementById("versiculoChatTexto"),
  visitasHojeTag: document.getElementById("visitasHojeTag"),
  visitasHojeNum: document.getElementById("visitasHojeNum"),
};

// ---------------------------------------------------------------------------
// Paleta de tema (portado do "personalizar paleta" do audioT original)
// ---------------------------------------------------------------------------
// 6 temas prontos (dia/noite/frio/deserto/tundra/ceu, definidos como bloco
// CSS `:root[data-theme="..."]` em style.css) + "personalizado", cujas
// cores de verdade vêm do localStorage e são aplicadas como estilo inline
// em <html> (documentElement.style.setProperty), que tem prioridade sobre
// o bloco CSS `:root[data-theme="personalizado"]` (esse é só um valor de
// fallback, usado até o JS carregar). Mesma técnica de duas camadas do
// audioT original, só que adaptada pro conjunto de variáveis daqui.
const TEMA_VARS_PERSONALIZADO = {
  bg: "--bg", bgAlt: "--bg-alt", surface: "--surface", surface2: "--surface-2",
  text: "--text", textMuted: "--text-muted", border: "--border",
  accent: "--accent", accent2: "--accent-2", accentContrast: "--accent-contrast",
};
const TEMA_LABELS_CORES = {
  bg: "Fundo", bgAlt: "Fundo (alternativo)", surface: "Cartão", surface2: "Cartão (alternativo)",
  text: "Texto", textMuted: "Texto secundário", border: "Borda",
  accent: "Destaque", accent2: "Destaque (secundário)", accentContrast: "Texto sobre o destaque",
};
// = valores do tema "noite" (mesmo critério do audioT: o personalizado
// nasce como cópia do tema escuro padrão).
const TEMA_PADRAO_PERSONALIZADO = {
  bg: "#0C0E14", bgAlt: "#141722", surface: "#181C29", surface2: "#11131C",
  text: "#EEF0F8", textMuted: "#9AA0B4", border: "#262B3A",
  accent: "#7583FF", accent2: "#9B8CFF", accentContrast: "#0A0C13",
};
// usado pelo botão "Redefinir cores" - paleta preto/branco/cinza neutra
const TEMA_PRETO_BRANCO = {
  bg: "#000000", bgAlt: "#0D0D0D", surface: "#1A1A1A", surface2: "#141414",
  text: "#FFFFFF", textMuted: "#B3B3B3", border: "#333333",
  accent: "#595959", accent2: "#404040", accentContrast: "#FFFFFF",
};
const TEMA_KEY = "theme";
const TEMA_PERSONALIZADO_KEY = "temaPersonalizado";

function carregarTemaPersonalizado() {
  try {
    const salvo = JSON.parse(localStorage.getItem(TEMA_PERSONALIZADO_KEY));
    return { ...TEMA_PADRAO_PERSONALIZADO, ...(salvo || {}) };
  } catch {
    return { ...TEMA_PADRAO_PERSONALIZADO };
  }
}
function salvarTemaPersonalizado(cores) {
  localStorage.setItem(TEMA_PERSONALIZADO_KEY, JSON.stringify(cores));
}
function aplicarCoresPersonalizadas(cores) {
  Object.entries(TEMA_VARS_PERSONALIZADO).forEach(([chave, varCss]) => {
    document.documentElement.style.setProperty(varCss, cores[chave]);
  });
}
function limparCoresInline() {
  Object.values(TEMA_VARS_PERSONALIZADO).forEach((varCss) => {
    document.documentElement.style.removeProperty(varCss);
  });
}

function aplicarTema(nome) {
  document.documentElement.setAttribute("data-theme", nome);
  limparCoresInline();
  if (nome === "personalizado") {
    aplicarCoresPersonalizadas(carregarTemaPersonalizado());
  }
  el.temaSeletor.querySelectorAll(".tema-seg-btn").forEach((btn) => {
    btn.classList.toggle("ativo", btn.dataset.tema === nome);
  });
}

aplicarTema(document.documentElement.getAttribute("data-theme") || "dia");

el.temaSeletor.querySelectorAll(".tema-seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    aplicarTema(btn.dataset.tema);
    localStorage.setItem(TEMA_KEY, btn.dataset.tema);
  });
});

function montarEditorTemaPersonalizado() {
  const area = el.temaCoresArea;
  area.innerHTML = "";
  const cores = carregarTemaPersonalizado();

  Object.keys(TEMA_VARS_PERSONALIZADO).forEach((chave) => {
    const linha = document.createElement("div");
    linha.className = "tema-linha-cor";

    const label = document.createElement("span");
    label.textContent = TEMA_LABELS_CORES[chave];

    const input = document.createElement("input");
    input.type = "color";
    input.value = cores[chave];
    input.addEventListener("input", () => {
      cores[chave] = input.value;
      salvarTemaPersonalizado(cores);
      aplicarCoresPersonalizadas(cores);
    });

    linha.append(label, input);
    area.appendChild(linha);
  });
}

el.temaEditarBtn.addEventListener("click", () => {
  aplicarTema("personalizado");
  localStorage.setItem(TEMA_KEY, "personalizado");
  montarEditorTemaPersonalizado();
  openModal(el.temaEditarModal);
});

el.temaRedefinirBtn.addEventListener("click", () => {
  const cores = { ...TEMA_PRETO_BRANCO };
  salvarTemaPersonalizado(cores);
  aplicarCoresPersonalizadas(cores);
  montarEditorTemaPersonalizado();
});

// ---------------------------------------------------------------------------
// Visual de computador / celular (forçado, independente do aparelho real)
// ---------------------------------------------------------------------------
function syncViewButton() {
  const view = document.documentElement.getAttribute("data-view") || "desktop";
  el.viewToggle.setAttribute("aria-checked", view === "mobile" ? "true" : "false");
}
syncViewButton();
el.viewToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-view");
  const next = current === "mobile" ? "desktop" : "mobile";
  document.documentElement.setAttribute("data-view", next);
  localStorage.setItem("viewMode", next);
  syncViewButton();
});

// Sem escolha manual salva: acompanha o tamanho real da janela
window.addEventListener("resize", () => {
  if (localStorage.getItem("viewMode")) return;
  const auto = window.innerWidth < 640 ? "mobile" : "desktop";
  document.documentElement.setAttribute("data-view", auto);
  syncViewButton();
});

// ---------------------------------------------------------------------------
// Navegação lateral
// ---------------------------------------------------------------------------
const sidebarItems = document.querySelectorAll(".sidebar-item");
const appSections = document.querySelectorAll(".app-section");
sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    sidebarItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    const targetId = item.dataset.section;
    appSections.forEach((section) => { section.hidden = section.id !== targetId; });
  });
});

// ---------------------------------------------------------------------------
// Versículo do dia
// ---------------------------------------------------------------------------
const versiculoTextoEl = document.getElementById("versiculoTexto");
const versiculoRefEl = document.getElementById("versiculoRef");

fetch("versiculos.json")
  .then((res) => res.json())
  .then((versiculos) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000);
    const versiculo = versiculos[dayOfYear % versiculos.length];
    versiculoTextoEl.textContent = `"${versiculo.texto}"`;
    versiculoRefEl.textContent = versiculo.referencia;
  })
  .catch(() => {
    versiculoTextoEl.textContent = "Não foi possível carregar o versículo de hoje.";
  });

// ---------------------------------------------------------------------------
// Mérito: calculadora de média do boletim
// ---------------------------------------------------------------------------
const meritoGrid = document.getElementById("meritoGrid");
const meritoResult = document.getElementById("meritoResult");
const meritoBadge = document.getElementById("meritoBadge");
const meritoAvgText = document.getElementById("meritoAvgText");
const itinerarioButtons = document.querySelectorAll(".merito-itinerario-btn");
const MERITO_KEY = "meritoGrades";
const MERITO_ITINERARIO_KEY = "meritoItinerario";

// Matérias comuns aos dois itinerários, além das já usadas no mural.
const MERITO_EXTRA_COMUNS = [
  "Cultura Geral",
  "Metodologia Científica",
  "Inv. Matemática",
];
const MERITO_ITINERARIO_MATERIAS = {
  humanas: ["Debates Contemporâneos", "AP História", "AP Geografia"],
  exatas: ["AP Biologia", "AP Química", "AP Física"],
};
// Contam no Mural (têm tarefa/nota normal), mas não entram no cálculo do
// Mérito - pedido do usuário (não são cobradas no boletim do Mérito).
const MERITO_MATERIAS_EXCLUIDAS = ["Literatura"];

let meritoItinerario = localStorage.getItem(MERITO_ITINERARIO_KEY) || null;
let meritoInputs = new Map();

function getMeritoSubjectNames() {
  const names = [
    ...SUBJECTS.map((s) => s.name).filter((name) => !MERITO_MATERIAS_EXCLUIDAS.includes(name)),
    ...MERITO_EXTRA_COMUNS,
  ];
  if (meritoItinerario && MERITO_ITINERARIO_MATERIAS[meritoItinerario]) {
    names.push(...MERITO_ITINERARIO_MATERIAS[meritoItinerario]);
  }
  return names;
}

function syncItinerarioButtons() {
  itinerarioButtons.forEach((btn) => {
    btn.classList.toggle("chip-active", btn.dataset.itinerario === meritoItinerario);
  });
}

function buildMeritoGrid() {
  const savedGrades = JSON.parse(localStorage.getItem(MERITO_KEY) || "{}");
  meritoInputs = new Map();
  meritoGrid.innerHTML = "";

  getMeritoSubjectNames().forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "merito-row";

    const inputId = `merito-${index}`;
    const label = document.createElement("label");
    label.textContent = name;
    label.htmlFor = inputId;

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = "-";
    input.id = inputId;
    input.setAttribute("aria-label", `Nota de ${name}`);
    if (savedGrades[name] != null) input.value = savedGrades[name];

    input.addEventListener("input", () => {
      const grades = JSON.parse(localStorage.getItem(MERITO_KEY) || "{}");
      if (input.value.trim() === "") delete grades[name];
      else grades[name] = input.value.trim();
      localStorage.setItem(MERITO_KEY, JSON.stringify(grades));
      computeMerito();
    });

    row.append(label, input);
    meritoGrid.appendChild(row);
    meritoInputs.set(name, input);
  });

  computeMerito();
}

itinerarioButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    meritoItinerario = btn.dataset.itinerario;
    localStorage.setItem(MERITO_ITINERARIO_KEY, meritoItinerario);
    syncItinerarioButtons();
    buildMeritoGrid();
  });
});

function computeMerito() {
  const values = [];
  meritoInputs.forEach((input) => {
    const raw = input.value.trim().replace(",", ".");
    if (raw === "") return;
    const num = parseFloat(raw);
    if (!isNaN(num)) values.push(num);
  });

  if (values.length === 0) {
    meritoResult.hidden = true;
    return;
  }

  const avgBruta = values.reduce((a, b) => a + b, 0) / values.length;
  // arredonda pro 0,5 mais próximo (é assim que a escola do usuário
  // arredonda o boletim - ex: 9,45 vira 9,5, 8,95 vira 9,0)
  const avg = Math.round(avgBruta * 2) / 2;
  let icon, label;
  if (avg >= 9.5) { icon = "💎"; label = "Diamante"; }
  else if (avg >= 9) { icon = "🥇"; label = "Ouro"; }
  else { icon = "🔸"; label = "Ainda sem nível"; }

  meritoBadge.textContent = icon;
  meritoAvgText.textContent = `Média: ${avg.toFixed(2).replace(".", ",")} — ${label}`;
  meritoResult.hidden = false;
}

syncItinerarioButtons();
buildMeritoGrid();

let toastTimer = null;
function showToast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3200);
}

function openModal(modal) {
  modal.hidden = false;
  const firstField = modal.querySelector("input, select, textarea");
  if (firstField) firstField.focus();
}
function closeModal(modal) {
  modal.hidden = true;
}
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal(overlay);
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-overlay:not([hidden])").forEach(closeModal);
  }
});

// Popula o select de matérias
getMuralSubjectList().forEach((subject) => {
  const opt = document.createElement("option");
  opt.value = subject.name;
  opt.textContent = subject.name;
  el.taskMateria.appendChild(opt);
});

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------
function parseDateLocal(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
function formatDate(isoDate) {
  return parseDateLocal(isoDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function dueBadge(isoDate) {
  const diffMs = parseDateLocal(isoDate) - startOfToday();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays < 0) return { text: "Atrasada", cls: "badge-overdue" };
  if (diffDays === 0) return { text: "Vence hoje", cls: "badge-soon" };
  if (diffDays === 1) return { text: "Vence amanhã", cls: "badge-soon" };
  if (diffDays <= 3) return { text: `Faltam ${diffDays} dias`, cls: "badge-soon" };
  return { text: `Faltam ${diffDays} dias`, cls: "badge-normal" };
}
// Tarefa vencida some sozinha do mural (pedido do usuário: nenhum card deve
// aparecer com a etiqueta "Atrasada") - não apaga do Firestore, só não
// renderiza; ver HISTORICO.md.
function isTarefaVencida(task) {
  return dueBadge(task.prazo).cls === "badge-overdue";
}

function isSafeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let allTasks = [];
let isAdmin = false;
let activeFilter = "Todas";
let editingTaskId = null;
let db = null;
let currentCommentTaskId = null;
let unsubscribeComments = null;

// ---------------------------------------------------------------------------
// Filtro por matéria
// ---------------------------------------------------------------------------
function renderFilterBar() {
  const tarefasAtivas = allTasks.filter((t) => !isTarefaVencida(t));
  const present = [
    ...getMuralSubjectList().map((s) => s.name).filter((name) => tarefasAtivas.some((t) => t.materia === name)),
    ...[...new Set(tarefasAtivas.map((t) => t.materia))].filter((name) => !getMuralSubjectList().some((s) => s.name === name)),
  ];

  if (present.length === 0) {
    el.filterBar.hidden = true;
    el.filterBar.innerHTML = "";
    return;
  }
  el.filterBar.hidden = false;
  el.filterBar.innerHTML = "";

  const makeChip = (label, colorVar) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (activeFilter === label ? " chip-active" : "");
    if (colorVar) chip.style.setProperty("--chip-color", colorVar);
    chip.textContent = label;
    chip.addEventListener("click", () => {
      activeFilter = label;
      renderFilterBar();
      renderBoard();
    });
    return chip;
  };

  el.filterBar.appendChild(makeChip("Todas", null));
  present.forEach((name) => el.filterBar.appendChild(makeChip(name, colorForSubject(name))));
}

// ---------------------------------------------------------------------------
// Renderização do mural
// ---------------------------------------------------------------------------
function renderBoard() {
  el.loadingState.hidden = true;

  const tasks = (activeFilter === "Todas" ? allTasks : allTasks.filter((t) => t.materia === activeFilter)).filter((t) => !isTarefaVencida(t));

  if (tasks.length === 0) {
    el.emptyState.hidden = false;
    el.board.innerHTML = "";
    return;
  }
  el.emptyState.hidden = true;

  const groups = new Map();
  tasks.forEach((task) => {
    if (!groups.has(task.materia)) groups.set(task.materia, []);
    groups.get(task.materia).push(task);
  });

  // Ordena as seções de matéria pela tarefa mais urgente (menos tempo até vencer primeiro).
  const subjectListOrder = getMuralSubjectList().map((s) => s.name);
  const groupUrgency = new Map();
  groups.forEach((items, materia) => {
    const pending = items.filter((t) => !t.concluida);
    const relevant = pending.length > 0 ? pending : items;
    const minPrazo = relevant.reduce((min, t) => (t.prazo < min ? t.prazo : min), relevant[0].prazo);
    groupUrgency.set(materia, minPrazo);
  });
  const orderedNames = [...groups.keys()].sort((a, b) => {
    const cmp = groupUrgency.get(a).localeCompare(groupUrgency.get(b));
    if (cmp !== 0) return cmp;
    return subjectListOrder.indexOf(a) - subjectListOrder.indexOf(b);
  });

  el.board.innerHTML = "";
  orderedNames.forEach((materia) => {
    const items = groups.get(materia).slice().sort((a, b) => {
      if (!!a.concluida !== !!b.concluida) return a.concluida ? 1 : -1;
      return a.prazo.localeCompare(b.prazo);
    });
    const color = colorForSubject(materia);
    const emoji = emojiForSubject(materia);

    const section = document.createElement("section");

    const header = document.createElement("div");
    header.className = "subject-section-header";
    header.innerHTML = `
      <span class="subject-dot" style="color:${color}">${emoji}</span>
      <span class="subject-name">${escapeHtml(materia)}</span>
      <span class="subject-count">${items.length} ${items.length === 1 ? "tarefa" : "tarefas"}</span>
    `;
    if (window.twemoji) window.twemoji.parse(header, { folder: "svg", ext: ".svg" });
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "cards-grid";

    items.forEach((task) => {
      const badgeInfo = dueBadge(task.prazo);
      const card = document.createElement("article");
      card.className = "card" + (task.concluida ? " is-complete" : "");
      card.style.setProperty("--subject-color", color);

      const top = document.createElement("div");
      top.className = "card-top";
      const dateSpan = document.createElement("span");
      dateSpan.className = "card-date";
      dateSpan.textContent = formatDate(task.prazo);
      const badgeSpan = document.createElement("span");
      badgeSpan.className = `badge ${badgeInfo.cls}`;
      badgeSpan.textContent = badgeInfo.text;
      top.append(dateSpan, badgeSpan);
      card.appendChild(top);

      const desc = document.createElement("p");
      desc.className = "card-desc" + (task.concluida ? " is-done" : "");
      desc.textContent = task.descricao;
      card.appendChild(desc);

      if (task.link && isSafeUrl(task.link)) {
        const link = document.createElement("a");
        link.className = "card-link";
        link.href = task.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Abrir material ↗";
        card.appendChild(link);
      }

      const commentsBtn = document.createElement("button");
      commentsBtn.type = "button";
      commentsBtn.className = "comments-btn";
      commentsBtn.textContent = "💬 Comentários";
      commentsBtn.addEventListener("click", () => openCommentsModal(task.id, task.descricao));
      card.appendChild(commentsBtn);

      if (isAdmin) {
        const controls = document.createElement("div");
        controls.className = "card-admin-controls";

        const doneLabel = document.createElement("label");
        doneLabel.className = "card-done-toggle";
        const doneCheckbox = document.createElement("input");
        doneCheckbox.type = "checkbox";
        doneCheckbox.checked = !!task.concluida;
        doneCheckbox.addEventListener("change", () => toggleDone(task.id, doneCheckbox.checked));
        doneLabel.appendChild(doneCheckbox);
        doneLabel.append("Feita");
        controls.appendChild(doneLabel);

        const actions = document.createElement("div");
        actions.className = "card-actions";
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "text-btn";
        editBtn.textContent = "Editar";
        editBtn.addEventListener("click", () => openEditModal(task.id));
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "text-btn danger";
        delBtn.textContent = "Apagar";
        delBtn.addEventListener("click", () => handleDelete(task.id));
        actions.append(editBtn, delBtn);
        controls.appendChild(actions);

        card.appendChild(controls);
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);
    el.board.appendChild(section);
  });
}

// ---------------------------------------------------------------------------
// Formulário de tarefa (criar / editar)
// ---------------------------------------------------------------------------
function resetTaskForm() {
  el.taskForm.reset();
  editingTaskId = null;
  el.taskTitle.textContent = "Nova tarefa";
  el.taskSubmitBtn.textContent = "Adicionar tarefa";
  el.taskError.hidden = true;
}

function openAddModal() {
  resetTaskForm();
  openModal(el.taskModal);
}

function openEditModal(id) {
  const task = allTasks.find((t) => t.id === id);
  if (!task) return;
  resetTaskForm();
  editingTaskId = id;
  el.taskTitle.textContent = "Editar tarefa";
  el.taskSubmitBtn.textContent = "Salvar alterações";

  el.taskMateria.value = task.materia;
  el.taskPrazo.value = task.prazo;
  el.taskDescricao.value = task.descricao;
  el.taskLink.value = task.link || "";

  openModal(el.taskModal);
}

async function toggleDone(id, value) {
  try {
    await updateDoc(doc(db, "tarefas", id), { concluida: value });
  } catch (error) {
    showToast("Não foi possível atualizar.");
  }
}

async function handleDelete(id) {
  if (!confirm("Apagar essa tarefa? Essa ação não pode ser desfeita.")) return;
  try {
    await deleteDoc(doc(db, "tarefas", id));
    showToast("Tarefa apagada.");
  } catch (error) {
    showToast("Não foi possível apagar.");
  }
}

// ---------------------------------------------------------------------------
// Dúvidas
// ---------------------------------------------------------------------------
let unsubscribeDuvidas = null;
let unsubscribeDuvidasPublic = null;

function formatDuvidaDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "agora";
  return timestamp.toDate().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildReplyForm(item) {
  const form = document.createElement("form");
  form.className = "duvida-reply-form";

  const textarea = document.createElement("textarea");
  textarea.rows = 2;
  textarea.maxLength = 1500;
  textarea.placeholder = "Escreva a resposta...";
  textarea.value = item.resposta || "";

  const btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "btn btn-primary";
  btn.textContent = item.resposta ? "Atualizar resposta" : "Responder";

  form.append(textarea, btn);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resposta = textarea.value.trim();
    if (!resposta) return;
    try {
      await updateDoc(doc(db, "duvidas", item.id), { resposta, respondidoEm: serverTimestamp() });
      showToast("Resposta enviada!");
    } catch (error) {
      showToast("Não foi possível enviar a resposta.");
    }
  });

  return form;
}

function renderDuvidas(duvidas) {
  if (duvidas.length === 0) {
    el.duvidaEmpty.hidden = false;
    el.duvidaList.innerHTML = "";
    return;
  }
  el.duvidaEmpty.hidden = true;
  el.duvidaList.innerHTML = "";

  duvidas.forEach((item) => {
    const card = document.createElement("div");
    card.className = "duvida-card";

    const top = document.createElement("div");
    top.className = "duvida-card-top";
    const nome = document.createElement("strong");
    nome.className = "duvida-nome";
    nome.textContent = item.nome;
    const date = document.createElement("span");
    date.className = "duvida-date";
    date.textContent = formatDuvidaDate(item.criadoEm);
    top.append(nome, date);
    card.appendChild(top);

    const texto = document.createElement("p");
    texto.className = "duvida-texto";
    texto.textContent = item.duvida;
    card.appendChild(texto);

    if (item.resposta) {
      const respostaBox = document.createElement("div");
      respostaBox.className = "duvida-resposta";
      const label = document.createElement("strong");
      label.textContent = "Sua resposta:";
      const respostaTexto = document.createElement("p");
      respostaTexto.textContent = item.resposta;
      respostaBox.append(label, respostaTexto);
      card.appendChild(respostaBox);
    }

    card.appendChild(buildReplyForm(item));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "text-btn danger";
    delBtn.textContent = "Apagar";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Apagar essa dúvida?")) return;
      try {
        await deleteDoc(doc(db, "duvidas", item.id));
      } catch (error) {
        showToast("Não foi possível apagar.");
      }
    });
    card.appendChild(delBtn);

    el.duvidaList.appendChild(card);
  });
}

function renderDuvidasPublicas(duvidas) {
  const respondidas = duvidas.filter((d) => d.resposta);
  if (respondidas.length === 0) {
    el.duvidaPublicEmpty.hidden = false;
    el.duvidaPublicList.innerHTML = "";
    return;
  }
  el.duvidaPublicEmpty.hidden = true;
  el.duvidaPublicList.innerHTML = "";

  respondidas.forEach((item) => {
    const card = document.createElement("div");
    card.className = "duvida-card";

    const top = document.createElement("div");
    top.className = "duvida-card-top";
    const nome = document.createElement("strong");
    nome.className = "duvida-nome";
    nome.textContent = `Pergunta de ${item.nome}`;
    const date = document.createElement("span");
    date.className = "duvida-date";
    date.textContent = formatDuvidaDate(item.criadoEm);
    top.append(nome, date);
    card.appendChild(top);

    const texto = document.createElement("p");
    texto.className = "duvida-texto";
    texto.textContent = item.duvida;
    card.appendChild(texto);

    const respostaBox = document.createElement("div");
    respostaBox.className = "duvida-resposta";
    const label = document.createElement("strong");
    label.textContent = "Resposta:";
    const respostaTexto = document.createElement("p");
    respostaTexto.textContent = item.resposta;
    respostaBox.append(label, respostaTexto);
    card.appendChild(respostaBox);

    el.duvidaPublicList.appendChild(card);
  });
}

function startDuvidasListener() {
  if (unsubscribeDuvidas) return;
  unsubscribeDuvidas = onSnapshot(
    query(collection(db, "duvidas"), orderBy("criadoEm", "desc")),
    (snapshot) => renderDuvidas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error(error)
  );
}
function stopDuvidasListener() {
  if (unsubscribeDuvidas) {
    unsubscribeDuvidas();
    unsubscribeDuvidas = null;
  }
}

function startDuvidasPublicListener() {
  if (unsubscribeDuvidasPublic) return;
  unsubscribeDuvidasPublic = onSnapshot(
    query(collection(db, "duvidas"), orderBy("criadoEm", "desc")),
    (snapshot) => renderDuvidasPublicas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error(error)
  );
}
function stopDuvidasPublicListener() {
  if (unsubscribeDuvidasPublic) {
    unsubscribeDuvidasPublic();
    unsubscribeDuvidasPublic = null;
  }
}

// ---------------------------------------------------------------------------
// Ideias (mesmo mecanismo das Dúvidas, mas sem resposta/lista pública -
// é uma caixa de sugestões só pro admin ler)
// ---------------------------------------------------------------------------
let unsubscribeIdeias = null;

function renderIdeias(ideias) {
  if (ideias.length === 0) {
    el.ideiaEmpty.hidden = false;
    el.ideiaList.innerHTML = "";
    return;
  }
  el.ideiaEmpty.hidden = true;
  el.ideiaList.innerHTML = "";

  ideias.forEach((item) => {
    const card = document.createElement("div");
    card.className = "duvida-card";

    const top = document.createElement("div");
    top.className = "duvida-card-top";
    const nome = document.createElement("strong");
    nome.className = "duvida-nome";
    nome.textContent = item.nome;
    const date = document.createElement("span");
    date.className = "duvida-date";
    date.textContent = formatDuvidaDate(item.criadoEm);
    top.append(nome, date);
    card.appendChild(top);

    const texto = document.createElement("p");
    texto.className = "duvida-texto";
    texto.textContent = item.ideia;
    card.appendChild(texto);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "text-btn danger";
    delBtn.textContent = "Apagar";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Apagar essa ideia?")) return;
      try {
        await deleteDoc(doc(db, "ideias", item.id));
      } catch (error) {
        showToast("Não foi possível apagar.");
      }
    });
    card.appendChild(delBtn);

    el.ideiaList.appendChild(card);
  });
}

function startIdeiasListener() {
  if (unsubscribeIdeias) return;
  unsubscribeIdeias = onSnapshot(
    query(collection(db, "ideias"), orderBy("criadoEm", "desc")),
    (snapshot) => renderIdeias(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error(error)
  );
}
function stopIdeiasListener() {
  if (unsubscribeIdeias) {
    unsubscribeIdeias();
    unsubscribeIdeias = null;
  }
}

// ---------------------------------------------------------------------------
// Enquetes - só admin cria, qualquer um vota uma vez (guardado no
// localStorage pra trocar o botão de opção pelo resultado depois de
// votar; não é à prova de gente limpando o navegador, mas é o mesmo
// nível de confiança usado no resto do site).
// ---------------------------------------------------------------------------
let allEnquetes = [];
const ENQUETE_VOTOS_KEY = "enqueteVotos";

function lerVotosEnquete() {
  try {
    return JSON.parse(localStorage.getItem(ENQUETE_VOTOS_KEY)) || {};
  } catch {
    return {};
  }
}
function salvarVotoEnquete(enqueteId, indice) {
  const votos = lerVotosEnquete();
  votos[enqueteId] = indice;
  localStorage.setItem(ENQUETE_VOTOS_KEY, JSON.stringify(votos));
}

async function votarEnquete(enqueteId, indice) {
  try {
    await updateDoc(doc(db, "enquetes", enqueteId), { [`votos.${indice}`]: increment(1) });
    salvarVotoEnquete(enqueteId, indice);
  } catch {
    showToast("Não foi possível registrar seu voto.");
  }
}

function renderEnquetes() {
  if (allEnquetes.length === 0) {
    el.enqueteEmpty.hidden = false;
    el.enqueteList.innerHTML = "";
    return;
  }
  el.enqueteEmpty.hidden = true;
  el.enqueteList.innerHTML = "";

  const votosFeitos = lerVotosEnquete();

  allEnquetes.forEach((enquete) => {
    const card = document.createElement("div");
    card.className = "duvida-card";

    const pergunta = document.createElement("p");
    pergunta.className = "enquete-pergunta";
    pergunta.textContent = enquete.pergunta;
    card.appendChild(pergunta);

    const votos = enquete.votos || {};
    const total = Object.values(votos).reduce((a, b) => a + b, 0);

    const totalEl = document.createElement("span");
    totalEl.className = "enquete-total";
    totalEl.textContent = `${total} ${total === 1 ? "voto" : "votos"}`;
    card.appendChild(totalEl);

    const jaVotouIndice = votosFeitos[enquete.id];
    const opcoesWrap = document.createElement("div");
    opcoesWrap.className = "enquete-opcoes";

    (enquete.opcoes || []).forEach((opcao, indice) => {
      const contagem = votos[String(indice)] || 0;

      if (jaVotouIndice === undefined) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "enquete-opcao-btn";
        btn.textContent = opcao;
        btn.addEventListener("click", () => votarEnquete(enquete.id, indice));
        opcoesWrap.appendChild(btn);
      } else {
        const pct = total > 0 ? Math.round((contagem / total) * 100) : 0;
        const resultado = document.createElement("div");
        resultado.className = "enquete-resultado" + (indice === jaVotouIndice ? " votada" : "");

        const barra = document.createElement("div");
        barra.className = "enquete-resultado-barra";
        barra.style.width = `${pct}%`;

        const info = document.createElement("div");
        info.className = "enquete-resultado-info";
        const label = document.createElement("span");
        label.textContent = opcao + (indice === jaVotouIndice ? " ✓" : "");
        const pctSpan = document.createElement("span");
        pctSpan.textContent = `${pct}% (${contagem})`;
        info.append(label, pctSpan);

        resultado.append(barra, info);
        opcoesWrap.appendChild(resultado);
      }
    });
    card.appendChild(opcoesWrap);

    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "text-btn danger";
      delBtn.textContent = "Apagar";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Apagar essa enquete?")) return;
        try {
          await deleteDoc(doc(db, "enquetes", enquete.id));
        } catch {
          showToast("Não foi possível apagar.");
        }
      });
      card.appendChild(delBtn);
    }

    el.enqueteList.appendChild(card);
  });
}

function iniciarEnquetes() {
  onSnapshot(
    query(collection(db, "enquetes"), orderBy("criadoEm", "desc")),
    (snapshot) => {
      allEnquetes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderEnquetes();
    },
    (error) => console.error(error)
  );
}

function criarLinhaOpcaoEnquete(valor = "") {
  const row = document.createElement("div");
  row.className = "enquete-opcao-input-row";

  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 100;
  input.placeholder = "Opção";
  input.value = valor;

  const removerBtn = document.createElement("button");
  removerBtn.type = "button";
  removerBtn.className = "text-btn danger";
  removerBtn.textContent = "✖";
  removerBtn.addEventListener("click", () => {
    if (el.enqueteOpcoesArea.children.length > 2) row.remove();
  });

  row.append(input, removerBtn);
  return row;
}

function resetarFormEnquete() {
  el.enqueteForm.reset();
  el.enqueteError.hidden = true;
  el.enqueteOpcoesArea.innerHTML = "";
  el.enqueteOpcoesArea.appendChild(criarLinhaOpcaoEnquete());
  el.enqueteOpcoesArea.appendChild(criarLinhaOpcaoEnquete());
}

el.addEnqueteBtn.addEventListener("click", () => {
  resetarFormEnquete();
  openModal(el.enqueteModal);
});

el.enqueteAddOpcaoBtn.addEventListener("click", () => {
  if (el.enqueteOpcoesArea.children.length >= 6) return;
  el.enqueteOpcoesArea.appendChild(criarLinhaOpcaoEnquete());
});

// ---------------------------------------------------------------------------
// Artes (TEMPORÁRIO - trabalho de artes da turma, usuário vai remover essa
// seção inteira depois que o trabalho acabar: tirar o botão do menu lateral
// e a seção em index.html, este bloco em app.js, o CSS ".arte-*" em
// style.css e o `match /trabalhoArtes/{id}` em firestore.rules).
// Público lê e cria (igual comentários de tarefa); só admin apaga.
// ---------------------------------------------------------------------------
let allArtes = [];

function renderArtes(itens) {
  if (itens.length === 0) {
    el.arteEmpty.hidden = false;
    el.arteList.innerHTML = "";
    return;
  }
  el.arteEmpty.hidden = true;
  el.arteList.innerHTML = "";

  itens.forEach((item) => {
    const card = document.createElement("div");
    card.className = "arte-card";

    const handle = document.createElement("p");
    handle.className = "arte-card-handle";
    handle.textContent = item.instagram;
    card.appendChild(handle);

    const artista = document.createElement("p");
    artista.className = "arte-card-artista";
    artista.textContent = item.artista;
    card.appendChild(artista);

    const autor = document.createElement("p");
    autor.className = "arte-card-autor";
    autor.textContent = `Criado por ${item.nome}`;
    card.appendChild(autor);

    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "text-btn danger";
      delBtn.textContent = "Apagar";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Apagar esse post?")) return;
        try {
          await deleteDoc(doc(db, "trabalhoArtes", item.id));
        } catch {
          showToast("Não foi possível apagar.");
        }
      });
      card.appendChild(delBtn);
    }

    el.arteList.appendChild(card);
  });
}

function iniciarArtes() {
  onSnapshot(
    query(collection(db, "trabalhoArtes"), orderBy("criadoEm", "desc")),
    (snapshot) => {
      allArtes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderArtes(allArtes);
    },
    (error) => console.error(error)
  );
}

// ---------------------------------------------------------------------------
// Comentários (por tarefa)
// ---------------------------------------------------------------------------
const COMMENT_NAME_KEY = "commentName";
const savedCommentName = localStorage.getItem(COMMENT_NAME_KEY);
if (savedCommentName) el.commentNome.value = savedCommentName;
if (savedCommentName) el.versiculoChatNome.value = savedCommentName;

function formatCommentDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "agora";
  return timestamp.toDate().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function renderComments(comments) {
  if (comments.length === 0) {
    el.commentsEmpty.hidden = false;
    el.commentsList.innerHTML = "";
    return;
  }
  el.commentsEmpty.hidden = true;
  el.commentsList.innerHTML = "";

  comments.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "comment-item";

    const top = document.createElement("div");
    top.className = "comment-item-top";
    const nome = document.createElement("span");
    nome.className = "comment-nome";
    nome.textContent = item.nome;
    const date = document.createElement("span");
    date.className = "comment-date";
    date.textContent = formatCommentDate(item.criadoEm);
    top.append(nome, date);
    wrap.appendChild(top);

    const texto = document.createElement("p");
    texto.className = "comment-texto";
    texto.textContent = item.texto;
    wrap.appendChild(texto);

    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "text-btn danger";
      delBtn.textContent = "Apagar";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Apagar esse comentário?")) return;
        try {
          await deleteDoc(doc(db, "tarefas", currentCommentTaskId, "comentarios", item.id));
        } catch (error) {
          showToast("Não foi possível apagar.");
        }
      });
      wrap.appendChild(delBtn);
    }

    el.commentsList.appendChild(wrap);
  });

  el.commentsList.scrollTop = el.commentsList.scrollHeight;
}

function openCommentsModal(taskId, taskDescricao) {
  currentCommentTaskId = taskId;
  el.commentsTitle.textContent = taskDescricao
    ? `Comentários — ${taskDescricao.length > 40 ? taskDescricao.slice(0, 40) + "…" : taskDescricao}`
    : "Comentários";
  el.commentsEmpty.hidden = true;
  el.commentsList.innerHTML = "";
  openModal(el.commentsModal);

  if (unsubscribeComments) unsubscribeComments();
  unsubscribeComments = onSnapshot(
    query(collection(db, "tarefas", taskId, "comentarios"), orderBy("criadoEm", "asc")),
    (snapshot) => renderComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error(error)
  );
}

function stopCommentsListener() {
  if (unsubscribeComments) {
    unsubscribeComments();
    unsubscribeComments = null;
  }
  currentCommentTaskId = null;
}

document.querySelector('[data-close="commentsModal"]').addEventListener("click", stopCommentsListener);
el.commentsModal.addEventListener("click", (event) => {
  if (event.target === el.commentsModal) stopCommentsListener();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.commentsModal.hidden) stopCommentsListener();
});

// ---------------------------------------------------------------------------
// Chat do versículo do dia
// ---------------------------------------------------------------------------
// Sem coleção separada pra "apagar" o chat todo dia: as mensagens ficam
// guardadas sob a data de hoje (versiculoComentarios/AAAA-MM-DD/mensagens),
// então quando o dia vira e o versículo muda, o chat de hoje já nasce vazio
// sozinho - não precisa de nenhuma limpeza/reset explícito. As mensagens de
// dias anteriores continuam existindo no Firestore, só nunca mais aparecem.
let unsubscribeVersiculoChat = null;

function chaveDataVersiculo() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function renderVersiculoChat(mensagens) {
  if (mensagens.length === 0) {
    el.versiculoChatEmpty.hidden = false;
    el.versiculoChatList.innerHTML = "";
    return;
  }
  el.versiculoChatEmpty.hidden = true;
  el.versiculoChatList.innerHTML = "";

  mensagens.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "comment-item";

    const top = document.createElement("div");
    top.className = "comment-item-top";
    const nome = document.createElement("span");
    nome.className = "comment-nome";
    nome.textContent = item.nome;
    const date = document.createElement("span");
    date.className = "comment-date";
    date.textContent = formatCommentDate(item.criadoEm);
    top.append(nome, date);
    wrap.appendChild(top);

    const texto = document.createElement("p");
    texto.className = "comment-texto";
    texto.textContent = item.texto;
    wrap.appendChild(texto);

    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "text-btn danger";
      delBtn.textContent = "Apagar";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Apagar esse comentário?")) return;
        try {
          await deleteDoc(doc(db, "versiculoComentarios", chaveDataVersiculo(), "mensagens", item.id));
        } catch {
          showToast("Não foi possível apagar.");
        }
      });
      wrap.appendChild(delBtn);
    }

    el.versiculoChatList.appendChild(wrap);
  });
}

function iniciarChatVersiculo() {
  if (unsubscribeVersiculoChat) unsubscribeVersiculoChat();
  unsubscribeVersiculoChat = onSnapshot(
    query(collection(db, "versiculoComentarios", chaveDataVersiculo(), "mensagens"), orderBy("criadoEm", "asc")),
    (snapshot) => renderVersiculoChat(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error(error)
  );
}

el.versiculoChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nome = el.versiculoChatNome.value.trim();
  const texto = el.versiculoChatTexto.value.trim();
  if (!nome || !texto) return;
  localStorage.setItem(COMMENT_NAME_KEY, nome);
  try {
    await addDoc(collection(db, "versiculoComentarios", chaveDataVersiculo(), "mensagens"), {
      nome, texto, criadoEm: serverTimestamp(),
    });
    el.versiculoChatTexto.value = "";
  } catch {
    showToast("Não foi possível enviar o comentário.");
  }
});

// ---------------------------------------------------------------------------
// Contador de visitas de hoje (👁️ ao lado do crédito)
// ---------------------------------------------------------------------------
// Mesma ideia do chat do versículo: um documento por dia
// (visitasDiarias/AAAA-MM-DD) que soma 1 a cada visitante novo. Não existe
// "resetar à meia-noite" de propósito - o dia seguinte usa outra chave de
// documento e começa do zero sozinho.
const VISITA_CONTADA_KEY = "visitaContadaEm";

function chaveDataVisitas() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function iniciarContadorVisitas() {
  const hojeChave = chaveDataVisitas();
  const visitaRef = doc(db, "visitasDiarias", hojeChave);

  onSnapshot(
    visitaRef,
    (snapshot) => {
      el.visitasHojeNum.textContent = snapshot.exists() ? snapshot.data().contagem || 0 : 0;
      el.visitasHojeTag.hidden = false;
    },
    (error) => console.error(error)
  );

  // Cada navegador só soma 1 por dia, mesmo atualizando a página várias vezes.
  if (localStorage.getItem(VISITA_CONTADA_KEY) === hojeChave) return;
  localStorage.setItem(VISITA_CONTADA_KEY, hojeChave);
  setDoc(visitaRef, { contagem: increment(1) }, { merge: true }).catch((error) => console.error(error));
}

// ---------------------------------------------------------------------------
// Tradutor
// ---------------------------------------------------------------------------
// Porta a parte central do projeto separado `audioT` (tradutor por voz/texto
// do Eduardo, com backend Python/Flask+googletrans+gTTS+speech_recognition —
// ver audioT/backend.py) pra uma seção do mural, sem depender de nenhum
// backend: fala, transcrição e reconhecimento de pronúncia usam a Web Speech
// API nativa do navegador (só funciona em navegadores baseados em Chromium —
// Chrome/Edge; Firefox/Safari não suportam SpeechRecognition), tradução usa
// o endpoint público do Google Translate (o mesmo mecanismo não-oficial que
// a lib googletrans usa por baixo dos panos) e o áudio da tradução usa o
// endpoint público de voz do Google Tradutor (o mesmo que a lib gTTS usa).
// Ficaram de fora, de propósito, as partes que dependiam só do Python (Mundo
// Aberto/mapas, histórico/ranking em CSV, quiz contra o tempo, quiz de texto
// longo, editor de tema, editor de vocabulário) — quiz de vocabulário/
// pronúncia, flashcards e favoritos entraram, mas favoritos agora vivem no
// localStorage do navegador em vez de um favoritos.csv no servidor.

const IDIOMAS_TRADUTOR = [
  { codigo: "pt", label: "🇧🇷 Português" }, { codigo: "en", label: "🇺🇸 English" },
  { codigo: "es", label: "🇪🇸 Spanish" }, { codigo: "fr", label: "🇫🇷 French" },
  { codigo: "de", label: "🇩🇪 German" }, { codigo: "it", label: "🇮🇹 Italian" },
  { codigo: "nl", label: "🇳🇱 Dutch" }, { codigo: "ja", label: "🇯🇵 Japanese" },
  { codigo: "ru", label: "🇷🇺 Russian" }, { codigo: "ar", label: "🇸🇦 Arabic" },
  { codigo: "hi", label: "🇮🇳 Hindi" }, { codigo: "ko", label: "🇰🇷 Korean" },
  { codigo: "tr", label: "🇹🇷 Turkish" }, { codigo: "pl", label: "🇵🇱 Polish" },
  { codigo: "sv", label: "🇸🇪 Swedish" }, { codigo: "vi", label: "🇻🇳 Vietnamese" },
  { codigo: "id", label: "🇮🇩 Indonesian" }, { codigo: "el", label: "🇬🇷 Greek" },
  { codigo: "th", label: "🇹🇭 Thai" }, { codigo: "cs", label: "🇨🇿 Czech" },
  { codigo: "hu", label: "🇭🇺 Hungarian" }, { codigo: "da", label: "🇩🇰 Danish" },
  { codigo: "fi", label: "🇫🇮 Finnish" }, { codigo: "no", label: "🇳🇴 Norwegian" },
  { codigo: "ro", label: "🇷🇴 Romanian" }, { codigo: "sk", label: "🇸🇰 Slovak" },
  { codigo: "uk", label: "🇺🇦 Ukrainian" }, { codigo: "bg", label: "🇧🇬 Bulgarian" },
  { codigo: "ca", label: "🇪🇸 Catalan" }, { codigo: "hr", label: "🇭🇷 Croatian" },
  { codigo: "sr", label: "🇷🇸 Serbian" }, { codigo: "lt", label: "🇱🇹 Lithuanian" },
  { codigo: "lv", label: "🇱🇻 Latvian" }, { codigo: "et", label: "🇪🇪 Estonian" },
];
const IDIOMA_AUTO_CODIGO = "auto";
const IDIOMA_AUTO_LABEL = "🌐 Detectar automaticamente";

// BCP-47 pras Web Speech APIs (SpeechRecognition/SpeechSynthesis exigem algo
// tipo "pt-BR", não só "pt") — o resto dos 34 códigos cai no fallback (usa o
// próprio código de 2 letras, que a maioria dos navegadores ainda aceita).
const LOCALE_VOZ_TRADUTOR = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT",
  nl: "nl-NL", ja: "ja-JP", ru: "ru-RU", ar: "ar-SA", hi: "hi-IN", ko: "ko-KR",
  tr: "tr-TR", pl: "pl-PL", sv: "sv-SE", vi: "vi-VN", id: "id-ID", el: "el-GR",
  th: "th-TH", cs: "cs-CZ", hu: "hu-HU", da: "da-DK", fi: "fi-FI", no: "nb-NO",
  ro: "ro-RO", sk: "sk-SK", uk: "uk-UA", bg: "bg-BG", ca: "ca-ES", hr: "hr-HR",
  sr: "sr-RS", lt: "lt-LT", lv: "lv-LV", et: "et-EE",
};
function localeVoz(codigo) {
  return LOCALE_VOZ_TRADUTOR[codigo] || codigo;
}

const tradEl = {
  origem: document.getElementById("tradOrigem"),
  destino: document.getElementById("tradDestino"),
  trocar: document.getElementById("tradTrocar"),
  papagaio: document.getElementById("tradPapagaio"),
  texto: document.getElementById("tradTexto"),
  traduzirBtn: document.getElementById("tradTraduzirBtn"),
  falarBtn: document.getElementById("tradFalarBtn"),
  resultado: document.getElementById("tradResultado"),
  favoritarBtn: document.getElementById("tradFavoritarBtn"),
  ouvirBtn: document.getElementById("tradOuvirBtn"),
  devagarBtn: document.getElementById("tradDevagarBtn"),
  copiarBtn: document.getElementById("tradCopiarBtn"),
  fixarBtn: document.getElementById("tradFixarBtn"),
  labelSegundos: document.getElementById("tradLabelSegundos"),
  sliderSegundos: document.getElementById("tradSliderSegundos"),
  audioPlayer: document.getElementById("tradAudioPlayer"),
  abrirFavoritosBtn: document.getElementById("tradAbrirFavoritosBtn"),
  abrirFlashcardsBtn: document.getElementById("tradAbrirFlashcardsBtn"),
  abrirQuizBtn: document.getElementById("tradAbrirQuizBtn"),
  abrirQuizPronunciaBtn: document.getElementById("tradAbrirQuizPronunciaBtn"),
  abrirHistoricoBtn: document.getElementById("tradAbrirHistoricoBtn"),
  abrirHistoricoQuizBtn: document.getElementById("tradAbrirHistoricoQuizBtn"),
  abrirPalavraDiaBtn: document.getElementById("tradAbrirPalavraDiaBtn"),
  abrirVocabularioBtn: document.getElementById("tradAbrirVocabularioBtn"),
  abrirQuizTempoBtn: document.getElementById("tradAbrirQuizTempoBtn"),
  abrirQuizTextoBtn: document.getElementById("tradAbrirQuizTextoBtn"),
  limparHistoricosBtn: document.getElementById("tradLimparHistoricosBtn"),
  favoritosModal: document.getElementById("tradFavoritosModal"),
  favoritosArea: document.getElementById("tradFavoritosArea"),
  flashcardsModal: document.getElementById("tradFlashcardsModal"),
  flashcardsArea: document.getElementById("tradFlashcardsArea"),
  quizModal: document.getElementById("tradQuizModal"),
  quizArea: document.getElementById("tradQuizArea"),
  quizPronunciaModal: document.getElementById("tradQuizPronunciaModal"),
  quizPronunciaArea: document.getElementById("tradQuizPronunciaArea"),
  historicoModal: document.getElementById("tradHistoricoModal"),
  historicoArea: document.getElementById("tradHistoricoArea"),
  historicoQuizModal: document.getElementById("tradHistoricoQuizModal"),
  historicoQuizArea: document.getElementById("tradHistoricoQuizArea"),
  palavraDiaModal: document.getElementById("tradPalavraDiaModal"),
  palavraDiaArea: document.getElementById("tradPalavraDiaArea"),
  vocabularioModal: document.getElementById("tradVocabularioModal"),
  vocabularioArea: document.getElementById("tradVocabularioArea"),
  quizTempoModal: document.getElementById("tradQuizTempoModal"),
  quizTempoArea: document.getElementById("tradQuizTempoArea"),
  quizTextoModal: document.getElementById("tradQuizTextoModal"),
  quizTextoArea: document.getElementById("tradQuizTextoArea"),
  popupPalavraModal: document.getElementById("tradPopupPalavraModal"),
  popupPalavraArea: document.getElementById("tradPopupPalavraArea"),
  abrirMundoBtn: document.getElementById("tradAbrirMundoBtn"),
  mundoMapasModal: document.getElementById("tradMundoMapasModal"),
  mundoMapasArea: document.getElementById("tradMundoMapasArea"),
  mundoJogoOverlay: document.getElementById("mundoJogoOverlay"),
  mundoJogoArea: document.querySelector("#mundoJogoOverlay .mundo-jogo-area"),
  mundoJogoRotacionavel: document.getElementById("mundoJogoRotacionavel"),
  mundoJogoTitulo: document.getElementById("mundoJogoTitulo"),
  mundoCanvas: document.getElementById("mundoCanvas"),
  mundoSairBtn: document.getElementById("mundoSairBtn"),
  mundoJogoDica: document.querySelector("#mundoJogoOverlay .mundo-jogo-dica"),
  mundoJoystickBase: document.getElementById("mundoJoystickBase"),
  mundoJoystickKnob: document.getElementById("mundoJoystickKnob"),
  mundoBotaoInteragir: document.getElementById("mundoBotaoInteragir"),
  mundoBotaoInteragirLabel: document.getElementById("mundoBotaoInteragirLabel"),
  lagoaOverlay: document.getElementById("lagoaOverlay"),
  lagoaArea: document.querySelector("#lagoaOverlay .lagoa-area"),
  lagoaImagem: document.getElementById("lagoaImagem"),
  lagoaImagemWrap: document.getElementById("lagoaImagemWrap"),
  lagoaSairBtn: document.getElementById("lagoaSairBtn"),
};

// Idiomas fixados (📌) - pinados sobem pro topo dos dois selects, igual ao
// idiomas_fixados.json do audioT (lá persistido em arquivo; aqui, sem
// servidor, vira localStorage).
const TRAD_FIXADOS_KEY = "tradutorIdiomasFixados";

function lerIdiomasFixadosTradutor() {
  try {
    return JSON.parse(localStorage.getItem(TRAD_FIXADOS_KEY)) || [];
  } catch {
    return [];
  }
}
function alternarIdiomaFixadoTradutor(codigo) {
  const fixados = lerIdiomasFixadosTradutor();
  const indice = fixados.indexOf(codigo);
  if (indice >= 0) fixados.splice(indice, 1);
  else fixados.unshift(codigo);
  localStorage.setItem(TRAD_FIXADOS_KEY, JSON.stringify(fixados));
}

function popularSelectIdiomas(select, comAuto, selecionado) {
  const fixados = lerIdiomasFixadosTradutor();
  const base = comAuto ? [{ codigo: IDIOMA_AUTO_CODIGO, label: IDIOMA_AUTO_LABEL }, ...IDIOMAS_TRADUTOR] : IDIOMAS_TRADUTOR;
  const opcoes = [
    ...fixados.map((codigo) => base.find((i) => i.codigo === codigo)).filter(Boolean),
    ...base.filter((idioma) => !fixados.includes(idioma.codigo)),
  ];
  select.innerHTML = opcoes
    .map((idioma) => `<option value="${idioma.codigo}"${idioma.codigo === selecionado ? " selected" : ""}>${idioma.codigo === IDIOMA_AUTO_CODIGO ? "" : fixados.includes(idioma.codigo) ? "📌 " : ""}${idioma.label}</option>`)
    .join("");
}
function atualizarSelectsIdiomasTradutor() {
  const origemAtual = tradEl.origem.value || IDIOMA_AUTO_CODIGO;
  const destinoAtual = tradEl.destino.value || "en";
  popularSelectIdiomas(tradEl.origem, true, origemAtual);
  popularSelectIdiomas(tradEl.destino, false, destinoAtual);
}
atualizarSelectsIdiomasTradutor();

tradEl.trocar.addEventListener("click", () => {
  if (tradEl.origem.value === IDIOMA_AUTO_CODIGO) return;
  const origemAtual = tradEl.origem.value;
  tradEl.origem.value = tradEl.destino.value;
  tradEl.destino.value = origemAtual;
});

tradEl.fixarBtn.addEventListener("click", () => {
  alternarIdiomaFixadoTradutor(tradEl.destino.value);
  atualizarSelectsIdiomasTradutor();
});

// ---- Tradução (endpoint público do Google Translate) ----------------------

async function traduzirTexto(texto, origem, destino) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${origem}&tl=${destino}&dt=t&q=${encodeURIComponent(texto)}`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Falha na tradução");
  const dados = await resposta.json();
  return dados[0].map((trecho) => trecho[0]).join("");
}

const cacheTraducaoTradutor = new Map();
async function traduzirComCache(textoPt, destino) {
  const chave = `${textoPt}|${destino}`;
  if (cacheTraducaoTradutor.has(chave)) return cacheTraducaoTradutor.get(chave);
  const traduzido = (await traduzirTexto(textoPt, "pt", destino)).toLowerCase().trim();
  cacheTraducaoTradutor.set(chave, traduzido);
  return traduzido;
}

// ---- Áudio (voz real do Google Tradutor, com fallback pro navegador) ------

// Vozes instaladas no navegador/SO - carregadas de forma assíncrona pelo
// Chrome, por isso o cache atualizado via "onvoiceschanged" (chamar
// getVoices() cedo demais costuma vir vazio).
let tradVozesDisponiveis = [];
function atualizarVozesDisponiveisTradutor() {
  if (window.speechSynthesis) tradVozesDisponiveis = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  atualizarVozesDisponiveisTradutor();
  window.speechSynthesis.onvoiceschanged = atualizarVozesDisponiveisTradutor;
}

function obterMelhorVozTradutor(localeAlvo) {
  if (!tradVozesDisponiveis.length) atualizarVozesDisponiveisTradutor();
  const exata = tradVozesDisponiveis.find((v) => v.lang.toLowerCase() === localeAlvo.toLowerCase());
  if (exata) return exata;
  const prefixo = localeAlvo.split("-")[0].toLowerCase();
  return tradVozesDisponiveis.find((v) => v.lang.toLowerCase().startsWith(prefixo)) || null;
}

function falarComVozNavegador(texto, idioma) {
  if (!window.speechSynthesis) {
    showToast("Este navegador não sabe falar em voz alta.");
    return;
  }
  const localeAlvo = localeVoz(idioma);
  const voz = obterMelhorVozTradutor(localeAlvo);
  const fala = new SpeechSynthesisUtterance(texto);
  if (voz) {
    // achou uma voz de verdade instalada pra esse idioma - melhor caso
    fala.voice = voz;
    fala.lang = voz.lang;
  } else {
    // sem voz instalada pra esse idioma específico, ainda assim tenta
    // falar (melhor um áudio imperfeito do que nenhum) - só avisa que a
    // pronúncia pode sair errada, sem deixar de tocar nada
    fala.lang = localeAlvo;
    showToast("Nenhuma voz instalada pra esse idioma — a pronúncia pode sair errada.");
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(fala);
}

// Toca a URL num <audio> e resolve/rejeita conforme o evento que disparar
// primeiro - "play()" sozinho só cobre falha síncrona (autoplay bloqueado),
// não cobre a URL carregar e falhar depois (ex: NotSupportedError), por
// isso escuta também o evento "error" do elemento.
function tentarTocarAudioTradutor(url, playbackRate) {
  return new Promise((resolve, reject) => {
    const audio = tradEl.audioPlayer;
    let resolvido = false;
    const limpar = () => {
      audio.removeEventListener("playing", aoTocar);
      audio.removeEventListener("error", aoErro);
    };
    const aoTocar = () => {
      if (resolvido) return;
      resolvido = true;
      limpar();
      resolve();
    };
    const aoErro = () => {
      if (resolvido) return;
      resolvido = true;
      limpar();
      reject(new Error("audio-error"));
    };
    audio.addEventListener("playing", aoTocar, { once: true });
    audio.addEventListener("error", aoErro, { once: true });
    audio.playbackRate = playbackRate;
    audio.src = url;
    audio.play().catch(aoErro);
  });
}

async function tocarTTS(texto, idioma, devagar = false) {
  if (!texto) return;
  const idiomaAudio = idioma === IDIOMA_AUTO_CODIGO ? "pt" : idioma;

  // 1) Netlify Function (/netlify/functions/tts.js) - faz a chamada real ao
  // mecanismo que o gTTS usa (o mesmo do audioT) por trás, contornando o
  // bloqueio de CORS que o navegador aplicaria numa chamada direta. É a voz
  // "de verdade" (qualidade igual à do projeto antigo), e já sai com
  // "devagar" sintetizado de propósito (não é só tocar mais devagar).
  const urlFuncao = `/.netlify/functions/tts?texto=${encodeURIComponent(texto)}&idioma=${idiomaAudio}${devagar ? "&devagar=1" : ""}`;
  try {
    await tentarTocarAudioTradutor(urlFuncao, 1);
    return;
  } catch {
    /* function indisponível (ex: rodando python -m http.server sem Netlify)
       ou deu erro - cai pros planos B/C abaixo */
  }

  // 2) endpoint público direto - funciona sem CORS porque <audio> só carrega
  // a URL, não lê os bytes via JS; tem limite de ~200 caracteres por
  // request e falha às vezes (parece rate-limit intermitente), por isso
  // tenta 2x. "Devagar" aqui é só playbackRate reduzido (não tem como pedir
  // síntese lenta de verdade sem passar pela function).
  if (texto.length <= 200) {
    const urlDireta = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(texto)}&tl=${idiomaAudio}&client=tw-ob`;
    const playbackRate = devagar ? 0.6 : 1;
    try {
      await tentarTocarAudioTradutor(urlDireta, playbackRate);
      return;
    } catch {
      /* tenta mais uma vez abaixo */
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await tentarTocarAudioTradutor(urlDireta, playbackRate);
      return;
    } catch {
      /* cai pro plano C */
    }
  }

  // 3) último recurso: voz do navegador
  falarComVozNavegador(texto, idiomaAudio);
}

// ---- Falar / transcrever (Web Speech API) ----------------------------------

const ReconhecimentoVozTradutor = window.SpeechRecognition || window.webkitSpeechRecognition;

function reconhecimentoDeVozSuportado() {
  return Boolean(ReconhecimentoVozTradutor);
}

// Sem "continuous" o SpeechRecognition do navegador encerra sozinho assim
// que detecta a primeira pausa depois da fala (geralmente ~1s de silêncio) -
// rápido demais pra terminar uma frase. Com continuous:true ele mantém o
// microfone aberto e vai disparando "onresult" por trecho reconhecido; quem
// decide quando parar é o timer (duração escolhida) ou um botão "Parar"
// manual (ver `parar()` no retorno) - equivalente ao phrase_time_limit /
// reconhecer_fala_cancelavel do audioT, só que do lado do navegador.
// SpeechRecognition do navegador é baseado em nuvem (não roda local) - cada
// código de erro tem um motivo bem diferente, então vale traduzir em vez de
// mostrar a palavra em inglês crua.
const TRAD_MENSAGENS_ERRO_RECONHECIMENTO = {
  network: 'Erro de rede: o navegador não conseguiu falar com o serviço de reconhecimento de voz do Google (ele funciona na nuvem, não local). Verifique sua internet, VPN/firewall - e, se estiver testando em "127.0.0.1", tente trocar por "localhost" na URL (bug conhecido do Chrome nessa API).',
  "not-allowed": "Permissão do microfone negada. Clique no ícone de cadeado/câmera na barra de endereço e permita o acesso ao microfone pra este site.",
  "service-not-allowed": "O navegador bloqueou o serviço de reconhecimento de voz.",
  "audio-capture": "Não consegui acessar o microfone. Verifique se ele está conectado e se nenhum outro programa está usando.",
};
function mensagemErroReconhecimentoTradutor(codigo) {
  return TRAD_MENSAGENS_ERRO_RECONHECIMENTO[codigo] || `Erro no reconhecimento de voz (${codigo}).`;
}

function criarReconhecimentoContinuoTradutor(idioma, duracaoMaxSegundos) {
  if (!ReconhecimentoVozTradutor) {
    return {
      promise: Promise.reject(new Error("Reconhecimento de voz não é suportado neste navegador. Tente no Chrome ou Edge.")),
      parar: () => {},
    };
  }

  const reconhecimento = new ReconhecimentoVozTradutor();
  reconhecimento.lang = localeVoz(idioma === IDIOMA_AUTO_CODIGO ? "pt" : idioma);
  reconhecimento.maxAlternatives = 1;
  reconhecimento.continuous = true;
  reconhecimento.interimResults = false;

  let textoFinal = "";
  let terminou = false;
  let timer = null;

  const promise = new Promise((resolve, reject) => {
    reconhecimento.onresult = (evento) => {
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        if (evento.results[i].isFinal) {
          textoFinal += (textoFinal ? " " : "") + evento.results[i][0].transcript.trim();
        }
      }
    };
    reconhecimento.onerror = (evento) => {
      if (terminou) return;
      // "no-speech"/"aborted" disparam sempre que a gente chama stop() de
      // propósito (timer ou botão Parar) - não é erro de verdade, só deixa
      // o onend (abaixo) resolver com o que já foi reconhecido até agora
      if (textoFinal || evento.error === "no-speech" || evento.error === "aborted") return;
      terminou = true;
      clearTimeout(timer);
      reject(new Error(mensagemErroReconhecimentoTradutor(evento.error)));
    };
    reconhecimento.onend = () => {
      if (terminou) return;
      terminou = true;
      clearTimeout(timer);
      resolve(textoFinal);
    };
    timer = setTimeout(() => {
      try {
        reconhecimento.stop();
      } catch {
        /* já parado */
      }
    }, duracaoMaxSegundos * 1000);
    reconhecimento.start();
  });

  return {
    promise,
    parar: () => {
      try {
        reconhecimento.stop();
      } catch {
        /* já parado */
      }
    },
  };
}

function reconhecerFala(idioma, duracaoSegundos = 10) {
  return criarReconhecimentoContinuoTradutor(idioma, duracaoSegundos).promise;
}

// ---- Estado da última tradução (pra favoritar/ouvir) -----------------------

const tradEstado = { ultimoOriginal: "", ultimaTraducao: "", ultimoOrigem: "", ultimoDestino: "" };

// ---- Histórico de traduções (localStorage — sem servidor pra um historico.csv) --

const TRAD_HISTORICO_KEY = "tradutorHistoricoTraducoes";
const TRAD_HISTORICO_MAX = 200;

function registrarHistoricoTraducao(original, traduzido) {
  let lista = [];
  try {
    lista = JSON.parse(localStorage.getItem(TRAD_HISTORICO_KEY)) || [];
  } catch {
    lista = [];
  }
  lista.push([original, traduzido]);
  if (lista.length > TRAD_HISTORICO_MAX) lista = lista.slice(lista.length - TRAD_HISTORICO_MAX);
  localStorage.setItem(TRAD_HISTORICO_KEY, JSON.stringify(lista));
}
function lerHistoricoTraducoesTradutor() {
  try {
    return JSON.parse(localStorage.getItem(TRAD_HISTORICO_KEY)) || [];
  } catch {
    return [];
  }
}

function atualizarBotaoFavoritoTradutor() {
  const favoritado = tradEstado.ultimaTraducao && favoritoExisteTradutor(tradEstado.ultimoOriginal, tradEstado.ultimaTraducao);
  tradEl.favoritarBtn.textContent = favoritado ? "⭐" : "☆";
}

async function executarTraducao(texto) {
  const origem = tradEl.origem.value;
  const destino = tradEl.destino.value;

  tradEl.resultado.textContent = "Traduzindo...";
  tradEl.traduzirBtn.disabled = true;
  tradEl.traduzirBtn.textContent = "Traduzindo...";

  try {
    const traduzido = await traduzirTexto(texto, origem, destino);
    tradEl.resultado.textContent = traduzido || "Não foi possível traduzir.";
    tradEstado.ultimoOriginal = texto;
    tradEstado.ultimaTraducao = traduzido;
    tradEstado.ultimoOrigem = origem;
    tradEstado.ultimoDestino = destino;
    atualizarBotaoFavoritoTradutor();
    if (traduzido) {
      tocarTTS(traduzido, destino);
      registrarHistoricoTraducao(texto, traduzido);
    }
  } catch {
    tradEl.resultado.textContent = "Erro ao traduzir. Verifique sua conexão e tente novamente.";
  } finally {
    tradEl.traduzirBtn.disabled = false;
    tradEl.traduzirBtn.textContent = "🌐 Traduzir";
  }
}

tradEl.traduzirBtn.addEventListener("click", () => {
  const texto = tradEl.texto.value.trim();
  if (texto) executarTraducao(texto);
});

tradEl.sliderSegundos.addEventListener("input", () => {
  tradEl.labelSegundos.textContent = `${tradEl.sliderSegundos.value}s`;
});

tradEl.falarBtn.addEventListener("click", async () => {
  if (!reconhecimentoDeVozSuportado()) {
    showToast("Reconhecimento de voz não é suportado neste navegador (tente Chrome ou Edge).");
    return;
  }
  tradEl.falarBtn.disabled = true;
  tradEl.falarBtn.textContent = "🎤 Ouvindo...";
  try {
    const falado = await reconhecerFala(tradEl.origem.value, Number(tradEl.sliderSegundos.value));
    if (!falado) {
      // reconhecimento terminou sem capturar nenhuma fala - o navegador não
      // dá um erro nesse caso (não é bug do código), geralmente é
      // permissão do microfone não concedida de verdade ou o dispositivo de
      // gravação padrão do sistema não é o que a pessoa está usando
      showToast("Não captei nenhuma fala. Verifique se a permissão do microfone foi concedida e se o dispositivo certo está selecionado no sistema.");
      return;
    }
    tradEl.texto.value = falado;
    if (tradEl.papagaio.checked) {
      // modo papagaio: repete a fala no idioma de ORIGEM em vez de traduzir
      // (prática de pronúncia, não tradução)
      tocarTTS(falado, tradEl.origem.value === IDIOMA_AUTO_CODIGO ? "pt" : tradEl.origem.value);
    } else {
      await executarTraducao(falado);
    }
  } catch (erro) {
    showToast(erro.message || "Não entendi, tente novamente.");
  } finally {
    tradEl.falarBtn.disabled = false;
    tradEl.falarBtn.textContent = "🎤 Falar";
  }
});

tradEl.copiarBtn.addEventListener("click", () => {
  const texto = tradEl.resultado.textContent;
  if (!texto || texto === "A tradução aparece aqui") return;
  navigator.clipboard.writeText(texto);
});

tradEl.ouvirBtn.addEventListener("click", () => {
  if (!tradEstado.ultimaTraducao) return;
  tocarTTS(tradEstado.ultimaTraducao, tradEstado.ultimoDestino);
});

tradEl.devagarBtn.addEventListener("click", () => {
  if (!tradEstado.ultimaTraducao) return;
  tocarTTS(tradEstado.ultimaTraducao, tradEstado.ultimoDestino, true);
});

// ---- Histórico de traduções (modal) ----------------------------------------

function renderizarHistoricoTradutor() {
  const lista = lerHistoricoTraducoesTradutor();
  if (lista.length === 0) {
    tradEl.historicoArea.innerHTML = '<p class="trad-vazio">Nenhuma tradução no histórico ainda.</p>';
    return;
  }
  tradEl.historicoArea.innerHTML = "";
  [...lista].reverse().forEach(([original, traduzido]) => {
    const linha = document.createElement("div");
    linha.className = "trad-historico-linha";
    linha.innerHTML = `<span class="trad-historico-original"></span><span class="trad-historico-seta">→</span><span class="trad-historico-traduzido"></span>`;
    linha.querySelector(".trad-historico-original").textContent = original;
    linha.querySelector(".trad-historico-traduzido").textContent = traduzido;
    tradEl.historicoArea.appendChild(linha);
  });
}

tradEl.abrirHistoricoBtn.addEventListener("click", () => {
  renderizarHistoricoTradutor();
  openModal(tradEl.historicoModal);
});

// ---- Favoritos (localStorage — não tem servidor pra guardar um CSV) -------

const TRAD_FAVORITOS_KEY = "tradutorFavoritos";

function lerFavoritosTradutor() {
  try {
    return JSON.parse(localStorage.getItem(TRAD_FAVORITOS_KEY)) || [];
  } catch {
    return [];
  }
}
function salvarFavoritosTradutor(lista) {
  localStorage.setItem(TRAD_FAVORITOS_KEY, JSON.stringify(lista));
}
function favoritoExisteTradutor(original, traduzido) {
  return lerFavoritosTradutor().some((f) => f.original === original && f.traduzido === traduzido);
}
function adicionarFavoritoTradutor(original, traduzido, origem, destino) {
  if (favoritoExisteTradutor(original, traduzido)) return;
  const lista = lerFavoritosTradutor();
  lista.push({ original, traduzido, origem, destino });
  salvarFavoritosTradutor(lista);
}
function removerFavoritoTradutor(original, traduzido) {
  salvarFavoritosTradutor(lerFavoritosTradutor().filter((f) => !(f.original === original && f.traduzido === traduzido)));
}

tradEl.favoritarBtn.addEventListener("click", () => {
  if (!tradEstado.ultimaTraducao) return;
  if (favoritoExisteTradutor(tradEstado.ultimoOriginal, tradEstado.ultimaTraducao)) {
    removerFavoritoTradutor(tradEstado.ultimoOriginal, tradEstado.ultimaTraducao);
  } else {
    adicionarFavoritoTradutor(tradEstado.ultimoOriginal, tradEstado.ultimaTraducao, tradEstado.ultimoOrigem, tradEstado.ultimoDestino);
  }
  atualizarBotaoFavoritoTradutor();
});

function renderizarFavoritosTradutor() {
  const lista = lerFavoritosTradutor();
  if (lista.length === 0) {
    tradEl.favoritosArea.innerHTML = '<p class="trad-vazio">Nenhum favorito ainda. Traduza algo e toque em ☆ pra guardar aqui.</p>';
    return;
  }
  tradEl.favoritosArea.innerHTML = "";
  lista.forEach((fav) => {
    const bloco = document.createElement("div");
    bloco.className = "trad-favorito-bloco";

    const textos = document.createElement("div");
    textos.className = "trad-favorito-textos";
    const original = document.createElement("p");
    original.className = "trad-favorito-original";
    original.textContent = fav.original;
    const traduzido = document.createElement("p");
    traduzido.className = "trad-favorito-traduzido";
    traduzido.textContent = fav.traduzido;
    textos.append(original, traduzido);

    const remover = document.createElement("button");
    remover.className = "trad-favorito-remover";
    remover.type = "button";
    remover.textContent = "✕";
    remover.title = "Remover dos favoritos";
    remover.addEventListener("click", (evento) => {
      evento.stopPropagation();
      removerFavoritoTradutor(fav.original, fav.traduzido);
      renderizarFavoritosTradutor();
      atualizarBotaoFavoritoTradutor();
    });

    bloco.addEventListener("click", () => {
      if (fav.origem) tradEl.origem.value = fav.origem;
      if (fav.destino) tradEl.destino.value = fav.destino;
      tradEl.texto.value = fav.original;
      tradEl.resultado.textContent = fav.traduzido;
      tradEstado.ultimoOriginal = fav.original;
      tradEstado.ultimaTraducao = fav.traduzido;
      tradEstado.ultimoOrigem = fav.origem;
      tradEstado.ultimoDestino = fav.destino;
      atualizarBotaoFavoritoTradutor();
      closeModal(tradEl.favoritosModal);
    });

    bloco.append(textos, remover);
    tradEl.favoritosArea.appendChild(bloco);
  });
}

tradEl.abrirFavoritosBtn.addEventListener("click", () => {
  renderizarFavoritosTradutor();
  openModal(tradEl.favoritosModal);
});

// ---- Flashcards (a partir dos favoritos) -----------------------------------

const tradFlashcardsEstado = { indice: 0, virado: false };

function renderizarFlashcardsTradutor() {
  const favoritos = lerFavoritosTradutor();

  if (favoritos.length === 0) {
    tradEl.flashcardsArea.innerHTML = '<p class="trad-vazio">Você ainda não tem favoritos.<br>Favorite traduções (☆) pra estudar aqui.</p>';
    return;
  }

  if (tradFlashcardsEstado.indice >= favoritos.length) tradFlashcardsEstado.indice = 0;
  const card = favoritos[tradFlashcardsEstado.indice];

  tradEl.flashcardsArea.innerHTML = "";

  const contador = document.createElement("p");
  contador.className = "trad-flashcard-contador";
  contador.textContent = `Carta ${tradFlashcardsEstado.indice + 1} de ${favoritos.length}`;

  const cartao = document.createElement("div");
  cartao.className = "trad-flashcard";
  const conteudo = document.createElement("span");
  conteudo.className = tradFlashcardsEstado.virado ? "trad-flashcard-verso" : "trad-flashcard-frente";
  conteudo.textContent = tradFlashcardsEstado.virado ? card.traduzido : card.original;
  cartao.appendChild(conteudo);
  cartao.addEventListener("click", () => {
    tradFlashcardsEstado.virado = !tradFlashcardsEstado.virado;
    renderizarFlashcardsTradutor();
  });

  const dica = document.createElement("p");
  dica.className = "trad-flashcard-dica";
  dica.textContent = "Toque na carta pra virar";

  const nav = document.createElement("div");
  nav.className = "trad-flashcard-nav";
  const anterior = document.createElement("button");
  anterior.type = "button";
  anterior.textContent = "⬅ Anterior";
  anterior.addEventListener("click", () => {
    tradFlashcardsEstado.indice = (tradFlashcardsEstado.indice - 1 + favoritos.length) % favoritos.length;
    tradFlashcardsEstado.virado = false;
    renderizarFlashcardsTradutor();
  });
  const proxima = document.createElement("button");
  proxima.type = "button";
  proxima.textContent = "Próxima ➡";
  proxima.addEventListener("click", () => {
    tradFlashcardsEstado.indice = (tradFlashcardsEstado.indice + 1) % favoritos.length;
    tradFlashcardsEstado.virado = false;
    renderizarFlashcardsTradutor();
  });
  nav.append(anterior, proxima);

  tradEl.flashcardsArea.append(contador, cartao, dica, nav);
}

tradEl.abrirFlashcardsBtn.addEventListener("click", () => {
  tradFlashcardsEstado.indice = 0;
  tradFlashcardsEstado.virado = false;
  renderizarFlashcardsTradutor();
  openModal(tradEl.flashcardsModal);
});

// ---- Dicionário do quiz (facil/medio/dificil, portado de audioT/dicionario.json) --

let tradDicionarioCache = null;
async function carregarDicionarioTradutor() {
  if (!tradDicionarioCache) {
    tradDicionarioCache = await fetch("tradutor-dicionario.json").then((r) => r.json());
  }
  return tradDicionarioCache;
}

// Overlay de edições do vocabulário (☆ audioT grava direto em dicionario.json
// no disco; aqui, sem servidor, as adições/remoções do usuário ficam num
// overlay no localStorage e são mescladas por cima da base a cada leitura)
const TRAD_VOCAB_OVERLAY_KEY = "tradutorVocabularioOverlay";
const TRAD_DIFICULDADES = ["facil", "medio", "dificil"];

function lerVocabularioOverlayTradutor() {
  try {
    const salvo = JSON.parse(localStorage.getItem(TRAD_VOCAB_OVERLAY_KEY));
    if (salvo && salvo.adicionadas && salvo.removidas) return salvo;
  } catch {
    /* usa o padrão abaixo */
  }
  return {
    adicionadas: { facil: [], medio: [], dificil: [] },
    removidas: { facil: [], medio: [], dificil: [] },
  };
}
function salvarVocabularioOverlayTradutor(overlay) {
  localStorage.setItem(TRAD_VOCAB_OVERLAY_KEY, JSON.stringify(overlay));
}
function adicionarPalavraVocabularioTradutor(dificuldade, palavra) {
  palavra = palavra.trim().toLowerCase();
  if (!palavra || !TRAD_DIFICULDADES.includes(dificuldade)) return false;
  const overlay = lerVocabularioOverlayTradutor();
  overlay.removidas[dificuldade] = overlay.removidas[dificuldade].filter((p) => p !== palavra);
  if (!overlay.adicionadas[dificuldade].includes(palavra) && !(tradDicionarioCache && tradDicionarioCache[dificuldade].includes(palavra))) {
    overlay.adicionadas[dificuldade].push(palavra);
  }
  salvarVocabularioOverlayTradutor(overlay);
  return true;
}
function removerPalavraVocabularioTradutor(dificuldade, palavra) {
  const overlay = lerVocabularioOverlayTradutor();
  overlay.adicionadas[dificuldade] = overlay.adicionadas[dificuldade].filter((p) => p !== palavra);
  if (!overlay.removidas[dificuldade].includes(palavra)) overlay.removidas[dificuldade].push(palavra);
  salvarVocabularioOverlayTradutor(overlay);
}

async function obterDicionarioEfetivoTradutor() {
  const base = await carregarDicionarioTradutor();
  const overlay = lerVocabularioOverlayTradutor();
  const efetivo = {};
  TRAD_DIFICULDADES.forEach((dificuldade) => {
    const lista = base[dificuldade].filter((p) => !overlay.removidas[dificuldade].includes(p));
    efetivo[dificuldade] = [...lista, ...overlay.adicionadas[dificuldade]];
  });
  return efetivo;
}

// ---- Editor de vocabulário (modal) -----------------------------------------

let tradVocabDificuldadeAtiva = "facil";

async function renderizarVocabularioTradutor() {
  const dicionario = await obterDicionarioEfetivoTradutor();
  tradEl.vocabularioArea.innerHTML = "";

  const abas = document.createElement("div");
  abas.className = "trad-vocab-dificuldade";
  TRAD_DIFICULDADES.forEach((dificuldade) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `trad-vocab-dif-btn${dificuldade === tradVocabDificuldadeAtiva ? " ativo" : ""}`;
    btn.textContent = DIFICULDADE_LABEL_TRADUTOR[dificuldade];
    btn.addEventListener("click", () => {
      tradVocabDificuldadeAtiva = dificuldade;
      renderizarVocabularioTradutor();
    });
    abas.appendChild(btn);
  });

  const addLinha = document.createElement("div");
  addLinha.className = "trad-vocab-add";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nova palavra em português";
  input.maxLength = 40;
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "trad-icon-btn";
  addBtn.textContent = "➕";
  addBtn.title = "Adicionar palavra";
  addBtn.addEventListener("click", () => {
    if (adicionarPalavraVocabularioTradutor(tradVocabDificuldadeAtiva, input.value)) {
      input.value = "";
      renderizarVocabularioTradutor();
    }
  });
  input.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") addBtn.click();
  });
  addLinha.append(input, addBtn);

  const lista = document.createElement("div");
  lista.className = "trad-vocab-lista";
  dicionario[tradVocabDificuldadeAtiva].forEach((palavra) => {
    const linha = document.createElement("div");
    linha.className = "trad-vocab-palavra";
    const texto = document.createElement("span");
    texto.textContent = palavra;
    const remover = document.createElement("button");
    remover.type = "button";
    remover.textContent = "✕";
    remover.title = "Remover palavra";
    remover.addEventListener("click", () => {
      removerPalavraVocabularioTradutor(tradVocabDificuldadeAtiva, palavra);
      renderizarVocabularioTradutor();
    });
    linha.append(texto, remover);
    lista.appendChild(linha);
  });

  tradEl.vocabularioArea.append(abas, addLinha, lista);
}

tradEl.abrirVocabularioBtn.addEventListener("click", () => {
  renderizarVocabularioTradutor();
  openModal(tradEl.vocabularioModal);
});

// ---- Palavra do dia (modal) -------------------------------------------------

// RNG determinístico (mulberry32) semeado pela data de hoje - mesma ideia do
// random.Random(data_de_hoje) do audioT: a mesma palavra sai o dia inteiro,
// muda só depois da meia-noite, sem precisar de backend guardando estado.
function mulberry32Tradutor(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedDeTextoTradutor(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (Math.imul(hash, 31) + texto.charCodeAt(i)) | 0;
  return hash;
}

async function obterPalavraDoDiaTradutor(destino) {
  const dicionario = await obterDicionarioEfetivoTradutor();
  const todasPalavras = TRAD_DIFICULDADES.flatMap((d) => dicionario[d]);
  const hoje = new Date();
  const dataIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const aleatorio = mulberry32Tradutor(seedDeTextoTradutor(dataIso));
  const pt = todasPalavras[Math.floor(aleatorio() * todasPalavras.length)];
  const traduzido = await traduzirComCache(pt, destino);
  return { original: pt, traduzido };
}

async function renderizarPalavraDoDiaTradutor() {
  tradEl.palavraDiaArea.innerHTML = '<p class="trad-vazio">Carregando...</p>';
  const destino = tradEl.destino.value;
  const { original, traduzido } = await obterPalavraDoDiaTradutor(destino);

  tradEl.palavraDiaArea.innerHTML = "";

  const topo = document.createElement("div");
  topo.className = "trad-modal-acoes-topo";
  const favoritar = document.createElement("button");
  favoritar.type = "button";
  favoritar.className = "trad-icon-btn trad-estrela";
  favoritar.title = "Adicionar aos favoritos";
  favoritar.textContent = favoritoExisteTradutor(original, traduzido) ? "⭐" : "☆";
  favoritar.addEventListener("click", () => {
    if (favoritoExisteTradutor(original, traduzido)) removerFavoritoTradutor(original, traduzido);
    else adicionarFavoritoTradutor(original, traduzido, "pt", destino);
    favoritar.textContent = favoritoExisteTradutor(original, traduzido) ? "⭐" : "☆";
  });
  const ouvir = document.createElement("button");
  ouvir.type = "button";
  ouvir.className = "trad-icon-btn";
  ouvir.title = "Ouvir pronúncia";
  ouvir.textContent = "🔊";
  ouvir.addEventListener("click", () => tocarTTS(traduzido, destino));
  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.className = "trad-icon-btn";
  copiar.title = "Copiar tradução";
  copiar.textContent = "📋";
  copiar.addEventListener("click", () => navigator.clipboard.writeText(traduzido));
  topo.append(favoritar, ouvir, copiar);

  const area = document.createElement("div");
  area.className = "trad-palavra-dia-area";
  const originalEl = document.createElement("p");
  originalEl.className = "trad-palavra-dia-original";
  originalEl.textContent = original;
  const traduzidoEl = document.createElement("p");
  traduzidoEl.className = "trad-palavra-dia-traduzida";
  traduzidoEl.textContent = traduzido;
  area.append(originalEl, traduzidoEl);

  tradEl.palavraDiaArea.append(topo, area);
}

tradEl.abrirPalavraDiaBtn.addEventListener("click", () => {
  renderizarPalavraDoDiaTradutor();
  openModal(tradEl.palavraDiaModal);
});

const TRAD_PALAVRAS_INVALIDAS = ["human body", "body", "litter"];

function amostraAleatoriaTradutor(lista, tamanho) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, tamanho);
}

const DIFICULDADE_LABEL_TRADUTOR = { facil: "🟢 Fácil", medio: "🟡 Médio", dificil: "🔴 Difícil" };

function renderizarSelecaoDificuldade(area, aoEscolher) {
  area.innerHTML = "";
  ["facil", "medio", "dificil"].forEach((dificuldade) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `trad-dificuldade-btn ${dificuldade}`;
    btn.textContent = DIFICULDADE_LABEL_TRADUTOR[dificuldade];
    btn.addEventListener("click", () => aoEscolher(dificuldade));
    area.appendChild(btn);
  });
}

// Pede o nome antes de qualquer quiz (pra entrar no ranking/histórico) -
// mesmo passo que o audioT pede em todo modo de quiz.
const TRAD_ULTIMO_NOME_KEY = "tradutorUltimoNomeQuiz";

function renderizarTelaNomeTradutor(area, aoConfirmar) {
  area.innerHTML = "";
  const label = document.createElement("p");
  label.className = "trad-quiz-nome-label";
  label.textContent = "Digite seu nome pra entrar no histórico:";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "trad-quiz-nome-input";
  input.placeholder = "Seu nome";
  input.maxLength = 40;
  input.value = localStorage.getItem(TRAD_ULTIMO_NOME_KEY) || "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "trad-quiz-avancar";
  btn.textContent = "Continuar ➡";
  const confirmar = () => {
    const nome = input.value.trim() || "Anônimo";
    localStorage.setItem(TRAD_ULTIMO_NOME_KEY, nome);
    aoConfirmar(nome);
  };
  btn.addEventListener("click", confirmar);
  input.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") confirmar();
  });
  area.append(label, input, btn);
  input.focus();
}

// ---- Histórico/ranking dos quizzes (localStorage — sem CSVs no servidor) --

const TRAD_HIST_QUIZ_KEY = "tradutorHistoricoQuiz";
const TRAD_HIST_QUIZ_TEMPO_KEY = "tradutorHistoricoQuizTempo";
const TRAD_HIST_QUIZ_PRONUNCIA_KEY = "tradutorHistoricoQuizPronuncia";
const TRAD_HIST_QUIZ_TEXTO_KEY = "tradutorHistoricoQuizTexto";
const TRAD_HIST_QUIZ_MAX = 50;

function lerListaLocalTradutor(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave)) || [];
  } catch {
    return [];
  }
}
function empilharListaLocalTradutor(chave, item) {
  const lista = lerListaLocalTradutor(chave);
  lista.push(item);
  localStorage.setItem(chave, JSON.stringify(lista.length > TRAD_HIST_QUIZ_MAX ? lista.slice(lista.length - TRAD_HIST_QUIZ_MAX) : lista));
}

function salvarHistoricoQuizTradutor(nome, idioma, dificuldade, pontuacao) {
  empilharListaLocalTradutor(TRAD_HIST_QUIZ_KEY, { nome, idioma, dificuldade, pontuacao });
}
function obterRankingQuizTradutor(top = 5) {
  return [...lerListaLocalTradutor(TRAD_HIST_QUIZ_KEY)].sort((a, b) => b.pontuacao - a.pontuacao).slice(0, top);
}
function salvarHistoricoQuizTempoTradutor(nome, idioma, dificuldade, erros, acertos) {
  empilharListaLocalTradutor(TRAD_HIST_QUIZ_TEMPO_KEY, { nome, idioma, dificuldade, erros, acertos });
}
function salvarHistoricoQuizPronunciaTradutor(nome, dificuldade, idioma, pontuacao) {
  empilharListaLocalTradutor(TRAD_HIST_QUIZ_PRONUNCIA_KEY, { nome, dificuldade, idioma, pontuacao });
}
function salvarHistoricoQuizTextoTradutor(nome, dificuldade, idioma, porcentagem) {
  empilharListaLocalTradutor(TRAD_HIST_QUIZ_TEXTO_KEY, { nome, dificuldade, idioma, porcentagem });
}
function limparHistoricosQuizTradutor() {
  [TRAD_HIST_QUIZ_KEY, TRAD_HIST_QUIZ_TEMPO_KEY, TRAD_HIST_QUIZ_PRONUNCIA_KEY, TRAD_HIST_QUIZ_TEXTO_KEY].forEach((chave) => localStorage.removeItem(chave));
}

// ---- Quiz de vocabulário ----------------------------------------------------

async function montarQuizVocabularioTradutor(dificuldade, destino) {
  const dicionario = await obterDicionarioEfetivoTradutor();
  const listaBase = dicionario[dificuldade] || [];
  const amostra = amostraAleatoriaTradutor(listaBase, Math.min(24, listaBase.length));

  const pares = await Promise.all(
    amostra.map(async (pt) => {
      try {
        const trad = await traduzirComCache(pt, destino);
        if (TRAD_PALAVRAS_INVALIDAS.some((erro) => trad.includes(erro))) return null;
        if (trad === pt.toLowerCase()) return null;
        return [pt, trad];
      } catch {
        return null;
      }
    })
  );

  const dicionarioAtivo = new Map(pares.filter(Boolean));
  if (dicionarioAtivo.size < 12) return [];

  const perguntasPt = amostraAleatoriaTradutor([...dicionarioAtivo.keys()], 10);
  const todasTraducoes = [...dicionarioAtivo.values()];
  const usadas = new Set(perguntasPt.map((pt) => dicionarioAtivo.get(pt)));

  return perguntasPt.map((pt) => {
    const correta = dicionarioAtivo.get(pt);
    let erradasPossiveis = todasTraducoes.filter((x) => x !== correta && !usadas.has(x));
    if (erradasPossiveis.length < 2) erradasPossiveis = todasTraducoes.filter((x) => x !== correta);
    const erradas = amostraAleatoriaTradutor(erradasPossiveis, 2);
    erradas.forEach((e) => usadas.add(e));
    return { pt, correta, opcoes: amostraAleatoriaTradutor([correta, ...erradas], 3) };
  });
}

function iniciarSelecaoQuizVocabularioTradutor() {
  renderizarTelaNomeTradutor(tradEl.quizArea, (nome) => {
    renderizarSelecaoDificuldade(tradEl.quizArea, (dificuldade) => iniciarQuizVocabularioTradutor(dificuldade, nome));
  });
}

function iniciarQuizVocabularioTradutor(dificuldade, nome) {
  tradEl.quizArea.innerHTML = '<p class="trad-vazio">Preparando quiz (traduzindo palavras)...</p>';

  montarQuizVocabularioTradutor(dificuldade, tradEl.destino.value).then((quiz) => {
    if (quiz.length === 0) {
      tradEl.quizArea.innerHTML = '<p class="trad-quiz-erro">Não foi possível montar o quiz pra esse idioma/dificuldade. Tente outro idioma de destino.</p>';
      const voltar = document.createElement("button");
      voltar.type = "button";
      voltar.className = "trad-quiz-voltar";
      voltar.textContent = "⬅ Escolher outra dificuldade";
      voltar.addEventListener("click", () => renderizarSelecaoDificuldade(tradEl.quizArea, (d) => iniciarQuizVocabularioTradutor(d, nome)));
      tradEl.quizArea.appendChild(voltar);
      return;
    }
    renderizarQuestaoVocabularioTradutor({ quiz, indice: 0, acertos: 0, nome, dificuldade });
  });
}

function renderizarQuestaoVocabularioTradutor(estadoQuiz) {
  if (estadoQuiz.indice >= estadoQuiz.quiz.length) {
    renderizarResultadoVocabularioTradutor(estadoQuiz);
    return;
  }

  const pergunta = estadoQuiz.quiz[estadoQuiz.indice];
  tradEl.quizArea.innerHTML = "";

  const contador = document.createElement("p");
  contador.className = "trad-quiz-contador";
  contador.textContent = `Pergunta ${estadoQuiz.indice + 1} de ${estadoQuiz.quiz.length} — acertos: ${estadoQuiz.acertos}`;

  const palavra = document.createElement("p");
  palavra.className = "trad-quiz-pergunta";
  palavra.textContent = pergunta.pt;

  tradEl.quizArea.append(contador, palavra);

  pergunta.opcoes.forEach((opcao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "trad-quiz-opcao";
    btn.textContent = opcao;
    btn.addEventListener("click", () => {
      const acertou = opcao === pergunta.correta;
      if (acertou) estadoQuiz.acertos += 1;

      tradEl.quizArea.querySelectorAll(".trad-quiz-opcao").forEach((outro) => {
        outro.disabled = true;
        if (outro === btn) outro.classList.add(acertou ? "certa" : "errada");
        else if (outro.textContent === pergunta.correta) outro.classList.add("correta-revelada");
      });

      const avancar = document.createElement("button");
      avancar.type = "button";
      avancar.className = "trad-quiz-avancar";
      avancar.textContent = estadoQuiz.indice + 1 < estadoQuiz.quiz.length ? "Avançar ➡" : "Ver resultado";
      avancar.addEventListener("click", () => {
        estadoQuiz.indice += 1;
        renderizarQuestaoVocabularioTradutor(estadoQuiz);
      });
      tradEl.quizArea.appendChild(avancar);
    });
    tradEl.quizArea.appendChild(btn);
  });
}

function renderizarResultadoVocabularioTradutor(estadoQuiz) {
  salvarHistoricoQuizTradutor(estadoQuiz.nome, tradEl.destino.value, estadoQuiz.dificuldade, estadoQuiz.acertos);

  tradEl.quizArea.innerHTML = "";

  const titulo = document.createElement("p");
  titulo.className = "trad-quiz-resultado-titulo";
  const porcentagem = Math.round((estadoQuiz.acertos / estadoQuiz.quiz.length) * 100);
  titulo.textContent = `Você acertou ${estadoQuiz.acertos} de ${estadoQuiz.quiz.length} (${porcentagem}%)`;

  const jogarDeNovo = document.createElement("button");
  jogarDeNovo.type = "button";
  jogarDeNovo.className = "trad-quiz-avancar";
  jogarDeNovo.textContent = "🔄 Jogar de novo";
  jogarDeNovo.addEventListener("click", iniciarSelecaoQuizVocabularioTradutor);

  tradEl.quizArea.append(titulo, jogarDeNovo);
}

tradEl.abrirQuizBtn.addEventListener("click", () => {
  iniciarSelecaoQuizVocabularioTradutor();
  openModal(tradEl.quizModal);
});

// ---- Quiz de pronúncia (mic, compara com difflib-like ratio) --------------

const REGEX_DIACRITICOS_TRADUTOR = new RegExp("[\\u0300-\\u036f]", "g");

function normalizarComparacaoTradutor(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS_TRADUTOR, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function distanciaLevenshteinTradutor(a, b) {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const dp = Array.from({ length: linhas }, () => new Array(colunas).fill(0));
  for (let i = 0; i < linhas; i++) dp[i][0] = i;
  for (let j = 0; j < colunas; j++) dp[0][j] = j;
  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[linhas - 1][colunas - 1];
}

function similaridadeTradutor(a, b) {
  const na = normalizarComparacaoTradutor(a);
  const nb = normalizarComparacaoTradutor(b);
  if (!na && !nb) return 1;
  const distancia = distanciaLevenshteinTradutor(na, nb);
  return 1 - distancia / Math.max(na.length, nb.length, 1);
}

async function montarQuizPronunciaTradutor(dificuldade, destino) {
  const dicionario = await obterDicionarioEfetivoTradutor();
  const listaBase = dicionario[dificuldade] || [];
  const amostra = amostraAleatoriaTradutor(listaBase, Math.min(20, listaBase.length));

  const pares = await Promise.all(
    amostra.map(async (pt) => {
      try {
        const trad = await traduzirComCache(pt, destino);
        if (TRAD_PALAVRAS_INVALIDAS.some((erro) => trad.includes(erro))) return null;
        if (trad === pt.toLowerCase()) return null;
        return [pt, trad];
      } catch {
        return null;
      }
    })
  );

  return pares.filter(Boolean).slice(0, 10);
}

function iniciarSelecaoQuizPronunciaTradutor() {
  renderizarTelaNomeTradutor(tradEl.quizPronunciaArea, (nome) => {
    renderizarSelecaoDificuldade(tradEl.quizPronunciaArea, (dificuldade) => iniciarQuizPronunciaTradutor(dificuldade, nome));
  });
}

function iniciarQuizPronunciaTradutor(dificuldade, nome) {
  if (!reconhecimentoDeVozSuportado()) {
    tradEl.quizPronunciaArea.innerHTML = '<p class="trad-quiz-erro">Reconhecimento de voz não é suportado neste navegador. Tente no Chrome ou Edge.</p>';
    return;
  }

  tradEl.quizPronunciaArea.innerHTML = '<p class="trad-vazio">Preparando quiz (traduzindo palavras)...</p>';

  montarQuizPronunciaTradutor(dificuldade, tradEl.destino.value).then((pares) => {
    if (pares.length < 5) {
      tradEl.quizPronunciaArea.innerHTML = '<p class="trad-quiz-erro">Não foi possível montar o quiz pra esse idioma/dificuldade. Tente outro idioma de destino.</p>';
      const voltar = document.createElement("button");
      voltar.type = "button";
      voltar.className = "trad-quiz-voltar";
      voltar.textContent = "⬅ Escolher outra dificuldade";
      voltar.addEventListener("click", () => renderizarSelecaoDificuldade(tradEl.quizPronunciaArea, (d) => iniciarQuizPronunciaTradutor(d, nome)));
      tradEl.quizPronunciaArea.appendChild(voltar);
      return;
    }
    renderizarQuestaoPronunciaTradutor({ pares, indice: 0, acertos: 0, nome, dificuldade });
  });
}

function renderizarQuestaoPronunciaTradutor(estadoQuiz) {
  if (estadoQuiz.indice >= estadoQuiz.pares.length) {
    renderizarResultadoPronunciaTradutor(estadoQuiz);
    return;
  }

  const [pt, alvo] = estadoQuiz.pares[estadoQuiz.indice];
  const destino = tradEl.destino.value;
  tradEl.quizPronunciaArea.innerHTML = "";

  const contador = document.createElement("p");
  contador.className = "trad-quiz-contador";
  contador.textContent = `Palavra ${estadoQuiz.indice + 1} de ${estadoQuiz.pares.length} — acertos: ${estadoQuiz.acertos}`;

  const topo = document.createElement("div");
  topo.className = "trad-pronuncia-topo";
  const alvoTexto = document.createElement("span");
  alvoTexto.className = "trad-pronuncia-palavra";
  alvoTexto.textContent = alvo;
  const ouvirBtn = document.createElement("button");
  ouvirBtn.type = "button";
  ouvirBtn.className = "trad-icon-btn";
  ouvirBtn.title = "Ouvir pronúncia correta";
  ouvirBtn.textContent = "🔊";
  ouvirBtn.addEventListener("click", () => tocarTTS(alvo, destino));
  topo.append(alvoTexto, ouvirBtn);

  const traducaoPt = document.createElement("p");
  traducaoPt.className = "trad-pronuncia-traducao";
  traducaoPt.textContent = `(${pt} em português)`;

  const status = document.createElement("p");
  status.className = "trad-pronuncia-status";
  status.textContent = "Toque em Falar e pronuncie a palavra acima.";

  const micBtn = document.createElement("button");
  micBtn.type = "button";
  micBtn.className = "trad-mic-btn";
  micBtn.textContent = "🎤 Falar";
  micBtn.addEventListener("click", async () => {
    micBtn.disabled = true;
    micBtn.textContent = "🎤 Ouvindo...";
    try {
      const falado = await reconhecerFala(destino, 8);
      if (!falado) {
        status.textContent = "Não captei nenhuma fala. Verifique a permissão do microfone e tente de novo.";
        micBtn.disabled = false;
        micBtn.textContent = "🎤 Falar";
        return;
      }
      const proporcao = similaridadeTradutor(falado, alvo);
      const acertou = proporcao >= 0.7;
      if (acertou) estadoQuiz.acertos += 1;
      status.textContent = `Você disse: "${falado}"\n${acertou ? "✅ Boa pronúncia!" : "❌ Tente de novo na próxima."}`;
      micBtn.remove();

      const avancar = document.createElement("button");
      avancar.type = "button";
      avancar.className = "trad-quiz-avancar";
      avancar.textContent = estadoQuiz.indice + 1 < estadoQuiz.pares.length ? "Avançar ➡" : "Ver resultado";
      avancar.addEventListener("click", () => {
        estadoQuiz.indice += 1;
        renderizarQuestaoPronunciaTradutor(estadoQuiz);
      });
      tradEl.quizPronunciaArea.appendChild(avancar);
    } catch (erro) {
      status.textContent = erro.message || "Não entendi, tente novamente.";
      micBtn.disabled = false;
      micBtn.textContent = "🎤 Falar";
    }
  });

  tradEl.quizPronunciaArea.append(contador, topo, traducaoPt, status, micBtn);
}

function renderizarResultadoPronunciaTradutor(estadoQuiz) {
  salvarHistoricoQuizPronunciaTradutor(estadoQuiz.nome, estadoQuiz.dificuldade, tradEl.destino.value, estadoQuiz.acertos);

  tradEl.quizPronunciaArea.innerHTML = "";

  const titulo = document.createElement("p");
  titulo.className = "trad-quiz-resultado-titulo";
  const porcentagem = Math.round((estadoQuiz.acertos / estadoQuiz.pares.length) * 100);
  titulo.textContent = `Você acertou ${estadoQuiz.acertos} de ${estadoQuiz.pares.length} (${porcentagem}%)`;

  const jogarDeNovo = document.createElement("button");
  jogarDeNovo.type = "button";
  jogarDeNovo.className = "trad-quiz-avancar";
  jogarDeNovo.textContent = "🔄 Jogar de novo";
  jogarDeNovo.addEventListener("click", iniciarSelecaoQuizPronunciaTradutor);

  tradEl.quizPronunciaArea.append(titulo, jogarDeNovo);
}

tradEl.abrirQuizPronunciaBtn.addEventListener("click", () => {
  iniciarSelecaoQuizPronunciaTradutor();
  openModal(tradEl.quizPronunciaModal);
});

// ---- Quiz contra o tempo (mesmas perguntas do quiz de vocabulário, com cronômetro) --

function renderizarSelecaoTempoTradutor(area, aoEscolher) {
  area.innerHTML = "";
  const label = document.createElement("p");
  label.className = "trad-quiz-nome-label";
  label.textContent = "Quantos segundos por pergunta?";
  area.appendChild(label);
  [5, 10, 15].forEach((segundos) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "trad-dificuldade-btn medio";
    btn.textContent = `${segundos}s`;
    btn.addEventListener("click", () => aoEscolher(segundos));
    area.appendChild(btn);
  });
}

function iniciarSelecaoQuizTempoTradutor() {
  renderizarTelaNomeTradutor(tradEl.quizTempoArea, (nome) => {
    renderizarSelecaoDificuldade(tradEl.quizTempoArea, (dificuldade) => {
      renderizarSelecaoTempoTradutor(tradEl.quizTempoArea, (segundos) => iniciarQuizTempoTradutor(dificuldade, nome, segundos));
    });
  });
}

function iniciarQuizTempoTradutor(dificuldade, nome, tempoEscolhido) {
  tradEl.quizTempoArea.innerHTML = '<p class="trad-vazio">Preparando quiz (traduzindo palavras)...</p>';

  montarQuizVocabularioTradutor(dificuldade, tradEl.destino.value).then((quiz) => {
    if (quiz.length === 0) {
      tradEl.quizTempoArea.innerHTML = '<p class="trad-quiz-erro">Não foi possível montar o quiz pra esse idioma/dificuldade. Tente outro idioma de destino.</p>';
      const voltar = document.createElement("button");
      voltar.type = "button";
      voltar.className = "trad-quiz-voltar";
      voltar.textContent = "⬅ Escolher de novo";
      voltar.addEventListener("click", iniciarSelecaoQuizTempoTradutor);
      tradEl.quizTempoArea.appendChild(voltar);
      return;
    }
    renderizarQuestaoTempoTradutor({ quiz, indice: 0, acertos: 0, erros: 0, nome, dificuldade, tempoEscolhido, intervalo: null });
  });
}

function renderizarQuestaoTempoTradutor(estadoQuiz) {
  if (estadoQuiz.intervalo) clearInterval(estadoQuiz.intervalo);

  if (estadoQuiz.indice >= estadoQuiz.quiz.length) {
    renderizarResultadoTempoTradutor(estadoQuiz);
    return;
  }

  const pergunta = estadoQuiz.quiz[estadoQuiz.indice];
  tradEl.quizTempoArea.innerHTML = "";

  const contador = document.createElement("p");
  contador.className = "trad-quiz-contador";
  contador.textContent = `Pergunta ${estadoQuiz.indice + 1} de ${estadoQuiz.quiz.length} — acertos: ${estadoQuiz.acertos} — erros: ${estadoQuiz.erros}`;

  const barra = document.createElement("div");
  barra.className = "trad-tempo-barra";
  const barraInterna = document.createElement("div");
  barraInterna.className = "trad-tempo-barra-interna";
  barraInterna.style.width = "100%";
  barra.appendChild(barraInterna);

  const palavra = document.createElement("p");
  palavra.className = "trad-quiz-pergunta";
  palavra.textContent = pergunta.pt;

  tradEl.quizTempoArea.append(contador, barra, palavra);

  const finalizarPergunta = (opcaoEscolhida) => {
    clearInterval(estadoQuiz.intervalo);
    const acertou = opcaoEscolhida === pergunta.correta;
    if (acertou) estadoQuiz.acertos += 1;
    else estadoQuiz.erros += 1;

    tradEl.quizTempoArea.querySelectorAll(".trad-quiz-opcao").forEach((outro) => {
      outro.disabled = true;
      if (outro.textContent === opcaoEscolhida && opcaoEscolhida) outro.classList.add(acertou ? "certa" : "errada");
      if (outro.textContent === pergunta.correta && (!acertou || !opcaoEscolhida)) outro.classList.add("correta-revelada");
    });

    const avancar = document.createElement("button");
    avancar.type = "button";
    avancar.className = "trad-quiz-avancar";
    avancar.textContent = estadoQuiz.indice + 1 < estadoQuiz.quiz.length ? "Avançar ➡" : "Ver resultado";
    avancar.addEventListener("click", () => {
      estadoQuiz.indice += 1;
      renderizarQuestaoTempoTradutor(estadoQuiz);
    });
    tradEl.quizTempoArea.appendChild(avancar);
  };

  pergunta.opcoes.forEach((opcao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "trad-quiz-opcao";
    btn.textContent = opcao;
    btn.addEventListener("click", () => finalizarPergunta(opcao));
    tradEl.quizTempoArea.appendChild(btn);
  });

  const tempoTotalMs = estadoQuiz.tempoEscolhido * 1000;
  const inicio = performance.now();
  estadoQuiz.intervalo = setInterval(() => {
    const restante = tempoTotalMs - (performance.now() - inicio);
    if (restante <= 0) {
      barraInterna.style.width = "0%";
      finalizarPergunta(null);
      return;
    }
    const proporcao = restante / tempoTotalMs;
    barraInterna.style.width = `${proporcao * 100}%`;
    barraInterna.classList.toggle("urgente", proporcao < 0.3);
  }, 100);
}

function renderizarResultadoTempoTradutor(estadoQuiz) {
  salvarHistoricoQuizTempoTradutor(estadoQuiz.nome, tradEl.destino.value, estadoQuiz.dificuldade, estadoQuiz.erros, estadoQuiz.acertos);

  tradEl.quizTempoArea.innerHTML = "";

  const titulo = document.createElement("p");
  titulo.className = "trad-quiz-resultado-titulo";
  titulo.textContent = `${estadoQuiz.acertos} acertos e ${estadoQuiz.erros} erros`;

  const jogarDeNovo = document.createElement("button");
  jogarDeNovo.type = "button";
  jogarDeNovo.className = "trad-quiz-avancar";
  jogarDeNovo.textContent = "🔄 Jogar de novo";
  jogarDeNovo.addEventListener("click", iniciarSelecaoQuizTempoTradutor);

  tradEl.quizTempoArea.append(titulo, jogarDeNovo);
}

tradEl.abrirQuizTempoBtn.addEventListener("click", () => {
  iniciarSelecaoQuizTempoTradutor();
  openModal(tradEl.quizTempoModal);
});

// ---- Quiz de texto (parágrafo longo, pronúncia com destaque palavra a palavra) --

let tradTextosQuizCache = null;
async function carregarTextosQuizTradutor() {
  if (!tradTextosQuizCache) {
    tradTextosQuizCache = await fetch("tradutor-textos-quiz.json").then((r) => r.json());
  }
  return tradTextosQuizCache;
}

// Aproxima difflib.SequenceMatcher.ratio()/get_opcodes() usando LCS entre as
// duas listas de palavras normalizadas: a razão usa a mesma fórmula
// (2 * casamentos / total de palavras) e o backtrack marca quais palavras do
// alvo fazem parte do trecho batido, pra colorir a tela em certa/errada.
function lcsPalavrasTradutor(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const marcados = new Array(m).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      marcados[i - 1] = true;
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { marcados, lcsLen: dp[m][n] };
}

function avaliarPronunciaTextoTradutor(textoAlvo, textoFalado) {
  const palavrasOriginais = textoAlvo.split(/\s+/).filter(Boolean);
  const palavrasAlvoNorm = palavrasOriginais.map((p) => normalizarComparacaoTradutor(p));
  const palavrasDitasNorm = textoFalado
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => normalizarComparacaoTradutor(p));

  const { marcados, lcsLen } = lcsPalavrasTradutor(palavrasAlvoNorm, palavrasDitasNorm);
  const total = palavrasAlvoNorm.length + palavrasDitasNorm.length;
  const porcentagem = total === 0 ? 0 : Math.round(((2 * lcsLen) / total) * 100);

  return { palavrasOriginais, marcados, porcentagem };
}

function iniciarSelecaoQuizTextoTradutor() {
  renderizarTelaNomeTradutor(tradEl.quizTextoArea, (nome) => {
    renderizarSelecaoDificuldade(tradEl.quizTextoArea, (dificuldade) => iniciarQuizTextoTradutor(dificuldade, nome));
  });
}

async function iniciarQuizTextoTradutor(dificuldade, nome) {
  tradEl.quizTextoArea.innerHTML = '<p class="trad-vazio">Preparando texto (traduzindo)...</p>';

  const textos = await carregarTextosQuizTradutor();
  const lista = textos[dificuldade] || [];
  if (lista.length === 0) {
    tradEl.quizTextoArea.innerHTML = '<p class="trad-quiz-erro">Não há textos pra essa dificuldade.</p>';
    return;
  }

  const destino = tradEl.destino.value;
  const textoPt = lista[Math.floor(Math.random() * lista.length)];

  try {
    const textoTraduzido = await traduzirTexto(textoPt, "pt", destino);
    renderizarQuizTextoTradutor({ textoTraduzido, nome, dificuldade, destino });
  } catch {
    tradEl.quizTextoArea.innerHTML = '<p class="trad-quiz-erro">Erro ao traduzir o texto. Tente de novo.</p>';
  }
}

// Tira pontuação/aspas coladas na palavra (ex: "casa." ou "\"olá") sem mexer
// em acentos/maiúsculas, só pra ter uma palavra "limpa" pra traduzir.
function limparPalavraCliqueTradutor(palavra) {
  return palavra.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function renderizarPopupPalavraTradutor(original, traduzido, idiomaOrigem) {
  tradEl.popupPalavraArea.innerHTML = "";

  const topo = document.createElement("div");
  topo.className = "trad-modal-acoes-topo";

  const favoritar = document.createElement("button");
  favoritar.type = "button";
  favoritar.className = "trad-icon-btn trad-estrela";
  favoritar.title = "Adicionar aos favoritos";
  favoritar.textContent = favoritoExisteTradutor(original, traduzido) ? "⭐" : "☆";
  favoritar.addEventListener("click", () => {
    if (favoritoExisteTradutor(original, traduzido)) removerFavoritoTradutor(original, traduzido);
    else adicionarFavoritoTradutor(original, traduzido, idiomaOrigem, "pt");
    favoritar.textContent = favoritoExisteTradutor(original, traduzido) ? "⭐" : "☆";
  });

  const ouvir = document.createElement("button");
  ouvir.type = "button";
  ouvir.className = "trad-icon-btn";
  ouvir.title = "Ouvir pronúncia";
  ouvir.textContent = "🔊";
  ouvir.addEventListener("click", () => tocarTTS(original, idiomaOrigem));

  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.className = "trad-icon-btn";
  copiar.title = "Copiar tradução";
  copiar.textContent = "📋";
  copiar.addEventListener("click", () => navigator.clipboard.writeText(traduzido));

  topo.append(favoritar, ouvir, copiar);

  const area = document.createElement("div");
  area.className = "trad-palavra-dia-area";
  const originalEl = document.createElement("p");
  originalEl.className = "trad-palavra-dia-original";
  originalEl.textContent = original;
  const traduzidoEl = document.createElement("p");
  traduzidoEl.className = "trad-palavra-dia-traduzida";
  traduzidoEl.textContent = traduzido;
  area.append(originalEl, traduzidoEl);

  tradEl.popupPalavraArea.append(topo, area);
}

async function abrirPopupPalavraTradutor(palavra, idiomaOrigem) {
  tradEl.popupPalavraArea.innerHTML = '<p class="trad-vazio">Carregando...</p>';
  // esse popup é reusado pelo Mundo Aberto (ver abrirPopupObjetoMundo), que
  // liga essa classe pra girar o popup junto com o mapa no celular - aqui
  // (Quiz de Texto) o popup nunca deve estar girado, então garante que a
  // classe não "vazou" de uma abertura anterior via Mundo Aberto.
  tradEl.popupPalavraModal.classList.remove("mundo-popup-girado");
  openModal(tradEl.popupPalavraModal);
  try {
    const traduzido = (await traduzirTexto(palavra, idiomaOrigem, "pt")).toLowerCase();
    renderizarPopupPalavraTradutor(palavra, traduzido, idiomaOrigem);
  } catch {
    tradEl.popupPalavraArea.innerHTML = '<p class="trad-quiz-erro">Não foi possível traduzir essa palavra.</p>';
  }
}

// ---------------------------------------------------------------------------
// Mundo Aberto (mini-jogo de exploração portado do audioT original)
// ---------------------------------------------------------------------------
// A geometria de colisão (limites/paredes/obstáculos/objetos interativos)
// vem de `mundo-mapas.json`, gerado uma vez a partir do mundo_dados.py
// original do audioT (mesmos retângulos, sem transcrever nada a mão) - ver
// ARQUITETURA.md. No audioT isso vinha de um endpoint Flask; aqui é só um
// fetch de arquivo estático, igual ao resto dos dados do tradutor
// (tradutor-dicionario.json, versiculos.json etc.).
let mundoCacheMapas = null;

tradEl.abrirMundoBtn.addEventListener("click", async () => {
  openModal(tradEl.mundoMapasModal);
  const area = tradEl.mundoMapasArea;
  area.textContent = "Carregando mapas...";

  try {
    if (!mundoCacheMapas) {
      const resp = await fetch("mundo-mapas.json");
      mundoCacheMapas = await resp.json();
    }

    area.innerHTML = "";
    mundoCacheMapas.mapas.forEach((mapa) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mundo-mapa-btn";
      btn.innerHTML = `
        <img class="mundo-mapa-preview" src="${mapa.arquivo}" alt="${mapa.nome}">
        <span class="mundo-mapa-nome">${mapa.icone} ${mapa.nome}</span>
      `;
      btn.addEventListener("click", () => {
        closeModal(tradEl.mundoMapasModal);
        iniciarMundo(mapa, mapa.escala);
      });
      area.appendChild(btn);
    });
  } catch {
    area.textContent = "Erro ao carregar mapas.";
  }
});

// Visual celular: gira só o CONTEÚDO (canvas+controles / imagem da lagoa),
// não a tela inteira - a barra de cima (título/dica/sair) fica sempre
// normal. `elemento` é o bloco a girar, `area` é o container onde ele
// deve caber depois de girado (o pai direto, já sem a barra de cima).
// Mede com getBoundingClientRect() de verdade em vez de confiar em
// 100vh/100vw puro no CSS, que pode não bater com o espaço visual real
// (barra de endereço do navegador mobile aparecendo/sumindo, etc). Fora
// do modo celular, limpa o estilo inline pro CSS assumir de novo - sem
// isso um valor antigo "vazaria" pra próxima vez que o jogo abrir no
// visual computador.
function ajustarRotacaoMundo(elemento, area) {
  if (document.documentElement.dataset.view === "mobile") {
    const rect = area.getBoundingClientRect();
    elemento.style.top = "0px";
    elemento.style.left = `${rect.width}px`;
    elemento.style.width = `${rect.height}px`;
    elemento.style.height = `${rect.width}px`;
  } else {
    elemento.style.top = "";
    elemento.style.left = "";
    elemento.style.width = "";
    elemento.style.height = "";
  }
}

function mundoDistanciaAteCaixa(px, py, x1, y1, x2, y2) {
  const cx = Math.max(x1, Math.min(px, x2));
  const cy = Math.max(y1, Math.min(py, y2));
  return Math.hypot(px - cx, py - cy);
}

function mundoDentroDaAreaCaminhavel(x, y, mapa) {
  const dentroDeAlgumComodo = mapa.limites.some(
    ([x1, y1, x2, y2]) => x >= x1 && x <= x2 && y >= y1 && y <= y2
  );
  if (!dentroDeAlgumComodo) return false;

  const dentroDeAlgumaParede = mapa.paredes.some(
    ([x1, y1, x2, y2]) => x >= x1 && x <= x2 && y >= y1 && y <= y2
  );
  if (dentroDeAlgumaParede) return false;

  const dentroDeAlgumObstaculo = mapa.obstaculos.some(
    ([x1, y1, x2, y2]) => x >= x1 && x <= x2 && y >= y1 && y <= y2
  );
  return !dentroDeAlgumObstaculo;
}

const MUNDO_RAIO_INTERACAO = 45;
const MUNDO_ALTURA_PERSONAGEM = 60;
const MUNDO_TAMANHO_BADGE_E = 34;
const MUNDO_CAMINHO_BADGE_E = "imagesmap/Ebtt.png";
const MUNDO_RAIO_LAGOA = 70;
const MUNDO_MAPA_TECLAS = {
  w: "Up", a: "Left", s: "Down", d: "Right",
  arrowup: "Up", arrowdown: "Down", arrowleft: "Left", arrowright: "Right",
};

function iniciarMundo(mapa, escala) {
  const overlay = tradEl.mundoJogoOverlay;
  const canvas = tradEl.mundoCanvas;
  const ctx = canvas.getContext("2d");

  tradEl.mundoJogoTitulo.textContent = mapa.nome;

  const imagemMapa = new Image();
  const imagemBadgeE = new Image();
  const sprites = {};
  const direcoes = ["parado", "esquerda", "direita", "cima", "baixo"];
  let imagensPendentes = 2 + direcoes.length;

  function aoCarregarImagem() {
    imagensPendentes -= 1;
    if (imagensPendentes === 0) comecarJogo();
  }

  imagemMapa.onload = aoCarregarImagem;
  imagemMapa.src = mapa.arquivo;

  imagemBadgeE.onload = aoCarregarImagem;
  imagemBadgeE.src = MUNDO_CAMINHO_BADGE_E;

  direcoes.forEach((direcao) => {
    const img = new Image();
    img.onload = aoCarregarImagem;
    img.src = mapa.sprites[direcao];
    sprites[direcao] = img;
  });

  const posicao = { x: mapa.posicao_inicial[0], y: mapa.posicao_inicial[1] };
  const teclas = { Up: false, Down: false, Left: false, Right: false };
  let direcaoAtual = "parado";
  let objetoProximo = null;
  let centroLagoaProximo = null;
  let quadroAnimacao = null;

  function popupObjetoAberto() {
    return !tradEl.popupPalavraModal.hidden;
  }
  function lagoaAberta() {
    return !tradEl.lagoaOverlay.hidden;
  }

  function interagir() {
    if (!objetoProximo || popupObjetoAberto()) return;
    abrirPopupObjetoMundo(objetoProximo[4]);
  }
  function interagirComLagoa() {
    if (!centroLagoaProximo || lagoaAberta()) return;
    abrirLagoa(mapa);
  }

  // Controles de toque (só no visual celular) - substituem WASD/setas por
  // um analógico e as teclas E/R por um único botão contextual. Como o
  // overlay inteiro gira 90° em CSS no celular (ver tradutor.css), um
  // toque "pra direita" na tela de verdade precisa virar "Up" no jogo (e
  // não "Right") pra sensação de controle bater com o que a pessoa vê -
  // a matemática completa do porquê está no ARQUITETURA.md.
  const controleToqueAtivo = document.documentElement.dataset.view === "mobile";
  let acaoBotaoToque = null;

  function pararJoystick() {
    teclas.Up = teclas.Down = teclas.Left = teclas.Right = false;
    tradEl.mundoJoystickKnob.style.transform = "translate(0px, 0px)";
  }

  function moverJoystick(evento) {
    const base = tradEl.mundoJoystickBase;
    const rect = base.getBoundingClientRect();
    const raio = rect.width / 2;
    let dx = evento.clientX - (rect.left + raio);
    let dy = evento.clientY - (rect.top + raio);
    const distancia = Math.hypot(dx, dy);
    if (distancia > raio) {
      dx = (dx / distancia) * raio;
      dy = (dy / distancia) * raio;
    }
    // A bolinha é filha do bloco que já está girado 90° (ver
    // ARQUITETURA.md), então um translate(dx,dy) "cru" giraria de novo em
    // cima da rotação do pai e pareceria andar numa direção errada/
    // aleatória (mesmo o personagem indo pro lado certo, calculado
    // direto de dx/dy antes de qualquer rotação, logo abaixo). Compensa
    // com a rotação inversa: translate(dy, -dx) em vez de (dx, dy).
    tradEl.mundoJoystickKnob.style.transform = `translate(${dy}px, ${-dx}px)`;

    const zonaMorta = raio * 0.25;
    teclas.Up = dx > zonaMorta;
    teclas.Down = dx < -zonaMorta;
    teclas.Right = dy > zonaMorta;
    teclas.Left = dy < -zonaMorta;
  }

  function aoJoystickBaixo(evento) {
    evento.preventDefault();
    tradEl.mundoJoystickBase.setPointerCapture(evento.pointerId);
    moverJoystick(evento);
  }

  if (controleToqueAtivo) {
    tradEl.mundoJogoDica.textContent = "Analógico pra mover · toque no 👆 pra interagir";
    tradEl.mundoJoystickBase.hidden = false;
    tradEl.mundoJoystickBase.onpointerdown = aoJoystickBaixo;
    tradEl.mundoJoystickBase.onpointermove = moverJoystick;
    tradEl.mundoJoystickBase.onpointerup = pararJoystick;
    tradEl.mundoJoystickBase.onpointercancel = pararJoystick;
    tradEl.mundoBotaoInteragir.onclick = () => acaoBotaoToque && acaoBotaoToque();
  } else {
    tradEl.mundoJogoDica.textContent = "WASD / setas para mover · E para interagir";
  }

  function atualizarBotaoToque() {
    if (!controleToqueAtivo) return;
    if (objetoProximo) {
      acaoBotaoToque = interagir;
      tradEl.mundoBotaoInteragirLabel.textContent = "Interagir";
      tradEl.mundoBotaoInteragir.hidden = false;
    } else if (centroLagoaProximo) {
      acaoBotaoToque = interagirComLagoa;
      tradEl.mundoBotaoInteragirLabel.textContent = "Ver lagoa";
      tradEl.mundoBotaoInteragir.hidden = false;
    } else {
      acaoBotaoToque = null;
      tradEl.mundoBotaoInteragir.hidden = true;
    }
  }

  function aoTeclaBaixo(evento) {
    const chave = evento.key.toLowerCase();
    const direcao = MUNDO_MAPA_TECLAS[chave];

    if (direcao) {
      evento.preventDefault();
      teclas[direcao] = true;
      return;
    }
    if (chave === "e" && !evento.repeat) interagir();
    if (chave === "r" && !evento.repeat) interagirComLagoa();
  }

  function aoTeclaCima(evento) {
    const direcao = MUNDO_MAPA_TECLAS[evento.key.toLowerCase()];
    if (direcao) {
      evento.preventDefault();
      teclas[direcao] = false;
    }
  }

  document.addEventListener("keydown", aoTeclaBaixo);
  document.addEventListener("keyup", aoTeclaCima);

  const velocidade = 4;

  function atualizar() {
    let dx = 0;
    let dy = 0;
    if (teclas.Up) dy -= velocidade;
    if (teclas.Down) dy += velocidade;
    if (teclas.Left) dx -= velocidade;
    if (teclas.Right) dx += velocidade;

    // testa cada eixo separado - permite "deslizar" ao longo de uma parede
    // em vez de travar tudo quando só uma direção bate
    if (dx !== 0) {
      const novoX = posicao.x + dx;
      if (mundoDentroDaAreaCaminhavel(novoX, posicao.y, mapa)) posicao.x = novoX;
    }
    if (dy !== 0) {
      const novoY = posicao.y + dy;
      if (mundoDentroDaAreaCaminhavel(posicao.x, novoY, mapa)) posicao.y = novoY;
    }

    if (teclas.Left) direcaoAtual = "esquerda";
    else if (teclas.Right) direcaoAtual = "direita";
    else if (teclas.Up) direcaoAtual = "cima";
    else if (teclas.Down) direcaoAtual = "baixo";
    else direcaoAtual = "parado";

    objetoProximo = null;
    let menorDistancia = MUNDO_RAIO_INTERACAO;
    for (const objeto of mapa.objetos_interativos) {
      const [ox1, oy1, ox2, oy2] = objeto;
      const distancia = mundoDistanciaAteCaixa(posicao.x, posicao.y, ox1, oy1, ox2, oy2);
      if (distancia <= menorDistancia) {
        menorDistancia = distancia;
        objetoProximo = objeto;
      }
    }

    // prompt "Ver lagoa (R)" - mesmo mecanismo da tecla E, mas com tecla e
    // zona próprias, independente dos objetos da tecla E
    centroLagoaProximo = null;
    let menorDistanciaLagoa = MUNDO_RAIO_LAGOA;
    for (const [x1, y1, x2, y2] of mapa.zona_lagoa || []) {
      const distancia = mundoDistanciaAteCaixa(posicao.x, posicao.y, x1, y1, x2, y2);
      if (distancia <= menorDistanciaLagoa) {
        menorDistanciaLagoa = distancia;
        centroLagoaProximo = [(x1 + x2) / 2, (y1 + y2) / 2];
      }
    }

    atualizarBotaoToque();
    desenhar();
  }

  function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagemMapa, 0, 0, canvas.width, canvas.height);

    const sprite = sprites[direcaoAtual];
    const largura = sprite.naturalWidth * (MUNDO_ALTURA_PERSONAGEM / sprite.naturalHeight);
    ctx.drawImage(
      sprite,
      posicao.x - largura / 2,
      posicao.y - MUNDO_ALTURA_PERSONAGEM / 2,
      largura,
      MUNDO_ALTURA_PERSONAGEM
    );

    if (objetoProximo) {
      const [ox1, oy1, ox2, oy2] = objetoProximo;
      const cx = (ox1 + ox2) / 2;
      const cy = (oy1 + oy2) / 2;
      ctx.drawImage(
        imagemBadgeE,
        cx - MUNDO_TAMANHO_BADGE_E / 2,
        cy - MUNDO_TAMANHO_BADGE_E / 2,
        MUNDO_TAMANHO_BADGE_E,
        MUNDO_TAMANHO_BADGE_E
      );
    }

    if (centroLagoaProximo) {
      const texto = "Ver lagoa (R)";
      const [cx, cy] = centroLagoaProximo;

      ctx.font = "bold 15px Segoe UI";
      const larguraTexto = ctx.measureText(texto).width;
      const padX = 14;
      const padY = 9;
      const caixaLargura = larguraTexto + padX * 2;
      const caixaAltura = 15 + padY * 2;
      const raio = caixaAltura / 2;
      const esquerda = cx - caixaLargura / 2;
      const topo = cy - caixaAltura / 2;

      ctx.beginPath();
      ctx.moveTo(esquerda + raio, topo);
      ctx.arcTo(esquerda + caixaLargura, topo, esquerda + caixaLargura, topo + caixaAltura, raio);
      ctx.arcTo(esquerda + caixaLargura, topo + caixaAltura, esquerda, topo + caixaAltura, raio);
      ctx.arcTo(esquerda, topo + caixaAltura, esquerda, topo, raio);
      ctx.arcTo(esquerda, topo, esquerda + caixaLargura, topo, raio);
      ctx.closePath();

      ctx.fillStyle = "rgba(20, 24, 30, .82)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(texto, cx, cy + 1);
    }
  }

  function aoRedimensionarJanela() {
    ajustarRotacaoMundo(tradEl.mundoJogoRotacionavel, tradEl.mundoJogoArea);
    if (!tradEl.lagoaOverlay.hidden) ajustarRotacaoMundo(tradEl.lagoaImagemWrap, tradEl.lagoaArea);
  }

  function comecarJogo() {
    canvas.width = Math.round(imagemMapa.naturalWidth * escala);
    canvas.height = Math.round(imagemMapa.naturalHeight * escala);

    overlay.hidden = false;
    ajustarRotacaoMundo(tradEl.mundoJogoRotacionavel, tradEl.mundoJogoArea);
    window.addEventListener("resize", aoRedimensionarJanela);

    canvas.focus();

    // intervalo fixo de 30ms, igual ao audioT original (janela.after(30,...))
    // - de propósito NÃO usa requestAnimationFrame, que rodaria na taxa de
    // atualização da tela (~60fps/16ms) e faria o personagem andar rápido
    // demais (quase o dobro da velocidade pretendida)
    quadroAnimacao = setInterval(atualizar, 30);
  }

  function sair() {
    if (quadroAnimacao) clearInterval(quadroAnimacao);
    document.removeEventListener("keydown", aoTeclaBaixo);
    document.removeEventListener("keyup", aoTeclaCima);
    window.removeEventListener("resize", aoRedimensionarJanela);
    tradEl.mundoJoystickBase.hidden = true;
    tradEl.mundoBotaoInteragir.hidden = true;
    overlay.hidden = true;
    fecharLagoa();
  }

  tradEl.mundoSairBtn.onclick = sair;
}

function abrirLagoa(mapa) {
  const imagem = tradEl.lagoaImagem;
  const wrap = tradEl.lagoaImagemWrap;

  function montarHotspots() {
    wrap.querySelectorAll(".lagoa-hotspot").forEach((hotspot) => hotspot.remove());

    const largura = imagem.naturalWidth;
    const altura = imagem.naturalHeight;

    (mapa.animais_lagoa || []).forEach(([x1, y1, x2, y2, palavra]) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "lagoa-hotspot";
      botao.title = palavra;
      botao.style.left = `${(cx / largura) * 100}%`;
      botao.style.top = `${(cy / altura) * 100}%`;
      botao.addEventListener("click", () => abrirPopupObjetoMundo(palavra));
      wrap.appendChild(botao);
    });
  }

  imagem.onload = montarHotspots;
  imagem.src = mapa.imagem_lagoa;
  if (imagem.complete && imagem.naturalWidth > 0) montarHotspots();

  tradEl.lagoaOverlay.hidden = false;
  ajustarRotacaoMundo(tradEl.lagoaImagemWrap, tradEl.lagoaArea);
}

function fecharLagoa() {
  tradEl.lagoaOverlay.hidden = true;
}

tradEl.lagoaSairBtn.addEventListener("click", fecharLagoa);

// Reusa o mesmo popup/modal já criado pro clique de palavra do Quiz de
// Texto (renderizarPopupPalavraTradutor) - aqui a palavra clicada é sempre
// em português (label do objeto do mundo), então traduz na direção
// contrária (pt -> idioma de destino atual) e toca o áudio sozinho assim
// que abre (igual ao audioT original - lá era o comportamento padrão do
// popup de objeto, diferente do popup de palavra do Quiz de Texto que só
// toca se a pessoa clicar em 🔊).
async function abrirPopupObjetoMundo(palavraPt) {
  const idiomaDestino = tradEl.destino.value;
  tradEl.popupPalavraArea.innerHTML = '<p class="trad-vazio">Carregando...</p>';
  // gira o popup junto com o mapa no visual celular (pedido do usuário) -
  // some de novo em abrirPopupPalavraTradutor (Quiz de Texto), que não usa
  // tela girada.
  tradEl.popupPalavraModal.classList.toggle(
    "mundo-popup-girado",
    document.documentElement.dataset.view === "mobile"
  );
  openModal(tradEl.popupPalavraModal);
  try {
    const traduzido = await traduzirTexto(palavraPt, "pt", idiomaDestino);
    renderizarPopupPalavraTradutor(traduzido, palavraPt, idiomaDestino);
    tocarTTS(traduzido, idiomaDestino);
  } catch {
    tradEl.popupPalavraArea.innerHTML = '<p class="trad-quiz-erro">Não foi possível traduzir essa palavra.</p>';
  }
}

function renderizarQuizTextoTradutor(estado) {
  if (!reconhecimentoDeVozSuportado()) {
    tradEl.quizTextoArea.innerHTML = '<p class="trad-quiz-erro">Reconhecimento de voz não é suportado neste navegador. Tente no Chrome ou Edge.</p>';
    return;
  }

  tradEl.quizTextoArea.innerHTML = "";

  const conteudo = document.createElement("div");
  conteudo.className = "trad-texto-quiz-conteudo";
  conteudo.textContent = estado.textoTraduzido;

  const status = document.createElement("p");
  status.className = "trad-pronuncia-status";
  status.textContent = "Toque em Falar e leia o texto acima em voz alta.";

  const micBtn = document.createElement("button");
  micBtn.type = "button";
  micBtn.className = "trad-mic-btn";
  micBtn.textContent = "🎤 Falar";

  const finalizarComResultado = (falado) => {
    const { palavrasOriginais, marcados, porcentagem } = avaliarPronunciaTextoTradutor(estado.textoTraduzido, falado);

    conteudo.innerHTML = "";
    palavrasOriginais.forEach((palavra, indice) => {
      const span = document.createElement("span");
      span.className = `${marcados[indice] ? "trad-palavra-certa" : "trad-palavra-errada"} trad-palavra-clicavel`;
      span.textContent = `${palavra} `;
      span.title = "Toque pra ver tradução e pronúncia";
      span.addEventListener("click", () => {
        const palavraLimpa = limparPalavraCliqueTradutor(palavra);
        if (palavraLimpa) abrirPopupPalavraTradutor(palavraLimpa, estado.destino);
      });
      conteudo.appendChild(span);
    });

    salvarHistoricoQuizTextoTradutor(estado.nome, estado.dificuldade, estado.destino, porcentagem);

    const titulo = document.createElement("p");
    titulo.className = "trad-porcentagem-titulo";
    titulo.textContent = `${porcentagem}% de acerto`;

    const jogarDeNovo = document.createElement("button");
    jogarDeNovo.type = "button";
    jogarDeNovo.className = "trad-quiz-avancar";
    jogarDeNovo.textContent = "🔄 Tentar outro texto";
    jogarDeNovo.addEventListener("click", iniciarSelecaoQuizTextoTradutor);

    status.remove();
    tradEl.quizTextoArea.querySelectorAll(".trad-mic-btn").forEach((btn) => btn.remove());
    tradEl.quizTextoArea.append(titulo, jogarDeNovo);
  };

  micBtn.addEventListener("click", () => {
    // sem limite de tempo curto pra ler um parágrafo inteiro - fica ouvindo
    // até a pessoa mesmo apertar "Parar e conferir" (com um teto de 2min de
    // segurança), igual ao botão "Terminar" do reconhecer_fala_cancelavel
    // do audioT.
    const { promise, parar } = criarReconhecimentoContinuoTradutor(estado.destino, 120);

    const pararBtn = document.createElement("button");
    pararBtn.type = "button";
    pararBtn.className = "trad-mic-btn trad-mic-parar";
    pararBtn.textContent = "⏹ Parar e conferir";
    pararBtn.addEventListener("click", () => {
      pararBtn.disabled = true;
      pararBtn.textContent = "Conferindo...";
      parar();
    });

    status.textContent = "🎙️ Ouvindo... leia o texto acima e toque em \"Parar e conferir\" quando terminar.";
    micBtn.replaceWith(pararBtn);

    promise
      .then((falado) => {
        if (!falado) {
          status.textContent = "Não captei nenhuma fala. Verifique a permissão do microfone e tente de novo.";
          pararBtn.replaceWith(micBtn);
          return;
        }
        finalizarComResultado(falado);
      })
      .catch((erro) => {
        status.textContent = erro.message || "Não entendi, tente novamente.";
        pararBtn.replaceWith(micBtn);
      });
  });

  tradEl.quizTextoArea.append(conteudo, status, micBtn);
}

tradEl.abrirQuizTextoBtn.addEventListener("click", () => {
  iniciarSelecaoQuizTextoTradutor();
  openModal(tradEl.quizTextoModal);
});

// ---- Histórico/ranking dos quizzes (modal combinado) -----------------------

function renderizarHistoricoQuizTradutor() {
  tradEl.historicoQuizArea.innerHTML = "";

  const criarTitulo = (texto) => {
    const h = document.createElement("p");
    h.className = "trad-ranking-titulo";
    h.textContent = texto;
    return h;
  };
  const criarVazio = (texto) => {
    const p = document.createElement("p");
    p.className = "trad-vazio";
    p.textContent = texto;
    return p;
  };

  tradEl.historicoQuizArea.appendChild(criarTitulo("🏆 Ranking (Quiz de Vocabulário)"));
  const ranking = obterRankingQuizTradutor();
  if (ranking.length === 0) {
    tradEl.historicoQuizArea.appendChild(criarVazio("Ninguém jogou o Quiz de Vocabulário ainda."));
  } else {
    ranking.forEach((item) => {
      const linha = document.createElement("div");
      linha.className = "trad-ranking-linha";
      linha.innerHTML = `<span class="trad-ranking-nome"></span><span class="trad-ranking-detalhe"></span><span class="trad-ranking-pontos"></span>`;
      linha.querySelector(".trad-ranking-nome").textContent = item.nome;
      linha.querySelector(".trad-ranking-detalhe").textContent = `${DIFICULDADE_LABEL_TRADUTOR[item.dificuldade] || item.dificuldade} · ${item.idioma}`;
      linha.querySelector(".trad-ranking-pontos").textContent = `${item.pontuacao}/10`;
      tradEl.historicoQuizArea.appendChild(linha);
    });
  }

  const secoes = [
    { chave: TRAD_HIST_QUIZ_TEMPO_KEY, titulo: "⏱️ Quiz Contra o Tempo", formatar: (i) => `${i.nome} — ${DIFICULDADE_LABEL_TRADUTOR[i.dificuldade] || i.dificuldade} · ${i.idioma} — ${i.acertos} acertos / ${i.erros} erros` },
    { chave: TRAD_HIST_QUIZ_PRONUNCIA_KEY, titulo: "🎤 Quiz de Pronúncia", formatar: (i) => `${i.nome} — ${DIFICULDADE_LABEL_TRADUTOR[i.dificuldade] || i.dificuldade} · ${i.idioma} — ${i.pontuacao}/10` },
    { chave: TRAD_HIST_QUIZ_TEXTO_KEY, titulo: "📄 Quiz de Texto", formatar: (i) => `${i.nome} — ${DIFICULDADE_LABEL_TRADUTOR[i.dificuldade] || i.dificuldade} · ${i.idioma} — ${i.porcentagem}%` },
  ];

  secoes.forEach(({ chave, titulo, formatar }) => {
    tradEl.historicoQuizArea.appendChild(criarTitulo(titulo));
    const lista = [...lerListaLocalTradutor(chave)].reverse();
    if (lista.length === 0) {
      tradEl.historicoQuizArea.appendChild(criarVazio("Nenhum resultado ainda."));
      return;
    }
    lista.slice(0, 10).forEach((item) => {
      const linha = document.createElement("p");
      linha.className = "trad-historico-linha";
      linha.textContent = formatar(item);
      tradEl.historicoQuizArea.appendChild(linha);
    });
  });
}

tradEl.abrirHistoricoQuizBtn.addEventListener("click", () => {
  renderizarHistoricoQuizTradutor();
  openModal(tradEl.historicoQuizModal);
});

// ---- Limpar históricos ------------------------------------------------------

tradEl.limparHistoricosBtn.addEventListener("click", () => {
  if (!confirm("Apagar o histórico de traduções e de todos os quizzes? Os favoritos não são afetados.")) return;
  localStorage.removeItem(TRAD_HISTORICO_KEY);
  limparHistoricosQuizTradutor();
  showToast("Históricos apagados.");
});

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------
const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE_AQUI");

if (!isConfigured) {
  el.setupNotice.hidden = false;
  el.loadingState.hidden = true;
  el.emptyState.hidden = false;
  el.emptyState.querySelector("p").textContent = "Configure o Firebase para o mural funcionar.";
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  db = getFirestore(app);
  const tasksRef = collection(db, "tarefas");

  iniciarChatVersiculo();
  iniciarContadorVisitas();
  iniciarEnquetes();
  iniciarArtes();

  onSnapshot(
    query(tasksRef, orderBy("prazo", "asc")),
    (snapshot) => {
      allTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderFilterBar();
      renderBoard();
    },
    (error) => {
      console.error(error);
      el.loadingState.hidden = true;
      showToast("Não foi possível carregar as tarefas.");
    }
  );

  onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    el.loginBtn.hidden = isAdmin;
    el.logoutBtn.hidden = !isAdmin;
    el.addTaskBtn.hidden = !isAdmin;
    renderBoard();
    iniciarChatVersiculo();

    el.duvidaFormWrap.hidden = isAdmin;
    el.duvidaListWrap.hidden = !isAdmin;
    if (isAdmin) {
      startDuvidasListener();
      stopDuvidasPublicListener();
    } else {
      stopDuvidasListener();
      startDuvidasPublicListener();
    }

    el.ideiaFormWrap.hidden = isAdmin;
    el.ideiaListWrap.hidden = !isAdmin;
    if (isAdmin) startIdeiasListener();
    else stopIdeiasListener();

    el.addEnqueteBtn.hidden = !isAdmin;
    renderEnquetes();
    renderArtes(allArtes);
  });

  el.duvidaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.duvidaError.hidden = true;
    const nome = el.duvidaNome.value.trim();
    const duvida = el.duvidaTexto.value.trim();
    if (!nome || !duvida) {
      el.duvidaError.textContent = "Preencha seu nome e a dúvida.";
      el.duvidaError.hidden = false;
      return;
    }
    try {
      await addDoc(collection(db, "duvidas"), { nome, duvida, criadoEm: serverTimestamp() });
      el.duvidaForm.reset();
      showToast("Dúvida enviada!");
    } catch (error) {
      el.duvidaError.textContent = "Não foi possível enviar. Tente de novo.";
      el.duvidaError.hidden = false;
    }
  });

  el.ideiaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.ideiaError.hidden = true;
    const nome = el.ideiaNome.value.trim();
    const ideia = el.ideiaTexto.value.trim();
    if (!nome || !ideia) {
      el.ideiaError.textContent = "Preencha seu nome e a ideia.";
      el.ideiaError.hidden = false;
      return;
    }
    try {
      await addDoc(collection(db, "ideias"), { nome, ideia, criadoEm: serverTimestamp() });
      el.ideiaForm.reset();
      showToast("Ideia enviada!");
    } catch (error) {
      el.ideiaError.textContent = "Não foi possível enviar. Tente de novo.";
      el.ideiaError.hidden = false;
    }
  });

  el.enqueteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.enqueteError.hidden = true;
    const pergunta = el.enquetePergunta.value.trim();
    const opcoes = [...el.enqueteOpcoesArea.querySelectorAll("input")]
      .map((input) => input.value.trim())
      .filter((valor) => valor.length > 0);

    if (!pergunta || opcoes.length < 2) {
      el.enqueteError.textContent = "Preencha a pergunta e pelo menos 2 opções.";
      el.enqueteError.hidden = false;
      return;
    }

    const votos = {};
    opcoes.forEach((_, indice) => { votos[indice] = 0; });

    try {
      await addDoc(collection(db, "enquetes"), { pergunta, opcoes, votos, criadoEm: serverTimestamp() });
      closeModal(el.enqueteModal);
      showToast("Enquete criada!");
    } catch (error) {
      el.enqueteError.textContent = "Não foi possível criar a enquete.";
      el.enqueteError.hidden = false;
    }
  });

  el.arteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.arteError.hidden = true;
    const nome = el.arteNome.value.trim();
    const artista = el.arteArtista.value.trim();
    const instagramBruto = el.arteInstagram.value.trim().replace(/^@+/, "");
    if (!nome || !artista || !instagramBruto) {
      el.arteError.textContent = "Preencha todos os campos.";
      el.arteError.hidden = false;
      return;
    }
    try {
      await addDoc(collection(db, "trabalhoArtes"), {
        nome, artista, instagram: `@${instagramBruto}`, criadoEm: serverTimestamp(),
      });
      el.arteForm.reset();
      showToast("Enviado!");
    } catch (error) {
      el.arteError.textContent = "Não foi possível enviar. Tente de novo.";
      el.arteError.hidden = false;
    }
  });

  el.commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentCommentTaskId) return;
    const nome = el.commentNome.value.trim();
    const texto = el.commentTexto.value.trim();
    if (!nome || !texto) return;
    localStorage.setItem(COMMENT_NAME_KEY, nome);
    try {
      await addDoc(collection(db, "tarefas", currentCommentTaskId, "comentarios"), {
        nome, texto, criadoEm: serverTimestamp(),
      });
      el.commentTexto.value = "";
    } catch (error) {
      showToast("Não foi possível enviar o comentário.");
    }
  });

  el.loginBtn.addEventListener("click", () => openModal(el.loginModal));
  el.logoutBtn.addEventListener("click", () => {
    signOut(auth);
    showToast("Você saiu do modo admin.");
  });
  el.addTaskBtn.addEventListener("click", openAddModal);

  el.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.loginError.hidden = true;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      el.loginForm.reset();
      closeModal(el.loginModal);
      showToast("Login feito. Agora você pode adicionar tarefas.");
    } catch (error) {
      el.loginError.textContent = authErrorMessage(error.code);
      el.loginError.hidden = false;
    }
  });

  el.taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.taskError.hidden = true;

    const materia = el.taskMateria.value;
    const prazo = el.taskPrazo.value;
    const descricao = el.taskDescricao.value.trim();
    let link = el.taskLink.value.trim();
    if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;

    if (!materia || !prazo || !descricao) {
      el.taskError.textContent = "Preencha todos os campos obrigatórios.";
      el.taskError.hidden = false;
      return;
    }
    if (link && !isSafeUrl(link)) {
      el.taskError.textContent = "O link parece inválido.";
      el.taskError.hidden = false;
      return;
    }

    try {
      if (editingTaskId) {
        await updateDoc(doc(db, "tarefas", editingTaskId), { materia, prazo, descricao, link: link || null });
        showToast("Tarefa atualizada!");
      } else {
        await addDoc(tasksRef, { materia, prazo, descricao, link: link || null, concluida: false, criadoEm: serverTimestamp() });
        showToast("Tarefa adicionada!");
      }
      closeModal(el.taskModal);
      resetTaskForm();
    } catch (error) {
      el.taskError.textContent = "Não foi possível salvar. Tente de novo.";
      el.taskError.hidden = false;
    }
  });
}

function authErrorMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Espere um pouco e tente de novo.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    default:
      return "Não foi possível entrar. Tente de novo.";
  }
}
