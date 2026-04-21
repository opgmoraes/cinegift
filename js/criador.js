import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

let passoAtual = 1;
const totalPassos = 4;
let arquivoVideo = null;

function irParaPasso(passo) {
  if (passo < 1 || passo > totalPassos) return;
  document
    .querySelectorAll(".wizard-step")
    .forEach((s) => s.classList.remove("active"));
  passoAtual = passo;
  document.getElementById(`step-${passoAtual}`)?.classList.add("active");
  const indicador = document.getElementById("current-step");
  if (indicador) indicador.innerText = passoAtual;
}

window.nextStep = function (passo) {
  irParaPasso(passo);
};
window.prevStep = function (passo) {
  irParaPasso(passo);
};

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

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro no upload (${response.status}): ${errText}`);
  }

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
    irParaPasso(1);
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Criando sua sessão...";

  try {
    const dados = {
      tema: document.getElementById("tema")?.value || "romance",
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
      dados.fotos.push({
        url: url,
        titulo: fotoObj.titulo || "",
      });
    }

    if (arquivoVideo) {
      dados.video = await uploadToR2(arquivoVideo, "video");
    }

    const docRef = await addDoc(collection(db, "sessoes"), dados);

    // GERA O LINK E O QR CODE NO MODAL!
    const linkFinal = `${window.location.origin}/sessao.html?id=${docRef.id}`;
    document.getElementById("linkGerado").value = linkFinal;
    document.getElementById("qrCodeImg").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkFinal)}`;

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
