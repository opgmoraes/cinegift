import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    alert("Link de sessão inválido!");
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, "sessoes", id));

    if (docSnap.exists()) {
      const dados = docSnap.data();

      // 1. Aplica o tema dinâmico ao corpo da página
      document.body.setAttribute("data-tema", dados.tema || "romance");

      // 2. Preenche os textos da sessão
      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 3. Configura a fonte do vídeo
      const videoPlayer = document.getElementById("moviePlayer");
      videoPlayer.src = dados.video;

      // 4. Esconde o loader após o carregamento dos dados
      const loader = document.getElementById("loader");
      if (loader) {
        loader.classList.add("hidden");
        // Remove do DOM após a transição de fade-out do CSS
        setTimeout(() => {
          loader.style.display = "none";
        }, 500);
      }

      // 5. Lógica de abertura das cortinas e início do filme
      document.getElementById("playButton").onclick = () => {
        // Usa os IDs específicos do teu HTML
        document.getElementById("curtainLeft").classList.add("open-left");
        document.getElementById("curtainRight").classList.add("open-right");

        // Esconde o botão de play
        document.getElementById("playButton").style.opacity = "0";
        setTimeout(() => {
          document.getElementById("playButton").style.display = "none";
        }, 500);

        // Inicia o vídeo
        videoPlayer.play();
      };

      // 6. Exibe os créditos quando o vídeo terminar
      videoPlayer.onended = () => {
        const credits = document.getElementById("credits");
        credits.style.display = "block";
        credits.classList.add("active");
      };
    } else {
      alert("Sessão não encontrada no nosso arquivo.");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Erro ao carregar sessão:", error);
    alert("Erro técnico ao projetar a sessão.");
  }
}

// Inicializa a função ao carregar a página
carregarSessao();
