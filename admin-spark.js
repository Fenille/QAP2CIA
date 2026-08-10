import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get, update, push, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config-spark.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = id => document.getElementById(id);
let eventos = [];
let perfilAdmin = null;

const isAdmin = perfil => perfil?.perfil === "admin" || perfil?.re === "140965";
const fmtData = value => value ? new Date(value).toLocaleString("pt-BR") : "—";
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const notice = (text, ok=true) => { const el=$("notice"); el.textContent=text; el.style.display="block"; el.style.borderLeftColor=ok?"#ffff00":"#ff5252"; };

async function auditarAdministracao(uid, antes, depois, campos){
  await set(push(ref(db,"auditoria")),{
    acao:"edicao", lancamentoId:`usuario:${uid}`, usuarioUid:auth.currentUser.uid,
    usuarioRE:perfilAdmin.re, dataHora:new Date().toISOString(), camposAlterados:campos,
    dadosAnteriores:antes, dadosNovos:depois, origem:"painel-admin"
  });
}

async function carregarUsuarios(){
  const snap = await get(ref(db,"usuarios"));
  const dados = snap.val() || {};
  const linhas = Object.entries(dados).sort((a,b)=>String(a[1].re).localeCompare(String(b[1].re)));
  $("usuariosBody").innerHTML = linhas.map(([uid,u]) => `<tr><td>${escapeHtml(u.re)}</td><td>${escapeHtml(u.emailRecuperacao)}</td><td><span class="tag ${isAdmin(u)?"admin":""}">${isAdmin(u)?"Administrador":"Usuário"}</span></td><td><span class="tag ${u.ativo?"on":"off"}">${u.ativo?"Ativo":"Inativo"}</span></td><td>${fmtData(u.ultimoAcesso)}</td><td><button data-uid="${uid}" data-action="toggle" ${u.re==="140965"?"disabled":""}>${u.ativo?"Desativar":"Ativar"}</button> <button data-uid="${uid}" data-action="perfil" ${u.re==="140965"?"disabled":""}>${u.perfil==="admin"?"Tornar usuário":"Tornar admin"}</button></td></tr>`).join("");
  $("usuariosBody").querySelectorAll("button").forEach(btn => btn.addEventListener("click", async ()=>{
    const uid=btn.dataset.uid; const u=dados[uid];
    if(btn.dataset.action==="toggle") {
      const depois={...u,ativo:!u.ativo}; await update(ref(db,`usuarios/${uid}`),{ativo:depois.ativo}); await auditarAdministracao(uid,u,depois,["ativo"]);
    } else {
      const depois={...u,perfil:u.perfil==="admin"?"usuario":"admin"}; await update(ref(db,`usuarios/${uid}`),{perfil:depois.perfil}); await auditarAdministracao(uid,u,depois,["perfil"]);
    }
    await carregarUsuarios();
  }));
}

async function carregarAuditoria(){
  const snap = await get(ref(db,"auditoria"));
  eventos = Object.entries(snap.val() || {}).map(([id,e])=>({id,...e})).sort((a,b)=>String(b.dataHora).localeCompare(String(a.dataHora)));
  renderAuditoria();
}

function filtrados(){
  const re=$("filtroRE").value.replace(/\D/g,""); const acao=$("filtroAcao").value; const ini=$("filtroInicio").value; const fim=$("filtroFim").value;
  return eventos.filter(e => (!re || e.usuarioRE===re) && (!acao || e.acao===acao) && (!ini || e.dataHora.slice(0,10)>=ini) && (!fim || e.dataHora.slice(0,10)<=fim));
}

function renderAuditoria(){
  $("auditoriaBody").innerHTML = filtrados().map(e=>`<tr><td>${fmtData(e.dataHora)}</td><td>${escapeHtml(e.usuarioRE)}</td><td>${escapeHtml(e.acao)}</td><td>${escapeHtml(e.lancamentoId)}</td><td>${escapeHtml((e.camposAlterados||[]).join(", "))}</td><td><div class="detail">${escapeHtml(JSON.stringify(e.dadosAnteriores,null,2))}</div></td><td><div class="detail">${escapeHtml(JSON.stringify(e.dadosNovos,null,2))}</div></td></tr>`).join("");
}

function exportarCSV(){
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const linhas=[["Data/hora","RE","Ação","Lançamento","Campos alterados","Dados anteriores","Dados novos"],...filtrados().map(e=>[e.dataHora,e.usuarioRE,e.acao,e.lancamentoId,(e.camposAlterados||[]).join(" | "),JSON.stringify(e.dadosAnteriores),JSON.stringify(e.dadosNovos)])];
  const blob=new Blob(["\ufeff"+linhas.map(l=>l.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`auditoria-qap-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

[$("filtroRE"),$("filtroAcao"),$("filtroInicio"),$("filtroFim")].forEach(el=>el.addEventListener("input",renderAuditoria));
$("recarregarUsuarios").addEventListener("click",carregarUsuarios); $("recarregarAuditoria").addEventListener("click",carregarAuditoria); $("exportar").addEventListener("click",exportarCSV); $("sair").addEventListener("click",async()=>{await signOut(auth);location.replace("index.html")});

onAuthStateChanged(auth, async user => {
  if(!user) return location.replace("index.html");
  const snap=await get(ref(db,`usuarios/${user.uid}`)); perfilAdmin=snap.val();
  if(!perfilAdmin?.ativo || !isAdmin(perfilAdmin)) return location.replace("qap.html");
  if(perfilAdmin.re==="140965" && perfilAdmin.perfil!=="admin") {
    await update(ref(db,`usuarios/${user.uid}`),{perfil:"admin"}); perfilAdmin.perfil="admin";
  }
  $("adminInfo").textContent=`Administrador conectado: RE ${perfilAdmin.re}`; $("loading").remove();
  try{await Promise.all([carregarUsuarios(),carregarAuditoria()]);}catch(error){console.error(error);notice("Não foi possível carregar os dados. Publique as regras do banco incluídas no ZIP.",false);}
});
