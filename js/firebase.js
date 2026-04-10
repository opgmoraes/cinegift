// Importa as funções principais do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// SUAS CONFIGURAÇÕES DO FIREBASE VÃO AQUI
// (Você pega isso no painel do Firebase > Configurações do Projeto)
const firebaseConfig = {
  apiKey: "AIzaSyCcdwjng9HUWyfk-ZDl8KsVf5vIllVGXyA"
  authDomain: "cinegift-saas.firebaseapp.com",
  projectId: "cinegift-saas",
  storageBucket: "cinegift-saas.firebasestorage.app",
  messagingSenderId: "419157101960",
  appId: "1:419157101960:web:9d84e619da534e3d43be3d",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o banco de dados Firestore
export const db = getFirestore(app);

console.log("Firebase inicializado com sucesso! 🎬");
