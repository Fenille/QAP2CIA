import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";
import { firebaseConfig, configIsReady } from "./firebase-config.js";

if (!configIsReady()) {
  document.getElementById("message").textContent = "Firebase ainda não configurado. Preencha firebase-config.js antes do teste.";
  document.getElementById("message").className = "message error";
  document.getElementById("message").hidden = false;
  document.querySelectorAll("form button").forEach(button => button.disabled = true);
  throw new Error("Configuração do Firebase incompleta.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app, "us-central1");

const primeiroAcesso = httpsCallable(functions, "primeiroAcesso");
const solicitarRedefinicao = httpsCallable(functions, "solicitarRedefinicao");
const registrarAcesso = httpsCallable(functions, "registrarAcesso");

const $ = (id) => document.getElementById(id);
const normalizeRE = (value) => String(value || "").replace(/\D/g, "");
const authEmailForRE = (re) => `re${re}@qap.local`;

function showPanel(id) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  hideMessage();
}
function showMessage(text, type = "success") {
  const el = $("message");
  el.textContent = text;
  el.className = `message ${type}`;
  el.hidden = false;
}
function hideMessage() { $("message").hidden = true; }
function setBusy(form, busy) {
  form.querySelectorAll("button").forEach((b) => b.disabled = busy);
}
function friendlyError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential")) return "RE ou senha incorretos.";
  if (code.includes("too-many-requests")) return "Muitas tentativas. Tente novamente mais tarde.";
  if (code.includes("already-exists")) return "Este RE já possui cadastro. Use Entrar ou Esqueci minha senha.";
  if (code.includes("not-found")) return "Serviço de login ainda não publicado no Firebase.";
  return error?.message?.replace(/^Firebase:\s*/i, "") || "Não foi possível concluir a operação.";
}

document.querySelectorAll("[data-show]").forEach((btn) => btn.addEventListener("click", () => showPanel(btn.dataset.show)));

document.querySelectorAll('input[inputmode="numeric"]').forEach((input) => {
  input.addEventListener("input", () => input.value = normalizeRE(input.value));
});

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const re = normalizeRE($("loginRE").value);
  const password = $("loginPassword").value;
  setBusy(form, true);
  try {
    const credential = await signInWithEmailAndPassword(auth, authEmailForRE(re), password);
    const profileSnap = await get(ref(db, `usuarios/${credential.user.uid}`));
    const profile = profileSnap.val();
    if (!profile?.ativo) {
      await signOut(auth);
      throw new Error("Usuário desativado. Procure o administrador.");
    }
    await registrarAcesso();
    // Altere para a página inicial real do QAP.
    window.location.href = "qap.html";
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally { setBusy(form, false); }
});

$("firstAccessForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const re = normalizeRE($("firstRE").value);
  const emailRecuperacao = $("firstEmail").value.trim();
  const senha = $("firstPassword").value;
  const confirmacao = $("firstPasswordConfirm").value;
  if (senha !== confirmacao) return showMessage("As senhas não conferem.", "error");
  setBusy(form, true);
  try {
    await primeiroAcesso({ re, emailRecuperacao, senha });
    showPanel("loginForm");
    $("loginRE").value = re;
    showMessage("Cadastro realizado. Agora entre com seu RE e senha.");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally { setBusy(form, false); }
});

$("resetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  setBusy(form, true);
  try {
    const result = await solicitarRedefinicao({ re: normalizeRE($("resetRE").value) });
    showMessage(result.data.mensagem);
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally { setBusy(form, false); }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const profileSnap = await get(ref(db, `usuarios/${user.uid}`));
    if (profileSnap.val()?.ativo) window.location.replace("qap.html");
  } catch (_) {}
});
