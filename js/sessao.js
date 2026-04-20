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

      // 1. Aplica o Tema e atualiza textos do Ingresso e Créditos
      document.body.setAttribute("data-tema", dados.tema);

      const elTicketEstrela = document.getElementById("ticket-estrela");
      const elTicketDiretor = document.getElementById("ticket-diretor-nome");

      if (elTicketEstrela) elTicketEstrela.innerText = dados.estrela;
      if (elTicketDiretor) elTicketDiretor.innerText = dados.diretor;

      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 2. Prepara o Vídeo
      const videoPlayer = document.getElementById("moviePlayer");
      videoPlayer.src = dados.video;
      videoPlayer.load();

      // 3. Prepara Pôsteres
      const gallery = document.getElementById("lobbyGallery");
      if (dados.fotos && dados.fotos.length > 0) {
        dados.fotos.forEach((url) => {
          const div = document.createElement("div");
          div.className = "poster-frame";
          div.innerHTML = `<img src="${url}" alt="Lobby Photo">`;
          gallery.appendChild(div);
        });
      }

      gerarPoltronas();

      // Esconde o loader quando tudo estiver pronto
      const loader = document.getElementById("loader");
      loader.classList.add("hidden");
    }
  } catch (e) {
    console.error("Erro ao carregar sessão:", e);
  }
}

function gerarPoltronas() {
  const grid = document.getElementById("grid-sessao");
  if (!grid) return;
  for (let i = 0; i < 18; i++) {
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

// Expõe globalmente para que o onclick="" no HTML funcione corretamente
window.proximaFase = function (idFase) {
  document
    .querySelectorAll(".fase")
    .forEach((f) => f.classList.remove("active"));

  const proxima = document.getElementById(idFase);
  if (proxima) proxima.classList.add("active");
};

// Lógica de abertura de cortinas e play do vídeo
document.getElementById("playButton").onclick = () => {
  document.getElementById("curtainLeft").classList.add("open-left");
  document.getElementById("curtainRight").classList.add("open-right");
  document.getElementById("playButton").style.display = "none";

  const videoPlayer = document.getElementById("moviePlayer");
  videoPlayer.play();

  // Quando o vídeo acabar, sobe os créditos
  videoPlayer.onended = () => {
    const credits = document.getElementById("credits");
    if (credits) {
      credits.classList.add("active");
    }
  };
};

carregarSessao();
