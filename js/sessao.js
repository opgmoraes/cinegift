import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

const frasesTemas = {
  romance: [
    "Você transformou meu mundo em uma cena que quero rever pra sempre.",
    "Em cada olhar seu há um filme que só eu tenho o privilégio de assistir.",
  ],
  amizade: [
    "A nossa amizade é o tipo de coisa que não precisa de roteiro.",
    "Com você, qualquer cena vira a melhor parte do filme.",
  ],
  familia: [
    "Lar é onde você está. Simples assim.",
    "Nenhum roteiro seria bom sem você nele.",
  ],
  aniversario: [
    "Que esse dia seja tão especial quanto você merece.",
    "Mais um ano, mais memórias incríveis com você.",
  ],
};

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    const docSnap = await getDoc(doc(db, "sessoes", id));
    if (docSnap.exists()) {
      const dados = docSnap.data();

      // 1. Configura Tema
      document.body.setAttribute("data-tema", dados.tema || "romance");

      // 2. Textos do Ingresso
      const elEstrela = document.getElementById("ticket-estrela");
      const elDiretor = document.getElementById("ticket-diretor-nome");
      if (elEstrela) elEstrela.innerText = dados.estrela;
      if (elDiretor) elDiretor.innerText = dados.diretor;

      // 3. Textos dos Créditos Finais
      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 4. Frase Dinâmica do Corredor
      const arrayFrases = frasesTemas[dados.tema] || frasesTemas.romance;
      const elFrase = document.getElementById("frase-corredor");
      if (elFrase)
        elFrase.innerText = `"${arrayFrases[Math.floor(Math.random() * arrayFrases.length)]}"`;

      // 5. Renderiza Pôsteres
      const gallery = document.getElementById("lobbyGallery");
      if (gallery) {
        gallery.innerHTML = "";
        if (dados.fotos && dados.fotos.length > 0) {
          dados.fotos.forEach((url) => {
            const div = document.createElement("div");
            div.className = "poster-frame";
            div.innerHTML = `<img src="${url}" alt="Foto Especial">`;
            gallery.appendChild(div);
          });
        } else {
          gallery.innerHTML = `<p style="opacity:0.5; font-family: monospace;">Nenhuma lembrança em cartaz.</p>`;
        }
      }

      // 6. Configura o Player
      const videoPlayer = document.getElementById("moviePlayer");
      if (videoPlayer) {
        videoPlayer.src = dados.video;
        videoPlayer.load();
      }

      gerarPoltronas();

      // Libera o Loader
      const loader = document.getElementById("loader");
      if (loader) loader.classList.add("hidden");
    } else {
      alert("Sessão não encontrada.");
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

// Navegação de Fases no HTML
window.proximaFase = function (idFase) {
  document
    .querySelectorAll(".fase")
    .forEach((f) => f.classList.remove("active"));
  document.getElementById(idFase)?.classList.add("active");
};

// Evento do botão de Play Master e Cortinas
const playMasterBtn = document.getElementById("playMasterBtn");
if (playMasterBtn) {
  playMasterBtn.onclick = () => {
    // Esconde o botão suavemente
    playMasterBtn.style.opacity = "0";
    setTimeout(() => {
      playMasterBtn.style.display = "none";
    }, 600);

    // Abre as cortinas
    document.getElementById("curtainLeft").classList.add("open-left");
    document.getElementById("curtainRight").classList.add("open-right");

    const videoPlayer = document.getElementById("moviePlayer");

    // Dá play no vídeo após a cortina começar a abrir
    setTimeout(() => {
      videoPlayer.play();
    }, 1500);

    // Mostra os créditos quando acabar
    videoPlayer.onended = () => {
      const credits = document.getElementById("credits");
      if (credits) credits.classList.add("active");
    };
  };
}

// Iniciar Motor
carregarSessao();
