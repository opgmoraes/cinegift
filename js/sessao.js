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
    "O amor é a melhor banda sonora.",
  ],
  amizade: [
    "Parceria que daria um Óscar!",
    "Amigos: o elenco que a gente escolhe.",
    "Grandes aventuras começam com um 'bora'.",
  ],
  familia: [
    "Onde o coração sempre encontra o lugar.",
    "A nossa melhor produção.",
    "Raízes que sustentam qualquer guião.",
  ],
  aniversario: [
    "Hoje o destaque é todo seu!",
    "Mais um ano de sucesso garantido.",
    "Celebrando a sua melhor versão.",
  ],
};

let playerYoutube; // Para a música de fundo

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    alert("Link inválido! Precisamos de um ID para projetar a sessão.");
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, "sessoes", id));

    if (docSnap.exists()) {
      const dados = docSnap.data();
      configurarInterface(dados);
    } else {
      alert("Sessão não encontrada.");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Erro ao carregar:", error);
  }
}

function configurarInterface(dados) {
  // 1. Aplica o Tema e Textos Básicos
  document.body.setAttribute("data-tema", dados.tema || "romance");
  document.getElementById("msgEstrela").innerText = dados.estrela;
  document.getElementById("msgDiretor").innerText = dados.diretor;
  document.getElementById("msgFinal").innerText = dados.mensagem;

  const videoPlayer = document.getElementById("moviePlayer");
  videoPlayer.src = dados.video;
  videoPlayer.load();

  // 2. Prepara o Corredor de Pôsteres (Galeria)
  const gallery = document.getElementById("lobbyGallery");
  if (dados.fotos && dados.fotos.length > 0) {
    dados.fotos.forEach((url, index) => {
      const poster = document.createElement("div");
      poster.className = "poster-frame";
      poster.innerHTML = `<img src="${url}" alt="Poster ${index + 1}">`;
      gallery.appendChild(poster);
    });
  }

  // 3. Esconde o Loader principal
  document.getElementById("loader").classList.add("hidden");

  // --- LÓGICA DE NAVEGAÇÃO DA JORNADA ---

  // Passo A: Escanear Ticket (Simulação)
  // Aqui você pode adicionar um evento de clique no seu elemento de ticket no HTML
  console.log("Aguardando interação com o ticket...");

  // Passo B: Iniciar a Sessão (O clique final no botão de Play)
  document.getElementById("playButton").onclick = () => {
    iniciarFilme(videoPlayer);
  };
}

function iniciarFilme(videoPlayer) {
  // Abre as cortinas
  document.getElementById("curtainLeft").classList.add("open-left");
  document.getElementById("curtainRight").classList.add("open-right");

  // Esconde o botão e a galeria do lobby para focar no vídeo
  document.getElementById("playButton").style.display = "none";
  const lobby = document.getElementById("lobbyGallery");
  if (lobby) lobby.style.opacity = "0";

  // Dá o play no filme principal
  videoPlayer.play().catch((e) => console.log("Erro ao dar play:", e));

  // Quando o vídeo acabar, sobem os créditos
  videoPlayer.onended = () => {
    const credits = document.getElementById("credits");
    credits.style.display = "block";
    credits.classList.add("active");
  };
}

// Inicializa tudo
carregarSessao();
