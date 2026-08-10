// Substitua pelos dados do seu projeto Firebase em:
// Console Firebase > Configurações do projeto > Seus apps > Aplicativo Web.
export const firebaseConfig = {
  apiKey: "AIzaSyCugXvCGwW3_zWprC4B_kBqUXMe7gvVtoo",
  authDomain: "qap2cia-bd58b.firebaseapp.com",
  databaseURL: "https://qap2cia-bd58b-default-rtdb.firebaseio.com",
  projectId: "qap2cia-bd58b",
  storageBucket: "qap2cia-bd58b.firebasestorage.app",
  messagingSenderId: "24881796175",
  appId: "1:24881796175:web:8745076f658301782f063a",
  measurementId: "G-7LF6DX0070"
};

export function configIsReady() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.messagingSenderId && firebaseConfig.appId);
}
