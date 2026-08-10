// Substitua pelos dados do seu projeto Firebase em:
// Console Firebase > Configurações do projeto > Seus apps > Aplicativo Web.
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "qap2cia-bd58b.firebaseapp.com",
  databaseURL: "https://qap2cia-bd58b-default-rtdb.firebaseio.com",
  projectId: "qap2cia-bd58b",
  storageBucket: "qap2cia-bd58b.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

export function configIsReady() {
  return [firebaseConfig.apiKey, firebaseConfig.messagingSenderId, firebaseConfig.appId]
    .every(value => value && !String(value).includes("COLE_AQUI"));
}
