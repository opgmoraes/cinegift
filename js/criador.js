import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

// --- ESTADO GLOBAL ---
let passoAtual = 1;
const totalPassos = 4;
let arquivosFotos = [];
let arquivoVideo = null;

// --- NAVEGAÇÃO EXPOSTA GLOBALMENTE ---
window.nextStep = function (passo) {
  if (passo > totalPassos) return;
  document.getElementById(`step-${passoAtual}`).classList.remove("active");
  passoAtual = passo;
  document.getElementById(`step-${passoAtual}`).classList.add("active");
  document.getElementById("current-step").innerText = passoAtual;
};

window.prevStep = function (passo) {
  if (passo < 1) return;
  document.getElementById(`step-${passoAtual}`).classList.remove("active");
  passoAtual = passo;
  document.getElementById(`step-${passoAtual}`).classList.add("active");
  document.getElementById("current-step").innerText = passoAtual;
};

// --- PREVIEW TEXTOS ---
document.getElementById("nomeEstrela").addEventListener("input", (e) => {
  document.getElementById("prevEstrela").innerText =
    e.target.value || "Estrela Principal";
});

document.getElementById("nomeDiretor").addEventListener("input", (e) => {
  document.getElementById("prevDiretor").innerText =
    e.target.value || "Diretor";
});

// --- PREVIEW TEMA ---
document.getElementById("tema").addEventListener("change", (e) => {
  const tema = e.target.value;
  const ticket = document.getElementById("previewIngresso");
  const cores = {
    romance: "linear-gradient(135deg, #E50914, #800000)",
    amizade: "linear-gradient(135deg, #FF9900, #B36B00)",
    familia: "linear-gradient(135deg, #007BFF, #004085)",
    aniversario: "linear-gradient(135deg, #9C27B0, #4A148C)",
  };
  ticket.style.background = cores[tema] || cores.romance;
});

// --- PREVIEW FOTOS ---
document.getElementById("fotosLobby").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 5) {
    alert("Máximo de 5 fotos permitido.");
    e.target.value = "";
    return;
  }
  arquivosFotos = files;
  const lista = document.getElementById("lista-fotos");
  lista.innerHTML = "";
  files.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.style.margin = "5px";
    lista.appendChild(img);
  });
});

// --- VALIDAÇÃO VÍDEO ---
document.getElementById("videoPrincipal").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const videoObj = document.createElement("video");
  videoObj.preload = "metadata";
  videoObj.onloadedmetadata = function () {
    URL.revokeObjectURL(videoObj.src);
    if (videoObj.duration > 31) {
      document.getElementById("video-error").innerText =
        "Vídeo muito longo! Máximo 30s.";
      document.getElementById("video-error").style.color = "#ff4444";
      e.target.value = "";
      arquivoVideo = null;
    } else {
      document.getElementById("video-error").innerText = "Vídeo aprovado! ✅";
      document.getElementById("video-error").style.color = "#00C851";
      arquivoVideo = file;
    }
  };
  videoObj.src = URL.createObjectURL(file);
});

// --- UPLOAD R2 ---
async function uploadToR2(file, prefixo) {
  const nomeUnico = `${prefixo}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
  const workerUrl = `https://cinegift-upload.usecinegift.workers.dev/${nomeUnico}`;

  const response = await fetch(workerUrl, {
    method: "PUT",
    headers: {
      "X-Cinegift-Auth": "cinegift-token-123",
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) throw new Error("Erro no upload");

  const r2PublicUrl = `https://pub-dec3c851da9b4e5ba79db54b6ac4b17c.r2.dev`;
  return `${r2PublicUrl}/${nomeUnico}`;
}

// --- FUNÇÃO FINAL EXPOSTA GLOBALMENTE ---
window.finalizarSessao = async function () {
  const btn = document.querySelector(".btn-success");
  const originalText = btn.innerText;

  const nomeDiretor = document.getElementById("nomeDiretor").value;
  const nomeEstrela = document.getElementById("nomeEstrela").value;

  if (!nomeDiretor || !nomeEstrela) {
    alert("Por favor, preencha os nomes no Passo 1 antes de finalizar.");
    window.nextStep(1);
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Criando sua sessão...";

  try {
    const dados = {
      tema: document.getElementById("tema").value,
      diretor: nomeDiretor,
      estrela: nomeEstrela,
      mensagem: document.getElementById("mensagemFinal").value,
      fotos: [],
      video: "",
      criadoEm: serverTimestamp(),
    };

    for (let foto of arquivosFotos) {
      const url = await uploadToR2(foto, "foto");
      dados.fotos.push(url);
    }

    if (arquivoVideo) {
      dados.video = await uploadToR2(arquivoVideo, "video");
    }

    const docRef = await addDoc(collection(db, "sessoes"), dados);
    alert("Sucesso! ID da Sessão: " + docRef.id);
    btn.innerText = "✅ Concluído!";
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar. Verifique o console.");
    btn.disabled = false;
    btn.innerText = originalText;
  }
};
