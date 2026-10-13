import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, getDocs
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW-p1WqD7cD1m5tkKZbHO4eNNQUo_MX_g",
  authDomain: "sesc-polo-educacional.firebaseapp.com",
  projectId: "sesc-polo-educacional",
  storageBucket: "sesc-polo-educacional.firebasestorage.app",
  messagingSenderId: "571082965456",
  appId: "1:571082965456:web:66b48272e030f8b765b9d5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const gate = document.getElementById("auth-gate");
const dashboard = document.getElementById("dashboard-app");
const form = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const submitButton = document.getElementById("auth-submit");
const modeToggle = document.getElementById("auth-mode-toggle");
const statusNode = document.getElementById("auth-status");
const logoutButton = document.getElementById("auth-logout");
const signedInBox = document.getElementById("signed-in-box");
const signedInEmail = document.getElementById("signed-in-email");
let createMode = false;
let currentUser = null;
let saveTimer = null;
let lastHandledUid = null;
let hadAuthenticatedUser = false;

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", isError);
}
function showDashboard(user) {
  gate.hidden = true;
  dashboard.hidden = false;
  signedInBox.hidden = false;
  signedInEmail.textContent = user.email || "Conta autenticada";
  // O acesso à conta continua disponível no painel de autenticação? O botão de sair
  // fica na área de status do login, acessível ao reabrir a tela via menu abaixo.
  addAccountControl(user);
}
function addAccountControl(user) {
  let account = document.getElementById("firebase-account-control");
  if (!account) {
    account = document.createElement("div");
    account.id = "firebase-account-control";
    account.className = "firebase-account-control";
    const headerRight = document.querySelector(".header-right");
    headerRight?.prepend(account);
  }
  account.replaceChildren();
  const sync = document.createElement("span");
  sync.id = "firebase-sync-status";
  sync.textContent = "Nuvem conectada";
  sync.title = "Status da sincronização do progresso";
  const email = document.createElement("span");
  email.textContent = user.email || "Conta conectada";
  email.title = email.textContent;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "account-logout-btn";
  button.textContent = "Sair";
  button.addEventListener("click", async () => {
    if (!confirm("Deseja sair da sua conta? Confirme que o progresso está sincronizado ou exporte um backup antes de sair.")) return;
    try { await flushProgress(); await signOut(auth); }
    catch (error) { console.error(error); setStatus("Não foi possível sair. Verifique sua conexão e tente novamente.", true); }
  });
  account.append(sync, email, button);
}
function showLogin(message = "Entre ou crie uma conta para continuar.") {
  dashboard.hidden = true;
  gate.hidden = false;
  signedInBox.hidden = true;
  setStatus(message);
}
function friendlyError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "Este e-mail já possui uma conta. Entre em vez de criar outra.",
    "auth/invalid-email": "Digite um endereço de e-mail válido.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
    "permission-denied": "O Firestore bloqueou o acesso. Confira se as regras de segurança foram publicadas corretamente."
  };
  return messages[code] || error?.message || "Não foi possível concluir a operação. Tente novamente.";
}

async function flushProgress() {
  if (!currentUser || !window.firebaseGetLocalProgress) return;
  clearTimeout(saveTimer);
  const ref = doc(db, "users", currentUser.uid);
  await setDoc(ref, { state: window.firebaseGetLocalProgress(), updatedAt: serverTimestamp() }, { merge: true });
}

function publicProfileData(state) {
  const uid = currentUser?.uid || "";
  return {
    displayName: String(state?.apelido || `Piloto ${uid.slice(-4).toUpperCase()}`).replace(/[<>]/g, "").slice(0,24),
    xp: Math.max(0, Number(state?.xp) || 0),
    questoesAcertadas: Math.max(0, Number(state?.questoesAcertadas) || 0),
    carroEquipado: String(state?.carroEquipado || "kombi").slice(0,40),
    updatedAt: serverTimestamp()
  };
}
async function publishProfile(state) {
  if (!currentUser) return;
  await setDoc(doc(db, "publicProfiles", currentUser.uid), publicProfileData(state), { merge: true });
}
async function getLeaderboard() {
  if (!currentUser) throw new Error("Autenticação necessária");
  const snapshot = await getDocs(collection(db, "publicProfiles"));
  return snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
}

window.firebaseBridge = {
  saveProgress(state) {
    if (!currentUser) return;
    publishProfile(state).catch(error => console.warn("Perfil do ranking ainda não sincronizado:", error));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { state, updatedAt: serverTimestamp() }, { merge: true });
        setStatus("Progresso sincronizado com o Firebase.");
        const syncNode = document.getElementById("firebase-sync-status"); if (syncNode) syncNode.textContent = "Sincronizado";
      } catch (error) {
        console.error("Falha ao sincronizar progresso:", error);
        setStatus(`Progresso salvo neste navegador, mas a sincronização falhou: ${friendlyError(error)}`, true);
        const syncNode = document.getElementById("firebase-sync-status"); if (syncNode) syncNode.textContent = "Erro de sincronização";
      }
    }, 700);
  },
  async flush() { await flushProgress(); await publishProfile(window.firebaseGetLocalProgress?.()); },
  publishProfile,
  getLeaderboard,
  get currentUid() { return currentUser?.uid || null; }
};

modeToggle.addEventListener("click", () => {
  createMode = !createMode;
  submitButton.textContent = createMode ? "Criar minha conta" : "Entrar";
  passwordInput.autocomplete = createMode ? "new-password" : "current-password";
  modeToggle.textContent = createMode ? "Já tem uma conta? Entrar" : "Não tem uma conta? Criar cadastro";
  setStatus(createMode ? "O cadastro é aberto. Use um e-mail seu e uma senha com pelo menos 6 caracteres." : "Entre com seu e-mail e senha.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  submitButton.disabled = true;
  modeToggle.disabled = true;
  setStatus(createMode ? "Criando sua conta…" : "Entrando…");
  try {
    if (createMode) await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    setStatus(friendlyError(error), true);
  } finally {
    submitButton.disabled = false;
    modeToggle.disabled = false;
  }
});
logoutButton?.addEventListener("click", async () => { try { await flushProgress(); await signOut(auth); } catch (error) { setStatus(friendlyError(error), true); } });

async function handleAuthenticatedUser(user) {
  if (!user) return;
  currentUser = user;
  setStatus("Carregando seu progresso…");
  const retryButton = document.getElementById("firebase-retry-button");
  if (retryButton) retryButton.hidden = true;
  try {
    const ref = doc(db, "users", user.uid);
    const snapshot = await getDoc(ref);
    if (snapshot.exists() && snapshot.data()?.state) {
      window.firebaseApplyProgress?.(snapshot.data().state);
      setStatus("Progresso carregado da nuvem.");
    } else {
      const hasLocal = window.firebaseHasMeaningfulLocalProgress?.();
      let initialState = window.firebaseGetLocalProgress?.();
      if (hasLocal && !confirm("Encontramos progresso salvo neste navegador. Deseja copiá-lo para esta conta Firebase? Se escolher Cancelar, a conta começará do zero; você poderá importar um backup depois.")) {
        window.firebaseResetLocalProgress?.();
        initialState = window.firebaseGetLocalProgress?.();
      }
      await setDoc(ref, { state: initialState, updatedAt: serverTimestamp() });
      window.firebaseApplyProgress?.(initialState);
      setStatus("Conta pronta. O progresso será sincronizado automaticamente.");
    }
    hadAuthenticatedUser = true;
    await publishProfile(window.firebaseGetLocalProgress?.());
    showDashboard(user);
  } catch (error) {
    console.error("Falha ao carregar o progresso:", error);
    showLogin(`Não foi possível carregar seu progresso: ${friendlyError(error)}. Depois de corrigir as regras do Firestore, clique em Tentar novamente.`);
    let retry = document.getElementById("firebase-retry-button");
    if (!retry) {
      retry = document.createElement("button");
      retry.id = "firebase-retry-button";
      retry.type = "button";
      retry.className = "btn auth-primary";
      retry.textContent = "Tentar novamente";
      retry.addEventListener("click", () => { if (auth.currentUser) handleAuthenticatedUser(auth.currentUser); });
      form.insertAdjacentElement("afterend", retry);
    }
    retry.hidden = false;
  }
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    lastHandledUid = null;
    clearTimeout(saveTimer);
    document.getElementById("firebase-account-control")?.remove();
    if (hadAuthenticatedUser) {
      window.firebaseResetLocalProgress?.();
      hadAuthenticatedUser = false;
    }
    showLogin("Entre ou crie uma conta para continuar.");
    return;
  }
  if (lastHandledUid === user.uid) return;
  lastHandledUid = user.uid;
  await handleAuthenticatedUser(user);
});
