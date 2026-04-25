import {
  collection,
  query,
  where,
  getDocs,
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

let dadosSessaoGlobal = null;
let audioTrilha = document.getElementById("audioTrilha");
let audioEfeito = document.getElementById("audioEfeito");
let playerYT = null;

function fadeAudio(audioElement, targetVolume, duration, callback) {
  const startVolume = audioElement.volume || 0;
  const diff = targetVolume - startVolume;
  const steps = 20;
  const interval = duration / steps;
  let currentStep = 0;
  const timer = setInterval(() => {
    currentStep++;
    let newVol = startVolume + diff * (currentStep / steps);
    audioElement.volume = Math.max(0, Math.min(1, newVol));
    if (currentStep >= steps) {
      clearInterval(timer);
      if (callback) callback();
    }
  }, interval);
}

window.tocarEfeito = function (nome) {
  audioEfeito.src = `assets/audio/efeitos/${nome}.mp3`;
  audioEfeito.volume = 0.8;
  audioEfeito.play().catch((e) => console.log("Áudio efeito bloqueado"));
};

function obterVideoIdYouTube(url) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function prepararYouTube(youtubeUrl) {
  const videoId = obterVideoIdYouTube(youtubeUrl);
  if (!videoId) return;

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = function () {
    playerYT = new YT.Player("youtubePlayer", {
      height: "1",
      width: "1",
      videoId: videoId,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playsinline: 1 },
      events: {
        onReady: (event) => {
          event.target.setVolume(0);
        },
      },
    });
  };
}

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("ref");
  const id = params.get("id");

  let docSnap = null;

  try {
    if (slug) {
      const q = query(collection(db, "sessoes"), where("slug", "==", slug));
      const snap = await getDocs(q);
      if (!snap.empty) docSnap = snap.docs[0];
    } else if (id) {
      docSnap = await getDoc(doc(db, "sessoes", id));
    }

    if (docSnap && docSnap.exists()) {
      dadosSessaoGlobal = docSnap.data();

      // 1. BARREIRA DE PAGAMENTO
      if (dadosSessaoGlobal.status === "pendente") {
        document.body.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; padding: 20px;">
            <h1 style="font-family:'Playfair Display'; color:#fff; margin-bottom: 10px;">A aguardar luzes, câmara e ação! 🎬</h1>
            <p style="color: rgba(255,255,255,0.6);">O pagamento desta sessão ainda está a ser processado.</p>
          </div>`;
        return;
      }

      // 2. BARREIRA DE EXPIRAÇÃO
      if (
        dadosSessaoGlobal.dataExpiracao &&
        new Date() > dadosSessaoGlobal.dataExpiracao.toDate()
      ) {
        document.body.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center;">
            <h1 style="font-family:'Playfair Display'; color:#fff;">Sessão fora de Cartaz 🍿</h1>
            <p style="color: rgba(255,255,255,0.6);">O período de exibição desta homenagem já terminou.</p>
          </div>`;
        return;
      }

      document.body.setAttribute(
        "data-tema",
        dadosSessaoGlobal.tema || "romance",
      );
      document.getElementById("ticket-estrela").innerText =
        dadosSessaoGlobal.estrela;
      document.getElementById("ticket-diretor-nome").innerText =
        dadosSessaoGlobal.diretor;
      document.getElementById("msgEstrela").innerText =
        dadosSessaoGlobal.estrela;
      document.getElementById("msgDiretor").innerText =
        dadosSessaoGlobal.diretor;
      document.getElementById("msgFinal").innerText =
        dadosSessaoGlobal.mensagem;

      const arrayFrases =
        frasesTemas[dadosSessaoGlobal.tema] || frasesTemas.romance;
      document.getElementById("frase-corredor").innerText =
        `"${arrayFrases[Math.floor(Math.random() * arrayFrases.length)]}"`;

      const gallery = document.getElementById("lobbyGallery");
      if (gallery) {
        gallery.innerHTML = "";
        if (dadosSessaoGlobal.fotos && dadosSessaoGlobal.fotos.length > 0) {
          dadosSessaoGlobal.fotos.forEach((fotoData) => {
            const url = typeof fotoData === "string" ? fotoData : fotoData.url;
            const caption =
              typeof fotoData === "string" ? "" : fotoData.titulo || "";
            const div = document.createElement("div");
            div.className = "poster-frame";
            const legendHTML = caption
              ? `<div class="poster-caption">${caption}</div>`
              : "";
            div.innerHTML = `<img src="${url}" alt="Cartaz">${legendHTML}`;
            gallery.appendChild(div);
          });
        }
      }

      if (
        dadosSessaoGlobal.musica === "custom" &&
        dadosSessaoGlobal.youtubeLink
      ) {
        prepararYouTube(dadosSessaoGlobal.youtubeLink);
      }

      const videoPlayer = document.getElementById("moviePlayer");
      if (videoPlayer) {
        videoPlayer.src = dadosSessaoGlobal.video;
        videoPlayer.load();
      }

      gerarPoltronas();
      document.getElementById("loader").classList.add("hidden");
    } else {
      document.body.innerHTML = `<h1 style="color:white; text-align:center; margin-top:50px;">Sessão não encontrada.</h1>`;
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

function gerarPoltronas() {
  const grid = document.getElementById("grid-sessao");
  if (!grid) return;
  for (let i = 0; i < 18; i++) {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.onclick = () => {
      tocarEfeito("seat");
      if (navigator.vibrate) navigator.vibrate(50);
      document
        .querySelectorAll(".seat")
        .forEach((s) => s.classList.remove("selected"));
      seat.classList.add("selected");
    };
    grid.appendChild(seat);
  }
}

window.proximaFase = function (idFase) {
  const faseAtual = document.querySelector(".fase.active");
  if (!faseAtual) return;

  if (idFase === "fase-poltrona") {
    tocarEfeito("beep");
    document.getElementById("previewIngresso").classList.add("tearing");
    setTimeout(() => iniciarSpotlight(faseAtual, idFase), 800);
  } else {
    iniciarSpotlight(faseAtual, idFase);
  }
};

function iniciarSpotlight(faseAtual, idFase) {
  faseAtual.classList.add("spotlight-close");
  setTimeout(() => {
    document.querySelectorAll(".fase").forEach((f) => {
      f.classList.remove("active");
      f.classList.add("spotlight-close");
    });
    const proxFase = document.getElementById(idFase);
    if (proxFase) {
      proxFase.classList.add("active");
      setTimeout(() => {
        proxFase.classList.remove("spotlight-close");
      }, 50);
    }

    if (idFase === "fase-poltrona") {
      if (
        dadosSessaoGlobal.musica === "custom" &&
        playerYT &&
        typeof playerYT.playVideo === "function"
      ) {
        playerYT.playVideo();
        let vol = 0;
        let tYT = setInterval(() => {
          vol += 5;
          playerYT.setVolume(vol);
          if (vol >= 30) clearInterval(tYT);
        }, 200);
      } else {
        const trackStr = dadosSessaoGlobal.musica || "1";
        audioTrilha.src = `assets/audio/musicas/${dadosSessaoGlobal.tema}/${trackStr}.mp3`;
        audioTrilha.volume = 0;
        audioTrilha
          .play()
          .then(() => fadeAudio(audioTrilha, 0.3, 3000))
          .catch((e) => console.log(e));
      }
    }
  }, 800);
}

const playMasterBtn = document.getElementById("playMasterBtn");
if (playMasterBtn) {
  playMasterBtn.onclick = () => {
    tocarEfeito("curtain");
    playMasterBtn.style.opacity = "0";
    setTimeout(() => {
      playMasterBtn.style.display = "none";
    }, 600);

    document.getElementById("curtainLeft").classList.add("open-left");
    document.getElementById("curtainRight").classList.add("open-right");

    if (dadosSessaoGlobal.videoTemSom) {
      if (dadosSessaoGlobal.musica === "custom" && playerYT)
        playerYT.pauseVideo();
      else fadeAudio(audioTrilha, 0, 1500, () => audioTrilha.pause());
    }

    const videoPlayer = document.getElementById("moviePlayer");
    setTimeout(() => {
      videoPlayer.play();
    }, 1500);

    videoPlayer.onended = () => {
      if (dadosSessaoGlobal.videoTemSom) {
        if (dadosSessaoGlobal.musica === "custom" && playerYT)
          playerYT.playVideo();
        else {
          audioTrilha.play();
          fadeAudio(audioTrilha, 0.3, 2000);
        }
      }
      document.getElementById("credits").classList.add("active");

      setTimeout(() => {
        if (dadosSessaoGlobal.musica === "custom" && playerYT) {
          let v = 30;
          let tm = setInterval(() => {
            v -= 2;
            playerYT.setVolume(v);
            if (v <= 0) {
              playerYT.stopVideo();
              clearInterval(tm);
            }
          }, 500);
        } else {
          fadeAudio(audioTrilha, 0, 8000, () => audioTrilha.pause());
        }
      }, 10000);
    };
  };
}

carregarSessao();
