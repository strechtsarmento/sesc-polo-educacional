const CARROS_LOJA = [
  { id: "kombi", nome: "Kombi Seu Chiquinho", preco: 0, img: "css/kombi.png", nivelLibera: 1 },
  { id: "ka", nome: "Ford Ka 1.0", preco: 250, img: "css/ka.png", nivelLibera: 1 },
  { id: "elba", nome: "Elba S 1991", preco: 400, img: "css/elba.png", nivelLibera: 1 },
  { id: "cobalt", nome: "Cobalt LTZ 2014", preco: 600, img: "css/cobalt.png", nivelLibera: 1 },
  { id: "sandero", nome: "Sandero 2020", preco: 800, img: "css/sandero.png", nivelLibera: 1 },
  { id: "opala", nome: "Opala 71", preco: 1200, img: "css/opalass.png", nivelLibera: 2 },
  { id: "bmw", nome: "BMW E38 tunada 😛", preco: 1600, img: "css/308.png", nivelLibera: 2 },
  { id: "braia-re", nome: "Braia de Ré", preco: 1800, img: "css/evo.png", nivelLibera: 2 },
  { id: "dodge", nome: "Dodge Charger 1970", preco: 2000, img: "css/dodge.png", nivelLibera: 2 },
  { id: "skyline", nome: "Skyline GT-R R35", preco: 2500, img: "css/911.png", nivelLibera: 2 },
  { id: "300sl", nome: "Mercedes-Benz 300 SL", preco: 3200, img: "css/300sl.png", nivelLibera: 3 },
  { id: "911", nome: "Porsche 911", preco: 4000, img: "css/911.png", nivelLibera: 3 },
  { id: "mclaren", nome: "McLaren 765LT", preco: 5000, img: "css/mclaren.png", nivelLibera: 3 },
  { id: "lykan", nome: "Lykan Hypersport 2013", preco: 6500, img: "css/lykan.png", nivelLibera: 3 }
];

const STORAGE_KEY = "esem_dashboard_state";
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const defaultState = () => ({
  completedSubs: [], xp: 0, carroEquipado: "kombi", cicloAtualAtivo: [],
  carrosOwneds: ["kombi"], diasConsecutivos: 0, ultimoDiaEstudo: null,
  diasEstudados: [], nivelAtual: 1
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    const state = { ...defaultState(), ...saved };
    state.completedSubs = Array.isArray(state.completedSubs) ? state.completedSubs : [];
    state.carrosOwneds = Array.isArray(state.carrosOwneds) ? state.carrosOwneds : ["kombi"];
    state.cicloAtualAtivo = Array.isArray(state.cicloAtualAtivo) ? state.cicloAtualAtivo : [];
    state.diasEstudados = Array.isArray(state.diasEstudados) ? state.diasEstudados : [];
    // Compatibilidade com a versão anterior, que contava dias apenas ao abrir o app.
    if (!state.ultimoDiaEstudo && state.ultimoAcesso) state.ultimoDiaEstudo = null;
    return state;
  } catch (error) {
    console.warn("Não foi possível ler o progresso salvo; iniciando estado limpo.", error);
    return defaultState();
  }
}
let appState = loadState();
let allTopics = [];

async function loadTopics() {
  try {
    const response = await fetch("./database/edital.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allTopics = await response.json();
    if (!Array.isArray(allTopics)) throw new Error("O arquivo de conteúdo não contém uma lista.");
    document.getElementById("btn-gerar-ciclo")?.addEventListener("click", gerarCicloEstudos);
    document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.target)));
    document.querySelectorAll(".level-filter-btn").forEach(btn => btn.addEventListener("click", () => filterByLevel(Number(btn.dataset.studyLevel))));
    renderAll();
  } catch (error) {
    console.error("Falha ao carregar o edital:", error);
    const container = document.getElementById("topics-container");
    if (container) container.innerHTML = '<p class="empty-state">Não foi possível carregar database/edital.json. Abra o projeto por um servidor local (por exemplo, Live Server), e não diretamente como arquivo.</p>';
  }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }
function totalSubtopics() { return allTopics.reduce((sum, topic) => sum + (topic.subtopicos?.length || 0), 0); }
function completedCount() { return new Set(appState.completedSubs).size; }
function getProgress() { return totalSubtopics() ? Math.round(completedCount() / totalSubtopics() * 100) : 0; }
function circuitUnlocked(level) { const p = getProgress(); return level === 1 || (level === 2 && p >= 30) || (level === 3 && p >= 70); }
function topicsForLevel(level = appState.nivelAtual) {
  // Cada circuito recebe uma parte de cada disciplina, evitando que a ordem
  // do edital concentre todo o primeiro circuito em uma única matéria.
  const byDiscipline = new Map();
  allTopics.forEach(topic => {
    const discipline = topic.disciplina || "Sem disciplina";
    if (!byDiscipline.has(discipline)) byDiscipline.set(discipline, []);
    byDiscipline.get(discipline).push(topic);
  });

  const selected = [];
  byDiscipline.forEach(topics => {
    const start = Math.floor((level - 1) * topics.length / 3);
    const end = Math.floor(level * topics.length / 3);
    selected.push(...topics.slice(start, end));
  });
  return selected;
}
function recordStudyDay() {
  const today = todayKey();
  if (!appState.diasEstudados.includes(today)) appState.diasEstudados.push(today);
  appState.diasEstudados.sort();
  appState.ultimoDiaEstudo = today;
  let streak = 0;
  const dates = new Set(appState.diasEstudados);
  const cursor = new Date(`${today}T12:00:00`);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  appState.diasConsecutivos = streak;
}
function updateProgress() {
  const progress = getProgress();
  const bar = document.getElementById("main-progress-bar");
  if (bar) bar.style.width = `${progress}%`;
  const car = document.getElementById("racing-car");
  const equipped = CARROS_LOJA.find(carItem => carItem.id === appState.carroEquipado) || CARROS_LOJA[0];
  if (car) { car.src = equipped.img; car.style.left = `clamp(0px, calc(${progress}% - 50px), calc(100% - 100px))`; }
  const progressText = document.getElementById("progress-text");
  if (progressText) progressText.textContent = `${progress}% concluído`;
  const xp = document.getElementById("xp-points"); if (xp) xp.textContent = appState.xp;
  const streak = document.getElementById("streak-days"); if (streak) streak.textContent = appState.diasConsecutivos;
}
function renderAll() {
  unlockCircuits(); updateProgress(); renderTopics(); renderCicloCards(); renderGaragem(); renderParentDashboard(); renderStats();
}

function gerarCicloEstudos() {
  const topics = topicsForLevel(appState.nivelAtual);
  const byDiscipline = new Map();

  topics.forEach(topic => (topic.subtopicos || []).forEach((sub, index) => {
    const id = `${topic.id}-${index}`;
    if (appState.completedSubs.includes(id)) return;
    const priority = Number(topic.prioridade) || 1;
    const difficulty = Number(topic.dificuldade) || 1;
    const candidate = {
      m: topic.id,
      s: index,
      label: sub,
      discipline: topic.disciplina || "Sem disciplina",
      score: priority * 2 + difficulty + Math.random()
    };
    if (!byDiscipline.has(candidate.discipline)) byDiscipline.set(candidate.discipline, []);
    byDiscipline.get(candidate.discipline).push(candidate);
  }));

  if (!byDiscipline.size) {
    alert("🎉 Não há subtópicos pendentes neste circuito!");
    return;
  }

  // Ordena cada matéria pela prioridade/dificuldade e escolhe primeiro uma
  // matéria diferente por vaga. Só repete disciplina se houver menos de 3.
  const disciplineQueues = [...byDiscipline.entries()].map(([discipline, items]) => ({
    discipline,
    items: items.sort((a, b) => b.score - a.score)
  })).sort((a, b) => b.items[0].score - a.items[0].score);

  const selected = [];
  while (selected.length < 3) {
    let addedInRound = false;
    for (const queue of disciplineQueues) {
      if (queue.items.length && selected.length < 3) {
        selected.push(queue.items.shift());
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
  }

  appState.cicloAtualAtivo = selected.map(({ m, s }) => ({ m, s }));
  saveState();
  renderCicloCards();
}
function renderCicloCards() {
  const container = document.getElementById("cycle-cards-container"); if (!container) return;
  container.innerHTML = "";
  if (!appState.cicloAtualAtivo.length) {
    container.innerHTML = '<p class="empty-state">Clique em “Lançar novo ciclo” para receber até três subtópicos pendentes deste circuito.</p>'; return;
  }
  appState.cicloAtualAtivo.forEach(item => {
    const topic = allTopics.find(t => t.id === item.m); if (!topic || !topic.subtopicos[item.s]) return;
    const id = `${item.m}-${item.s}`; const done = appState.completedSubs.includes(id);
    const card = document.createElement("div"); card.className = "cycle-card";
    const label = document.createElement("span"); label.textContent = `${topic.disciplina || "Conteúdo"}: ${topic.subtopicos[item.s]}`;
    const button = document.createElement("button"); button.type = "button"; button.className = done ? "btn-complete done" : "btn-complete";
    button.textContent = done ? "✓ Concluído" : "Marcar como feito";
    button.setAttribute("aria-pressed", String(done)); button.addEventListener("click", () => toggleSubtopic(item.m, item.s, !done));
    card.append(label, button); container.appendChild(card);
  });
}
function toggleSubtopic(macroId, subIndex, checked) {
  const id = `${macroId}-${subIndex}`; const alreadyDone = appState.completedSubs.includes(id);
  if (checked && !alreadyDone) { appState.completedSubs.push(id); appState.xp += 50; recordStudyDay(); }
  else if (!checked && alreadyDone) { appState.completedSubs = appState.completedSubs.filter(value => value !== id); appState.xp = Math.max(0, appState.xp - 50); }
  saveState(); renderAll();
}
function renderTopics() {
  const container = document.getElementById("topics-container"); if (!container) return;
  container.innerHTML = "";
  const topics = topicsForLevel(appState.nivelAtual);
  if (!topics.length) { container.innerHTML = '<p class="empty-state">Nenhum conteúdo encontrado neste circuito.</p>'; return; }
  topics.forEach(topic => {
    const subs = topic.subtopicos || [];
    const doneCount = subs.filter((_, i) => appState.completedSubs.includes(`${topic.id}-${i}`)).length;
    const percent = subs.length ? Math.round(doneCount / subs.length * 100) : 0;
    const card = document.createElement("article"); card.className = "topic-card";
    const title = document.createElement("h3"); title.textContent = `${topic.titulo} (${topic.disciplina})`;
    const description = document.createElement("p"); description.className = "topic-description"; description.textContent = topic.descricao || "";
    const summary = document.createElement("div"); summary.className = "topic-progress-label";
    summary.innerHTML = `<span>${doneCount}/${subs.length} subtópicos</span><strong>${percent}%</strong>`;
    const track = document.createElement("div"); track.className = "topic-progress-track";
    const fill = document.createElement("div"); fill.className = "topic-progress-fill"; fill.style.width = `${percent}%`; track.appendChild(fill);
    const details = document.createElement("details"); details.className = "subtopic-details";
    const summaryEl = document.createElement("summary"); summaryEl.textContent = `Ver subtópicos (${doneCount}/${subs.length})`; details.appendChild(summaryEl);
    const list = document.createElement("div"); list.className = "subtopic-list";
    subs.forEach((sub, index) => {
      const id = `${topic.id}-${index}`; const checked = appState.completedSubs.includes(id);
      const label = document.createElement("label"); label.className = `subtopic-row${checked ? " is-done" : ""}`;
      const input = document.createElement("input"); input.type = "checkbox"; input.checked = checked;
      input.setAttribute("aria-label", `Marcar ${sub} como ${checked ? "não concluído" : "concluído"}`);
      input.addEventListener("change", () => toggleSubtopic(topic.id, index, input.checked));
      const text = document.createElement("span"); text.textContent = sub; label.append(input, text); list.appendChild(label);
    });
    details.appendChild(list); card.append(title, description, summary, track, details); container.appendChild(card);
  });
}
function renderParentDashboard() {
  const container = document.getElementById("parents-dashboard"); if (!container) return;
  const done = completedCount(); const total = totalSubtopics(); const percent = getProgress();
  const recentDays = [...appState.diasEstudados].slice(-7).reverse();
  container.innerHTML = `
    <section class="parent-summary"><h2>🗺️ Mapa de acompanhamento</h2><p>Visão geral do progresso no certame. Os dados são salvos neste dispositivo.</p>
      <div class="summary-grid"><div class="summary-tile"><strong>${percent}%</strong><span>Progresso</span></div><div class="summary-tile"><strong>${done}</strong><span>Subtópicos concluídos</span></div><div class="summary-tile"><strong>${appState.xp}</strong><span>XP disponível</span></div><div class="summary-tile"><strong>${appState.diasConsecutivos}</strong><span>Dias consecutivos</span></div></div>
    </section><section class="parent-summary"><h3>📅 Dias com estudo registrado</h3><p>${recentDays.length ? recentDays.map(date => new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")).join(" · ") : "Ainda não há dias de estudo registrados."}</p>
    <p class="muted-note">O registro de um dia acontece quando um subtópico é marcado como concluído.</p></section>
    <section class="parent-summary"><h3>📚 Progresso por disciplina</h3><div class="discipline-progress">${getDisciplineStats().map(item => `<div class="discipline-row"><div><strong>${escapeHtml(item.name)}</strong><span>${item.done}/${item.total}</span></div><div class="topic-progress-track"><div class="topic-progress-fill" style="width:${item.percent}%"></div></div></div>`).join("")}</div></section>`;
}
function getDisciplineStats() {
  const groups = new Map();
  allTopics.forEach(topic => {
    const name = topic.disciplina || "Sem disciplina"; if (!groups.has(name)) groups.set(name, { name, total: 0, done: 0 });
    const group = groups.get(name); group.total += (topic.subtopicos || []).length;
    (topic.subtopicos || []).forEach((_, index) => { if (appState.completedSubs.includes(`${topic.id}-${index}`)) group.done++; });
  });
  return [...groups.values()].map(item => ({ ...item, percent: item.total ? Math.round(item.done / item.total * 100) : 0 }));
}
function renderStats() {
  const container = document.getElementById("stats-container"); if (!container) return;
  const pending = Math.max(0, totalSubtopics() - completedCount());
  container.innerHTML = `<h2>📊 Seu desempenho</h2><div class="summary-grid"><div class="summary-tile"><strong>${completedCount()}</strong><span>Concluídos</span></div><div class="summary-tile"><strong>${pending}</strong><span>Pendentes</span></div><div class="summary-tile"><strong>${getProgress()}%</strong><span>Do edital cadastrado</span></div></div><p class="muted-note">O progresso considera os subtópicos cadastrados em database/edital.json. Confira o conteúdo com o edital oficial.</p>`;
}
function renderGaragem() {
  const container = document.getElementById("garage-store-container"); if (!container) return;
  container.innerHTML = "";
  CARROS_LOJA.forEach(car => {
    const owned = appState.carrosOwneds.includes(car.id); const unlocked = circuitUnlocked(car.nivelLibera);
    const canBuy = unlocked && appState.xp >= car.preco;
    const card = document.createElement("article"); card.className = `garage-card${owned ? " owned" : ""}`;
    const img = document.createElement("img"); img.src = car.img; img.alt = car.nome; img.onerror = () => { img.onerror = null; img.src = "css/kombi.png"; };
    const title = document.createElement("h4"); title.textContent = car.nome;
    const price = document.createElement("p"); price.className = "car-price"; price.textContent = `${car.preco} XP · Circuito ${car.nivelLibera}`;
    const button = document.createElement("button"); button.type = "button"; button.className = "garage-action";
    if (owned) { button.textContent = appState.carroEquipado === car.id ? "🏁 Equipado" : "Equipar"; button.disabled = appState.carroEquipado === car.id; button.addEventListener("click", () => equiparCarro(car.id)); }
    else { button.textContent = !unlocked ? "🔒 Circuito bloqueado" : canBuy ? "Comprar" : "XP insuficiente"; button.disabled = !canBuy; button.addEventListener("click", () => comprarCarro(car.id)); }
    card.append(img, title, price, button); container.appendChild(card);
  });
}
function equiparCarro(id) { if (!appState.carrosOwneds.includes(id)) return; appState.carroEquipado = id; saveState(); renderAll(); }
function comprarCarro(id) {
  const car = CARROS_LOJA.find(item => item.id === id); if (!car) return;
  // Revalidação no momento da compra, mesmo se a interface estiver desatualizada.
  if (appState.carrosOwneds.includes(id)) return;
  if (!circuitUnlocked(car.nivelLibera)) { alert(`Este veículo exige o Circuito ${car.nivelLibera}.`); return; }
  if (appState.xp < car.preco) { alert("XP insuficiente!"); return; }
  appState.xp -= car.preco; appState.carrosOwneds.push(id); appState.carroEquipado = id; saveState(); renderAll(); alert(`🎉 Você comprou ${car.nome}!`);
}
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => { tab.classList.toggle("active", tab.id === tabId); tab.style.display = tab.id === tabId ? "block" : "none"; });
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.target === tabId));
  if (tabId === "garage-tab") renderGaragem(); if (tabId === "parent-tab") renderParentDashboard(); if (tabId === "study-tab") renderTopics();
}
function filterByLevel(level) {
  if (!circuitUnlocked(level)) { alert(level === 2 ? "Complete 30% do conteúdo para liberar o Circuito 2." : "Complete 70% do conteúdo para liberar o Circuito 3."); return; }
  appState.nivelAtual = level; saveState();
  document.querySelectorAll(".level-filter-btn").forEach(btn => { const btnLevel = Number(btn.dataset.studyLevel); btn.classList.toggle("active", btnLevel === level); btn.disabled = !circuitUnlocked(btnLevel); if (btnLevel > 1) btn.textContent = `${circuitUnlocked(btnLevel) ? "🏁" : "🔒"} Circuito ${btnLevel}`; });
  renderTopics(); renderCicloCards();
}
function unlockCircuits() {
  document.querySelectorAll(".level-filter-btn").forEach(btn => {
    const level = Number(btn.dataset.studyLevel); const unlocked = circuitUnlocked(level);
    btn.disabled = !unlocked; btn.classList.toggle("active", level === appState.nivelAtual);
    if (level > 1) btn.textContent = `${unlocked ? "🏁" : "🔒"} Circuito ${level}`;
  });
  if (!circuitUnlocked(appState.nivelAtual)) appState.nivelAtual = 1;
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }

document.addEventListener("DOMContentLoaded", loadTopics);
