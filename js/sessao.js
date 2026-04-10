import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

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

      // Preenche os dados
      document.getElementById("msgEstrela").innerText = dados.estrela;
      document.getElementById("msgDiretor").innerText = dados.diretor;
      document.getElementById("msgFinal").innerText = dados.mensagem;
      document.getElementById("moviePlayer").src = dados.video;

      // Esconde o loader
      document.getElementById("loader").style.display = "none";

      // Lógica do botão play
      document.getElementById("playButton").onclick = () => {
        document.querySelector(".curtain.left").classList.add("open-left");
        document.querySelector(".curtain.right").classList.add("open-right");
        document.getElementById("playButton").style.display = "none";
        document.getElementById("moviePlayer").play();
      };

      // Quando o vídeo acabar, sobem os créditos
      document.getElementById("moviePlayer").onended = () => {
        document.getElementById("credits").style.display = "block";
      };
    } else {
      alert("Essa sessão não existe mais.");
    }
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar o presente.");
  }
}

carregarSessao();
