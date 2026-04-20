import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    const docSnap = await getDoc(doc(db, "sessoes", id));
    if (docSnap.exists()) {
      const dados = docSnap.data();

      // 1. Aplica o Tema e Preenche Nomes no Ticket e Créditos
      document.body.setAttribute("data-tema", dados.tema);
      document.getElementById("ticket-estrela").innerText = dados.estrela;
      document.getElementById("ticket-diretor-nome").innerText = dados.diretor;

      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 2. Galeria de Pôsteres (Aparece na Fase 3)
      const gallery = document.getElementById("lobbyGallery");
      if (dados.fotos && dados.fotos.length > 0) {
        dados.fotos.forEach((url) => {
          const div = document.createElement("div");
          div.className = "poster-frame";
          div.innerHTML = `<img src="${url}">`;
          gallery.appendChild(div);
        });
      }

      // 3. Prepara o Vídeo
      const videoPlayer = document.getElementById("moviePlayer");
      videoPlayer.src = dados.video;
      videoPlayer.load();

      gerarPoltronas();
      document.getElementById("loader").style.display = "none";
    }
  } catch (e) {
    console.error("Erro ao carregar:", e);
  }
}

function gerarPoltronas() {
  const grid = document.getElementById("grid-sessao");
  for (let i = 0; i < 24; i++) {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.onclick = () => {
      document
        .querySelectorAll(".seat")
        .forEach((s) => s.classList.remove("selected"));
      seat.classList.add("selected");
    };
    grid.appendChild(seat);
  }
}

// Global para os botões do HTML
window.proximaFase = function (idFase) {
  document
    .querySelectorAll(".fase")
    .forEach((f) => f.classList.remove("active"));
  document.getElementById(idFase).classList.add("active");
};

// Controle do Player de Cinema
document.getElementById("playButton").onclick = () => {
  document.getElementById("curtainLeft").classList.add("open-left");
  document.getElementById("curtainRight").classList.add("open-right");
  document.getElementById("playButton").style.display = "none";
  document.getElementById("moviePlayer").play();
};

carregarSessao();
