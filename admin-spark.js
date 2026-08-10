import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get, update, push, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config-spark.js";

const ADMIN_EMAIL = "rpfenille@gmail.com";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = id => document.getElementById(id);
let eventos = [];
let perfilAdmin = null;

const isAdmin = perfil => perfil?.perfil === "admin" || perfil?.email === ADMIN_EMAIL;
const fmtData = value => value ? new Date(value).toLocaleString("pt-BR") : "—";
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const notice = (text, ok=true) => { const el=$("notice"); el.textContent=text; el.style.display="block"; el.style.borderLeftColor=ok?"#ffff00":"#ff5252"; };

async function auditarAdministracao(uid, antes, depois, campos){
  await set(push(ref(db,"auditoria")),{
    acao:"edicao", lancamentoId:`usuario:${uid}`, usuarioUid:auth.currentUser.uid,
    usuarioEmail:perfilAdmin.email, usuarioNome:perfilAdmin.nome || "", dataHora:new Date().toISOString(), camposAlterados:campos,
    dadosAnteriores:antes, dadosNovos:depois, origem:"painel-admin"
  });
}

async function carregarUsuarios(){
  const snap = await get(ref(db,"usuarios"));
  const dados = snap.val() || {};
  const linhas = Object.entries(dados).sort((a,b)=>String(a[1].nome||a[1].email).localeCompare(String(b[1].nome||b[1].email),"pt-BR"));
  $("usuariosBody").innerHTML = linhas.map(([uid,u]) => {
    const principal=String(u.email||"").toLowerCase()===ADMIN_EMAIL;
    return `<tr><td>${escapeHtml(u.nome)}</td><td>${escapeHtml(u.email)}</td><td><span class="tag ${isAdmin(u)?"admin":""}">${isAdmin(u)?"Administrador":"Usuário"}</span></td><td><span class="tag ${u.ativo?"on":"off"}">${u.ativo?"Ativo":"Inativo"}</span></td><td>${fmtData(u.ultimoAcesso)}</td><td><button data-uid="${uid}" data-action="toggle" ${principal?"disabled":""}>${u.ativo?"Desativar":"Ativar"}</button> <button data-uid="${uid}" data-action="perfil" ${principal?"disabled":""}>${u.perfil==="admin"?"Tornar usuário":"Tornar admin"}</button></td></tr>`;
  }).join("");
  $("usuariosBody").querySelectorAll("button").forEach(btn => btn.addEventListener("click", async ()=>{
    const uid=btn.dataset.uid; const u=dados[uid];
    if(btn.dataset.action==="toggle") {
      const depois={...u,ativo:!u.ativo}; await update(ref(db,`usuarios/${uid}`),{ativo:depois.ativo}); await auditarAdministracao(uid,u,depois,["ativo"]);
    } else {
      const depois={...u,perfil:u.perfil==="admin"?"usuario":"admin"}; await update(ref(db,`usuarios/${uid}`),{perfil:depois.perfil}); await auditarAdministracao(uid,u,depois,["perfil"]);
    }
    notice("Alteração salva e registrada na auditoria.");
    await Promise.all([carregarUsuarios(),carregarAuditoria()]);
  }));
}

async function carregarAuditoria(){
  const snap = await get(ref(db,"auditoria"));
  eventos = Object.entries(snap.val() || {}).map(([id,e])=>({id,...e})).sort((a,b)=>String(b.dataHora).localeCompare(String(a.dataHora)));
  renderAuditoria();
}

function filtrados(){
  const email=$("filtroEmail").value.trim().toLowerCase(); const acao=$("filtroAcao").value; const ini=$("filtroInicio").value; const fim=$("filtroFim").value;
  return eventos.filter(e => (!email || String(e.usuarioEmail||"").toLowerCase().includes(email)) && (!acao || e.acao===acao) && (!ini || e.dataHora.slice(0,10)>=ini) && (!fim || e.dataHora.slice(0,10)<=fim));
}

function renderAuditoria(){
  $("auditoriaBody").innerHTML = filtrados().map(e=>`<tr><td>${fmtData(e.dataHora)}</td><td>${escapeHtml(e.usuarioNome)}</td><td>${escapeHtml(e.usuarioEmail)}</td><td>${escapeHtml(e.acao)}</td><td>${escapeHtml(e.lancamentoId)}</td><td>${escapeHtml((e.camposAlterados||[]).join(", "))}</td><td><div class="detail">${escapeHtml(JSON.stringify(e.dadosAnteriores,null,2))}</div></td><td><div class="detail">${escapeHtml(JSON.stringify(e.dadosNovos,null,2))}</div></td></tr>`).join("");
}

function exportarCSV(){
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const linhas=[["Data/hora","Nome","Gmail","Ação","Lançamento","Campos alterados","Dados anteriores","Dados novos"],...filtrados().map(e=>[e.dataHora,e.usuarioNome,e.usuarioEmail,e.acao,e.lancamentoId,(e.camposAlterados||[]).join(" | "),JSON.stringify(e.dadosAnteriores),JSON.stringify(e.dadosNovos)])];
  const blob=new Blob(["\ufeff"+linhas.map(l=>l.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`auditoria-qap-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

[$("filtroEmail"),$("filtroAcao"),$("filtroInicio"),$("filtroFim")].forEach(el=>el.addEventListener("input",renderAuditoria));
$("recarregarUsuarios").addEventListener("click",carregarUsuarios); $("recarregarAuditoria").addEventListener("click",carregarAuditoria); $("exportar").addEventListener("click",exportarCSV); $("sair").addEventListener("click",async()=>{await signOut(auth);location.replace("index.html")});

onAuthStateChanged(auth, async user => {
  if(!user) return location.replace("index.html");
  const snap=await get(ref(db,`usuarios/${user.uid}`)); perfilAdmin=snap.val();
  if(!perfilAdmin?.ativo || !isAdmin(perfilAdmin)) return location.replace("qap.html");
  if(String(user.email||"").toLowerCase()===ADMIN_EMAIL && perfilAdmin.perfil!=="admin") {
    await update(ref(db,`usuarios/${user.uid}`),{perfil:"admin",ativo:true}); perfilAdmin.perfil="admin"; perfilAdmin.ativo=true;
  }
  $("adminInfo").textContent=`Administrador conectado: ${perfilAdmin.nome || ""} • ${perfilAdmin.email}`; $("loading").remove();
  try{await Promise.all([carregarUsuarios(),carregarAuditoria()]);}catch(error){console.error(error);notice("Não foi possível carregar os dados. Publique as regras do banco incluídas no ZIP.",false);}
});
