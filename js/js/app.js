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
  { id: "skyline", nome: "Nissan Skyline GT-R R34", preco: 2500, img: "css/gtr.png", nivelLibera: 2 },
  { id: "300sl", nome: "Mercedes-Benz 300 SL", preco: 3200, img: "css/300sl.png", nivelLibera: 3 },
  { id: "911", nome: "Porsche 911", preco: 4000, img: "css/911.png", nivelLibera: 3 },
  { id: "mclaren", nome: "McLaren 765LT", preco: 5000, img: "css/mclaren.png", nivelLibera: 3 },
  { id: "lykan", nome: "Lykan Hypersport 2013", preco: 6500, img: "css/lykan.png", nivelLibera: 3 }
];

const STORAGE_KEY = "esem_dashboard_state";
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const defaultState = () => ({
  completedSubs: [], completionDates: {}, reviewedRevisions: [], xp: 0, carroEquipado: "kombi", cicloAtualAtivo: [],
  carrosOwneds: ["kombi"], diasConsecutivos: 0, ultimoDiaEstudo: null,
  diasEstudados: [], nivelAtual: 1
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    const state = { ...defaultState(), ...saved };
    state.completedSubs = Array.isArray(state.completedSubs) ? state.completedSubs : [];
    state.completionDates = state.completionDates && typeof state.completionDates === "object" ? state.completionDates : {};
    state.reviewedRevisions = Array.isArray(state.reviewedRevisions) ? state.reviewedRevisions : [];
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
    setupAppMenu();
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
  // Os circuitos representam etapas de estudo, mas nenhum deles pode esconder
  // disciplinas inteiras. Todos os tópicos ficam disponíveis; o ciclo equilibra as matérias.
  return allTopics;
}
function dateKeyOffset(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function getReviewItems() {
  const today = todayKey();
  const intervals = [0, 7, 15];
  const items = [];
  allTopics.forEach(topic => (topic.subtopicos || []).forEach((sub, index) => {
    const id = `${topic.id}-${index}`;
    const studiedAt = appState.completionDates[id];
    if (!studiedAt) return;
    intervals.forEach(day => {
      const reviewId = `${id}@${day}`;
      const dueDate = dateKeyOffset(studiedAt, day);
      if (dueDate <= today && !appState.reviewedRevisions.includes(reviewId)) {
        items.push({ reviewId, m: topic.id, s: index, discipline: topic.disciplina || "Conteúdo", label: sub, day, dueDate });
      }
    });
  }));
  return items.sort((a,b) => a.day - b.day || a.dueDate.localeCompare(b.dueDate));
}
function renderReviews() {
  const container = document.getElementById("reviews-container");
  if (!container) return;
  const items = getReviewItems();
  container.innerHTML = `<section class="parent-summary"><h2>🔁 Revisões espaçadas</h2><p>Revisões programadas para o dia 0, 7 e 15 após concluir cada subtópico.</p></section>`;
  if (!items.length) {
    container.insertAdjacentHTML("beforeend", '<p class="empty-state">Nenhuma revisão pendente hoje. Conclua um subtópico para iniciar sua sequência de revisões.</p>');
    return;
  }
  const list = document.createElement("div"); list.className = "review-list";
  items.forEach(item => {
    const card = document.createElement("article"); card.className = "cycle-card";
    const label = document.createElement("span"); label.textContent = `${item.discipline}: ${item.label} — revisão ${item.day === 0 ? "do dia 0 (mesmo dia)" : `do dia ${item.day}`}`;
    const button = document.createElement("button"); button.type = "button"; button.className = "btn-complete"; button.textContent = "Concluir pelo ciclo";
    button.addEventListener("click", () => { alert("As revisões só podem ser concluídas pelo ciclo de estudos. Gere um ciclo para incluir as revisões vencidas."); });
    card.append(label, button); list.appendChild(card);
  });
  container.appendChild(list);
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
  if (car) { car.src = equipped.img; car.style.left = `clamp(0px, calc(${progress}% - 66px), calc(100% - 132px))`; }
  const progressText = document.getElementById("progress-text");
  if (progressText) progressText.textContent = `${progress}% concluído`;
  const xp = document.getElementById("xp-points"); if (xp) xp.textContent = appState.xp;
  const streak = document.getElementById("streak-days"); if (streak) streak.textContent = appState.diasConsecutivos;
}
function renderAll() {
  unlockCircuits(); updateProgress(); renderTopics(); renderCicloCards(); renderGaragem(); renderParentDashboard(); renderStats(); renderReviews();
}

function gerarCicloEstudos() {
  const byDiscipline = new Map();
  allTopics.forEach(topic => (topic.subtopicos || []).forEach((sub, index) => {
    const id = `${topic.id}-${index}`;
    if (appState.completedSubs.includes(id)) return;
    const discipline = topic.disciplina || "Sem disciplina";
    const candidate = { type: "study", m: topic.id, s: index, label: sub, discipline,
      score: (Number(topic.prioridade)||1)*2 + (Number(topic.dificuldade)||1) + (Number(topic.peso)||0)/100 + Math.random() };
    if (!byDiscipline.has(discipline)) byDiscipline.set(discipline, []);
    byDiscipline.get(discipline).push(candidate);
  }));

  const queues = [...byDiscipline.entries()].map(([discipline, items]) => ({ discipline, items: items.sort((a,b)=>b.score-a.score) }))
    .sort((a,b) => b.items[0].score-a.items[0].score);
  const selectedStudies = [];
  // Seleciona até três conteúdos novos, priorizando disciplinas diferentes.
  while (selectedStudies.length < 3 && queues.some(q => q.items.length)) {
    for (const queue of queues) {
      if (queue.items.length && selectedStudies.length < 3) selectedStudies.push(queue.items.shift());
    }
  }

  // Revisões vencidas entram no próprio ciclo, intercaladas com os novos conteúdos.
  // A aba Revisões continua exibindo todas as revisões pendentes, inclusive as que
  // não couberem neste ciclo.
  const dueReviews = getReviewItems().slice(0, 3).map(item => ({
    type: "review", m: item.m, s: item.s, reviewId: item.reviewId,
    reviewDay: item.day, discipline: item.discipline, label: item.label
  }));
  if (!selectedStudies.length && !dueReviews.length) {
    alert("🎉 Não há conteúdos pendentes nem revisões vencidas neste momento!");
    return;
  }
  const mixed = [];
  const max = Math.max(selectedStudies.length, dueReviews.length);
  for (let i = 0; i < max; i++) {
    if (dueReviews[i]) mixed.push(dueReviews[i]);
    if (selectedStudies[i]) mixed.push(selectedStudies[i]);
  }
  appState.cicloAtualAtivo = mixed.map(item => item.type === "review"
    ? ({ type: "review", m: item.m, s: item.s, reviewId: item.reviewId, reviewDay: item.reviewDay })
    : ({ type: "study", m: item.m, s: item.s }));
  saveState(); renderCicloCards();
}

function renderCicloCards() {
  const container = document.getElementById("cycle-cards-container"); if (!container) return;
  container.innerHTML = "";
  if (!appState.cicloAtualAtivo.length) {
    container.innerHTML = '<p class="empty-state">Clique em “Lançar novo ciclo” para combinar conteúdos novos com revisões vencidas.</p>'; return;
  }
  appState.cicloAtualAtivo.forEach(item => {
    const topic = allTopics.find(t => t.id === item.m); if (!topic || !topic.subtopicos?.[item.s]) return;
    const card = document.createElement("div"); card.className = "cycle-card";
    const label = document.createElement("span");
    if (item.type === "review") {
      const reviewDay = Number(item.reviewDay);
      label.textContent = `🔁 Revisão ${reviewDay === 0 ? "do dia 0" : `do dia ${reviewDay}`} — ${nomeDisciplina(topic.disciplina)}: ${topic.subtopicos[item.s]}`;
      const button = document.createElement("button"); button.type = "button"; button.className = "btn-complete"; button.textContent = "Marcar revisão feita";
      button.addEventListener("click", () => {
        if (!appState.reviewedRevisions.includes(item.reviewId)) appState.reviewedRevisions.push(item.reviewId);
        appState.cicloAtualAtivo = appState.cicloAtualAtivo.filter(entry => entry.reviewId !== item.reviewId);
        saveState(); renderAll();
      });
      card.append(label, button);
    } else {
      const id = `${item.m}-${item.s}`; const done = appState.completedSubs.includes(id);
      label.textContent = `${nomeDisciplina(topic.disciplina)}: ${topic.subtopicos[item.s]}`;
      const button = document.createElement("button"); button.type = "button"; button.className = done ? "btn-complete done" : "btn-complete";
      button.textContent = done ? "✓ Concluído" : "Marcar como feito";
      button.setAttribute("aria-pressed", String(done)); button.addEventListener("click", () => toggleSubtopic(item.m, item.s, !done));
      card.append(label, button);
    }
    container.appendChild(card);
  });
}

function toggleSubtopic(macroId, subIndex, checked) {
  const id = `${macroId}-${subIndex}`; const alreadyDone = appState.completedSubs.includes(id);
  if (checked && !alreadyDone) {
    appState.completedSubs.push(id);
    appState.completionDates[id] = todayKey();
    appState.reviewedRevisions = appState.reviewedRevisions.filter(r => !r.startsWith(`${id}@`));
    appState.xp += 50; recordStudyDay();
    // Ao concluir no ciclo, o cartão desaparece imediatamente da sequência ativa.
    appState.cicloAtualAtivo = appState.cicloAtualAtivo.filter(item => !(item.type === "study" && item.m === macroId && Number(item.s) === Number(subIndex)));
  } else if (!checked && alreadyDone) {
    // Desmarcação só é permitida na lista geral e sempre exige confirmação.
    const topic = allTopics.find(t => t.id === macroId);
    const label = topic?.subtopicos?.[subIndex] || "este conteúdo";
    if (!confirm(`Deseja realmente desfazer a conclusão de \"${label}\"?\n\nA data de estudo, as revisões associadas e 50 XP serão removidos.`)) { renderAll(); return; }
    appState.completedSubs = appState.completedSubs.filter(value => value !== id);
    delete appState.completionDates[id];
    appState.reviewedRevisions = appState.reviewedRevisions.filter(r => !r.startsWith(`${id}@`));
    appState.xp = Math.max(0, appState.xp - 50);
  }
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
    const title = document.createElement("h3"); title.textContent = `${topic.titulo} (${nomeDisciplina(topic.disciplina)})`;
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
      input.addEventListener("change", () => {
        if (!checked) {
          // Não permite marcar conteúdo diretamente na lista geral: a conclusão é feita no ciclo.
          alert("Para registrar o estudo, gere um ciclo e marque o conteúdo por lá.");
          input.checked = false;
          return;
        }
        // Conteúdo já concluído pode ser desmarcado somente após confirmação.
        toggleSubtopic(topic.id, index, false);
      });
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
    if (owned) {
      button.textContent = appState.carroEquipado === car.id ? "🏁 Equipado" : "Equipar";
      button.disabled = appState.carroEquipado === car.id;
      button.addEventListener("click", () => equiparCarro(car.id));
      card.append(img, title, price, button);
      if (car.id !== "kombi") {
        const returnButton = document.createElement("button");
        returnButton.type = "button";
        returnButton.className = "garage-action return-vehicle-action";
        returnButton.textContent = `↩ Devolver veículo (+${car.preco} XP)`;
        returnButton.addEventListener("click", () => devolverCarro(car.id));
        card.appendChild(returnButton);
      }
    } else {
      button.textContent = !unlocked ? "🔒 Circuito bloqueado" : canBuy ? "Comprar" : "XP insuficiente";
      button.disabled = !canBuy;
      button.addEventListener("click", () => comprarCarro(car.id));
      card.append(img, title, price, button);
    }
    container.appendChild(card);
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
function devolverCarro(id) {
  const car = CARROS_LOJA.find(item => item.id === id);
  if (!car || id === "kombi" || !appState.carrosOwneds.includes(id)) return;
  const confirmar = confirm(`Devolver ${car.nome}?

O veículo será removido da sua garagem e você receberá ${car.preco} XP de volta.`);
  if (!confirmar) return;
  appState.carrosOwneds = appState.carrosOwneds.filter(ownedId => ownedId !== id);
  if (appState.carroEquipado === id) appState.carroEquipado = "kombi";
  appState.xp += car.preco;
  saveState();
  renderAll();
  alert(`Veículo devolvido. ${car.preco} XP foram estornados.`);
}

function setupAppMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("app-menu");
  const fileInput = document.getElementById("load-progress-file");
  const resetDialog = document.getElementById("reset-dialog");
  const helpDialog = document.getElementById("help-dialog");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".menu-wrap")) {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("save-progress-btn")?.addEventListener("click", exportProgress);
  document.getElementById("load-progress-btn")?.addEventListener("click", () => { menu.hidden = true; fileInput?.click(); });
  document.getElementById("reset-progress-btn")?.addEventListener("click", () => { menu.hidden = true; if (resetDialog?.showModal) resetDialog.showModal(); });
  document.getElementById("help-btn")?.addEventListener("click", () => { menu.hidden = true; if (helpDialog?.showModal) helpDialog.showModal(); });
  document.getElementById("cancel-reset")?.addEventListener("click", () => resetDialog?.close());
  document.getElementById("confirm-reset")?.addEventListener("click", resetProgress);
  document.getElementById("close-help")?.addEventListener("click", () => helpDialog?.close());
  document.getElementById("close-help-bottom")?.addEventListener("click", () => helpDialog?.close());
  fileInput?.addEventListener("change", importProgress);
}

function exportProgress() {
  try {
    saveState();
    const backup = { app: "ESEM Pocket", version: 1, exportedAt: new Date().toISOString(), state: appState };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `esem-pocket-progresso-${todayKey()}.json`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    document.getElementById("app-menu").hidden = true;
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
    alert("Progresso exportado. Guarde o arquivo JSON para usar como backup.");
  } catch (error) { alert("Não foi possível salvar o progresso. Verifique as permissões do navegador."); console.error(error); }
}

function importProgress(event) {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const candidate = parsed?.state || parsed;
      if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.completedSubs) || !Array.isArray(candidate.carrosOwneds)) {
        throw new Error("Formato de backup inválido.");
      }
      if (!confirm("Carregar este progresso substituirá o progresso atual neste dispositivo. Deseja continuar?")) return;
      appState = { ...defaultState(), ...candidate };
      appState.completedSubs = Array.isArray(appState.completedSubs) ? appState.completedSubs : [];
      appState.completionDates = appState.completionDates && typeof appState.completionDates === "object" ? appState.completionDates : {};
      appState.reviewedRevisions = Array.isArray(appState.reviewedRevisions) ? appState.reviewedRevisions : [];
      appState.carrosOwneds = Array.isArray(appState.carrosOwneds) ? appState.carrosOwneds : ["kombi"];
      appState.cicloAtualAtivo = Array.isArray(appState.cicloAtualAtivo) ? appState.cicloAtualAtivo : [];
      appState.diasEstudados = Array.isArray(appState.diasEstudados) ? appState.diasEstudados : [];
      saveState(); renderAll();
      alert("Progresso carregado com sucesso!");
    } catch (error) { alert("Não foi possível carregar este arquivo. Selecione um backup JSON válido do ESEM Pocket."); console.error(error); }
    finally { input.value = ""; }
  };
  reader.onerror = () => { alert("Não foi possível ler o arquivo selecionado."); input.value = ""; };
  reader.readAsText(file);
}

function resetProgress() {
  appState = defaultState();
  saveState();
  document.getElementById("reset-dialog")?.close();
  renderAll();
  alert("Progresso reiniciado. O dashboard voltou ao estado inicial.");
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => { tab.classList.toggle("active", tab.id === tabId); tab.style.display = tab.id === tabId ? "block" : "none"; });
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.target === tabId));
  if (tabId === "garage-tab") renderGaragem(); if (tabId === "parent-tab") renderParentDashboard(); if (tabId === "study-tab") renderTopics(); if (tabId === "review-tab") renderReviews();
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
function nomeDisciplina(code) { return ({ POR: "Português", MAT: "Matemática", HIS: "História", GEO: "Geografia", CIEN: "Ciências" })[code] || code || "Conteúdo"; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }

document.addEventListener("DOMContentLoaded", loadTopics);
