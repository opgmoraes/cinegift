import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

let arquivoVideo = null;

document.getElementById("videoPrincipal")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const errorEl = document.getElementById("video-error");
  if (!file) return;

  const videoObj = document.createElement("video");
  videoObj.preload = "metadata";
  videoObj.onloadedmetadata = function () {
    URL.revokeObjectURL(videoObj.src);
    if (videoObj.duration > 31) {
      errorEl.innerText = "Vídeo muito longo! Máximo 30s.";
      errorEl.style.color = "#ff4444";
      e.target.value = "";
      arquivoVideo = null;
    } else {
      errorEl.innerText = "Vídeo aprovado! ✅";
      errorEl.style.color = "#00C851";
      arquivoVideo = file;
    }
  };
  videoObj.src = URL.createObjectURL(file);
});

async function uploadToR2(file, prefixo) {
  const safeName = file.name
    ? file.name.replace(/[^a-zA-Z0-9.]/g, "")
    : "arquivo.bin";
  const nomeUnico = `${prefixo}-${Date.now()}-${safeName}`;
  const workerUrl = `https://cinegift-upload.usecinegift.workers.dev/${nomeUnico}`;

  const response = await fetch(workerUrl, {
    method: "PUT",
    headers: {
      "X-Cinegift-Auth": "cinegift-token-123",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) throw new Error(`Erro no upload (${response.status})`);

  const r2PublicUrl = `https://pub-dec3c851da9b4e5ba79db54b6ac4b17c.r2.dev`;
  return `${r2PublicUrl}/${nomeUnico}`;
}

window.finalizarSessao = async function () {
  const btn = document.querySelector(".btn-success");
  const originalText = btn.innerText;

  const nomeDiretor = document.getElementById("nomeDiretor")?.value.trim();
  const nomeEstrela = document.getElementById("nomeEstrela")?.value.trim();

  if (!nomeDiretor || !nomeEstrela) {
    alert("Por favor, preencha os nomes no Passo 1 antes de finalizar.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Preparando Experiência...";

  try {
    const temaEscolhido = document.getElementById("tema")?.value || "romance";
    const dados = {
      tema: temaEscolhido,
      diretor: nomeDiretor,
      estrela: nomeEstrela,
      mensagem: document.getElementById("mensagemFinal")?.value || "",
      musica: document.getElementById("musicaSelecao").value,
      youtubeLink: document.getElementById("youtubeLink").value,
      videoTemSom: document.getElementById("videoTemSom").checked,
      fotos: [],
      video: "",
      criadoEm: serverTimestamp(),
    };

    const fotosReais = window.fotosArmazenadas || [];

    for (let fotoObj of fotosReais) {
      const url = await uploadToR2(fotoObj.file, "foto");
      dados.fotos.push({ url: url, titulo: fotoObj.titulo || "" });
    }

    if (arquivoVideo) {
      dados.video = await uploadToR2(arquivoVideo, "video");
    }

    const docRef = await addDoc(collection(db, "sessoes"), dados);

    // GERA O LINK
    const linkFinal = `${window.location.origin}/sessao.html?id=${docRef.id}`;
    document.getElementById("linkGerado").value = linkFinal;

    // GERA O QR CODE LOCALMENTE (Fica com qualidade altíssima para baixar)
    const qrBox = document.getElementById("qrcodeBox");
    qrBox.innerHTML = ""; // Limpa antigos

    // Pega a cor principal do tema para pintar o QR Code
    const temaCores = {
      romance: "#c4405a",
      amizade: "#4a8ec4",
      familia: "#d4782a",
      aniversario: "#d4407a",
    };
    const qrCor = temaCores[temaEscolhido];
    document.getElementById("qrWrapperBorder").style.borderColor = qrCor;

    new QRCode(qrBox, {
      text: linkFinal,
      width: 220,
      height: 220,
      colorDark: qrCor, // QR Code na cor do tema!
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Mostra o Modal
    document.getElementById("modalSucesso").style.display = "flex";
    btn.innerText = "✅ Concluído!";
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar: " + error.message);
    btn.disabled = false;
    btn.innerText = originalText;
  }
};
