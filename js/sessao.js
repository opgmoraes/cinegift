import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

async function carregarSessao() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // Verifica se o ID existe na URL
  if (!id) {
    alert("Link de sessão inválido! Verifique o ID.");
    return;
  }

  try {
    // Busca o documento específico no Firestore
    const docSnap = await getDoc(doc(db, "sessoes", id));

    if (docSnap.exists()) {
      const dados = docSnap.data();

      // 1. Aplica o tema (romance, amizade, etc.) para mudar as cores via CSS
      document.body.setAttribute("data-tema", dados.tema || "romance");

      // 2. Preenche os textos com os dados do Firebase
      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;

      // 3. Configura o player de vídeo
      const videoPlayer = document.getElementById("moviePlayer");
      videoPlayer.src = dados.video;

      // CRUCIAL: Força o carregamento do vídeo para evitar o erro de 'no supported sources'
      videoPlayer.load();

      // 4. Remove o loader de pipoca da tela
      const loader = document.getElementById("loader");
      if (loader) {
        loader.classList.add("hidden");
        setTimeout(() => {
          loader.style.display = "none";
        }, 500);
      }

      // 5. Lógica do botão de Play e abertura das cortinas
      document.getElementById("playButton").onclick = () => {
        // IDs exatos do seu HTML para animar as cortinas
        document.getElementById("curtainLeft").classList.add("open-left");
        document.getElementById("curtainRight").classList.add("open-right");

        // Sumir com o botão de play com efeito suave
        document.getElementById("playButton").style.opacity = "0";
        setTimeout(() => {
          document.getElementById("playButton").style.display = "none";
        }, 500);

        // Dá o play no vídeo do R2
        videoPlayer.play().catch((error) => {
          console.error("Erro ao dar play no vídeo:", error);
        });
      };

      // 6. Ativa os créditos quando o vídeo chega ao fim
      videoPlayer.onended = () => {
        const credits = document.getElementById("credits");
        if (credits) {
          credits.style.display = "block";
          credits.classList.add("active");
        }
      };
    } else {
      // Caso o ID seja válido mas não exista no banco de dados
      alert("Desculpe, esta sessão não foi encontrada ou expirou.");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Erro crítico na sessão:", error);
    alert("Erro técnico ao carregar a projeção. Verifique sua conexão.");
  }
}

// Executa a função assim que a página carrega
carregarSessao();
