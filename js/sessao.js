import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

// --- CONFIGURAÇÕES DE CONTEÚDO POR TEMA ---
const frasesTemas = {
  romance: [
    "Uma história escrita nas estrelas...",
    "Onde cada cena é um beijo.",
    "O amor é a melhor trilha sonora.",
  ],
  amizade: [
    "Parceria que daria um Oscar!",
    "Amigos: o elenco que a gente escolhe.",
    "Grandes aventuras começam com um 'bora'.",
  ],
  familia: [
    "Onde o coração sempre encontra o lugar.",
    "A nossa melhor produção.",
    "Raízes que sustentam qualquer roteiro.",
  ],
  aniversario: [
    "Hoje o destaque é todo seu!",
    "Mais um ano de sucesso garantido.",
    "Celebrando a sua melhor versão.",
  ],
};

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    alert("Link inválido!");
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, "sessoes", id));

    if (docSnap.exists()) {
      const dados = docSnap.data();
      configurarInterface(dados);
    } else {
      alert("Sessão não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao carregar:", error);
  }
}

function configurarInterface(dados) {
  // 1. Aplica o Tema e Textos
  document.body.setAttribute("data-tema", dados.tema || "romance");
  document.getElementById("ticket-estrela").innerText = dados.estrela;
  document.getElementById("msgEstrela").innerText = dados.estrela;
  document.getElementById("msgDiretor").innerText = dados.diretor;
  document.getElementById("msgFinal").innerText = dados.mensagem;

  // 2. Frase Aleatória do Corredor
  const frases = frasesTemas[dados.tema] || frasesTemas.romance;
  const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
  document.getElementById("frase-corredor").innerText = `"${fraseAleatoria}"`;

  // 3. Carrega o Vídeo
  const videoPlayer = document.getElementById("moviePlayer");
  videoPlayer.src = dados.video;
  videoPlayer.load();

  // 4. Galeria de Pôsteres
  const gallery = document.getElementById("lobbyGallery");
  if (dados.fotos && dados.fotos.length > 0) {
    dados.fotos.forEach((url, index) => {
      const poster = document.createElement("div");
      poster.className = "poster-frame";
      poster.innerHTML = `<img src="${url}" alt="Poster ${index + 1}">`;
      gallery.appendChild(poster);
    });
  }

  // 5. Esconde o Loader
  document.getElementById("loader").style.display = "none";

  // 6. Configura o botão final de Play
  document.getElementById("playButton").onclick = () => {
    document.getElementById("curtainLeft").classList.add("open-left");
    document.getElementById("curtainRight").classList.add("open-right");
    document.getElementById("playButton").style.display = "none";
    videoPlayer.play();
  };

  videoPlayer.onended = () => {
    document.getElementById("credits").style.display = "block";
    document.getElementById("credits").classList.add("active");
  };
}

// --- SOLUÇÃO PARA O ERRO: Torna a função global ---
window.proximaFase = function (idFase) {
  console.log("Mudando para a fase:", idFase);
  // Remove 'active' de todas as fases
  document
    .querySelectorAll(".fase")
    .forEach((f) => f.classList.remove("active"));
  // Adiciona 'active' na fase desejada
  const proxima = document.getElementById(idFase);
  if (proxima) {
    proxima.classList.add("active");
  }
};

// Inicializa tudo
carregarSessao();
