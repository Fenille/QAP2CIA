import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { firebaseConfig, configIsReady } from "./firebase-config-spark.js";

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
let criandoConta = false;

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
  if (code.includes("email-already-in-use")) return "Este RE já possui cadastro. Use Entrar.";
  if (code.includes("permission-denied")) return "O banco recusou o cadastro. Verifique as regras do Realtime Database.";
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
    await update(ref(db, `usuarios/${credential.user.uid}`), { ultimoAcesso: Date.now() }).catch(console.warn);
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
  if (!/^\d{5,8}$/.test(re)) return showMessage("Informe um RE válido.", "error");
  setBusy(form, true);
  criandoConta = true;
  let novoUsuario = null;
  try {
    const credential = await createUserWithEmailAndPassword(auth, authEmailForRE(re), senha);
    novoUsuario = credential.user;
    const agora = Date.now();
    await update(ref(db), {
      [`usuarios/${novoUsuario.uid}`]: {
        re,
        emailRecuperacao,
        perfil: re === "140965" ? "admin" : "usuario",
        ativo: true,
        criadoEm: agora,
        ultimoAcesso: null
      }
    });
    await signOut(auth);
    showPanel("loginForm");
    $("loginRE").value = re;
    showMessage("Cadastro realizado. Agora entre com seu RE e senha.");
  } catch (error) {
    if (novoUsuario) await deleteUser(novoUsuario).catch(() => {});
    showMessage(friendlyError(error), "error");
  } finally {
    criandoConta = false;
    setBusy(form, false);
  }
});

$("resetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("A recuperação por e-mail ficará disponível na versão final com servidor seguro.", "error");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  if (criandoConta) return;
  try {
    const profileSnap = await get(ref(db, `usuarios/${user.uid}`));
    if (profileSnap.val()?.ativo) window.location.replace("qap.html");
  } catch (_) {}
});
