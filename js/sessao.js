import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

// Frases por tema (Iguais ao do Criador)
const frasesTemas = {
  romance: [
    "Você transformou meu mundo em uma cena que quero rever pra sempre.",
    "Em cada olhar seu há um filme que só eu tenho o privilégio de assistir.",
    "Você é minha cena favorita em qualquer história.",
  ],
  amizade: [
    "Você é daquelas pessoas que tornam tudo mais leve e mais divertido.",
    "A nossa amizade é o tipo de coisa que não precisa de roteiro.",
    "Com você, qualquer cena vira a melhor parte do filme.",
  ],
  familia: [
    "Lar é onde você está. Simples assim.",
    "Nenhum roteiro seria bom sem você nele.",
    "Tudo que sou hoje tem a sua assinatura.",
  ],
  aniversario: [
    "Que esse dia seja tão especial quanto você merece.",
    "Mais um ano, mais memórias incríveis com você.",
    "Hoje é o seu dia. E você merece cada segundo.",
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

      // 1. Configura Tema e Textos
      document.body.setAttribute("data-tema", dados.tema || "romance");

      const elEstrela = document.getElementById("ticket-estrela");
      const elDiretor = document.getElementById("ticket-diretor-nome");
      if (elEstrela) elEstrela.innerText = dados.estrela;
      if (elDiretor) elDiretor.innerText = dados.diretor;

      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 2. Frase Dinâmica do Corredor
      const arrayFrases = frasesTemas[dados.tema] || frasesTemas.romance;
      const fraseSorteada =
        arrayFrases[Math.floor(Math.random() * arrayFrases.length)];
      const elFrase = document.getElementById("frase-corredor");
      if (elFrase) elFrase.innerText = `"${fraseSorteada}"`;

      // 3. Prepara Pôsteres (Fotos)
      const gallery = document.getElementById("lobbyGallery");
      if (gallery) {
        gallery.innerHTML = ""; // Limpa antes de injetar
        if (Array.isArray(dados.fotos) && dados.fotos.length > 0) {
          dados.fotos.forEach((url) => {
            const div = document.createElement("div");
            div.className = "poster-frame";
            div.innerHTML = `<img src="${url}" alt="Foto Especial">`;
            gallery.appendChild(div);
          });
        } else {
          gallery.innerHTML = `<p style="opacity:0.5; width:100%; text-align:center;">Nenhuma lembrança adicionada aos cartazes.</p>`;
        }
      }

      // 4. Prepara o Vídeo
      const videoPlayer = document.getElementById("moviePlayer");
      if (videoPlayer) {
        videoPlayer.src = dados.video;
        videoPlayer.load();
      }

      gerarPoltronas();

      // Libera a tela tirando o Loader
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

// Troca de Telas (Exposto Globalmente)
window.proximaFase = function (idFase) {
  document
    .querySelectorAll(".fase")
    .forEach((f) => f.classList.remove("active"));
  const proxima = document.getElementById(idFase);
  if (proxima) proxima.classList.add("active");
};

// Cortinas e Play
const btnPlayFilme = document.getElementById("btnPlayFilme");
if (btnPlayFilme) {
  btnPlayFilme.onclick = () => {
    // Abre as cortinas
    document.getElementById("curtainLeft").classList.add("open-left");
    document.getElementById("curtainRight").classList.add("open-right");

    // Esconde o Overlay do Botão suavemente
    const overlay = document.getElementById("playOverlay");
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);

    // Dá Play no vídeo
    const videoPlayer = document.getElementById("moviePlayer");
    videoPlayer.play();

    // Sobe Créditos Finais ao acabar
    videoPlayer.onended = () => {
      const credits = document.getElementById("credits");
      if (credits) credits.classList.add("active");
    };
  };
}

carregarSessao();
