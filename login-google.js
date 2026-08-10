import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config-spark.js";

const ADMIN_EMAIL="rpfenille@gmail.com";
const app=initializeApp(firebaseConfig); const auth=getAuth(app); const db=getDatabase(app); const provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:"select_account"});
const message=document.getElementById("message"); const button=document.getElementById("entrarGoogle"); let processando=false;
function show(text,error=false){message.textContent=text;message.className=`message ${error?"error":"success"}`;message.hidden=false;}

async function prepararPerfil(user){
  const email=String(user.email||"").toLowerCase(); const perfilRef=ref(db,`usuarios/${user.uid}`); const snap=await get(perfilRef); let perfil=snap.val();
  if(!perfil){
    perfil={email,nome:user.displayName||email,perfil:email===ADMIN_EMAIL?"admin":"usuario",ativo:true,provedor:"google",criadoEm:Date.now(),ultimoAcesso:Date.now()};
    await set(perfilRef,perfil);
  }else{
    await update(perfilRef,{email,nome:user.displayName||perfil.nome||email,ultimoAcesso:Date.now(),provedor:"google"});
    perfil={...perfil,email,nome:user.displayName||perfil.nome||email};
  }
  if(email===ADMIN_EMAIL && perfil.perfil!=="admin"){await update(perfilRef,{perfil:"admin",ativo:true});perfil.perfil="admin";perfil.ativo=true;}
  if(!perfil.ativo){await signOut(auth);throw new Error("Esta conta está desativada. Procure o administrador.");}
  return perfil;
}

button.addEventListener("click",async()=>{
  button.disabled=true;processando=true;
  try{const cred=await signInWithPopup(auth,provider);await prepararPerfil(cred.user);location.replace("qap.html");}
  catch(error){console.error(error);show(error?.message?.replace(/^Firebase:\s*/i,"")||"Não foi possível entrar com o Google.",true);}
  finally{button.disabled=false;processando=false;}
});

onAuthStateChanged(auth,async user=>{
  if(!user||processando)return;
  try{await prepararPerfil(user);location.replace("qap.html");}catch(error){show(error.message,true);}
});
