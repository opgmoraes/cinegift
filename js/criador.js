import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";

window.planoEscolhido = "plano1";
window.LIMITE_FOTOS = 5;
window.LIMITE_VIDEO = 31; // +1s margem
let arquivoVideo = null;

window.selecionarPlano = function (plano, maxFotos, maxVideo) {
  document
    .querySelectorAll(".plano-card")
    .forEach((c) => c.classList.remove("selected"));
  document.getElementById("card-" + plano).classList.add("selected");
  window.planoEscolhido = plano;
  window.LIMITE_FOTOS = maxFotos;
  window.LIMITE_VIDEO = maxVideo + 1;
  document.getElementById("txt-max-fotos").innerText = maxFotos;
  document.getElementById("txt-max-video").innerText = maxVideo;

  if (window.fotosArmazenadas && window.fotosArmazenadas.length > maxFotos) {
    window.fotosArmazenadas = window.fotosArmazenadas.slice(0, maxFotos);
    if (typeof renderThumbs === "function") renderThumbs();
  }
};

document.getElementById("videoPrincipal")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const errorEl = document.getElementById("video-error");
  if (!file) return;

  const videoObj = document.createElement("video");
  videoObj.preload = "metadata";
  videoObj.onloadedmetadata = function () {
    URL.revokeObjectURL(videoObj.src);
    if (videoObj.duration > window.LIMITE_VIDEO) {
      errorEl.innerText = `Vídeo muito longo! Máximo ${window.LIMITE_VIDEO - 1}s para este plano.`;
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

  const slugDigitado = document.getElementById("slugLink")?.value.trim();
  const nomeDiretor = document.getElementById("nomeDiretor")?.value.trim();
  const nomeEstrela = document.getElementById("nomeEstrela")?.value.trim();

  if (!slugDigitado || !nomeDiretor || !nomeEstrela) {
    alert(
      "Por favor, preencha todos os campos obrigatórios e o Link Personalizado.",
    );
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Enviando arquivos...";

  try {
    const q = query(
      collection(db, "sessoes"),
      where("slug", "==", slugDigitado),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      alert("Este link personalizado já está em uso! Tente outro nome.");
      btn.disabled = false;
      btn.innerText = originalText;
      return;
    }

    const temaEscolhido = document.getElementById("tema")?.value || "romance";

    const dados = {
      plano: window.planoEscolhido,
      slug: slugDigitado,
      status: "pendente",
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
    const promessasFotos = fotosReais.map(async (fotoObj) => {
      const url = await uploadToR2(fotoObj.file, "foto");
      return { url: url, titulo: fotoObj.titulo || "" };
    });

    const promessaVideo = arquivoVideo
      ? uploadToR2(arquivoVideo, "video")
      : Promise.resolve("");

    const [fotosCompletas, urlVideo] = await Promise.all([
      Promise.all(promessasFotos),
      promessaVideo,
    ]);

    dados.fotos = fotosCompletas;
    dados.video = urlVideo;

    btn.innerText = "⏳ A gerar check-out...";

    const docRef = await addDoc(collection(db, "sessoes"), dados);

    const linksCakto = {
      plano1: "https://pay.cakto.com.br/373amsz",
      plano2: "https://pay.cakto.com.br/ayzqg7r_859775",
      plano3: "https://pay.cakto.com.br/dvqe4ru",
    };

    window.location.href = `${linksCakto[window.planoEscolhido]}?src=${docRef.id}`;
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar: " + error.message);
    btn.disabled = false;
    btn.innerText = originalText;
  }
};
