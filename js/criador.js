import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";
import imageCompression from "https://esm.sh/browser-image-compression@2.0.2";

window.planoEscolhido = "plano2";
window.LIMITE_FOTOS = 7;
window.LIMITE_VIDEO = 61;
window.LIMITE_TAMANHO_MB = 70;
window.duracaoVideoAtual = 0;

let arquivoVideo = null;
let promessaVideoBackground = null;
let urlVideoFinal = "";

window.selecionarPlano = function (plano) {
  document
    .querySelectorAll(".plano-card")
    .forEach((c) => c.classList.remove("selected"));
  document.getElementById("card-" + plano).classList.add("selected");
  window.planoEscolhido = plano;
};

document.getElementById("videoPrincipal")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const errorEl = document.getElementById("video-error");
  if (!file) return;

  const tamanhoMB = file.size / (1024 * 1024);
  if (tamanhoMB > window.LIMITE_TAMANHO_MB) {
    errorEl.innerText = `Vídeo muito pesado (${tamanhoMB.toFixed(1)}MB)! O limite é ${window.LIMITE_TAMANHO_MB}MB. Por favor, comprima o vídeo ou escolha outro.`;
    errorEl.style.color = "#ff4444";
    e.target.value = "";
    arquivoVideo = null;
    promessaVideoBackground = null;
    return;
  }

  const videoObj = document.createElement("video");
  videoObj.preload = "metadata";

  videoObj.onloadedmetadata = function () {
    setTimeout(() => URL.revokeObjectURL(videoObj.src), 1000);

    if (videoObj.duration > window.LIMITE_VIDEO) {
      errorEl.innerText = `Vídeo muito longo! O máximo absoluto permitido é 60 segundos.`;
      errorEl.style.color = "#ff4444";
      e.target.value = "";
      arquivoVideo = null;
      promessaVideoBackground = null;
      window.duracaoVideoAtual = 0;
    } else {
      window.duracaoVideoAtual = videoObj.duration;

      errorEl.innerText =
        "Vídeo aprovado e a ser preparado nos bastidores! ✅🎬";
      errorEl.style.color = "#00C851";
      arquivoVideo = file;

      promessaVideoBackground = uploadToR2(file, "video")
        .then((url) => {
          urlVideoFinal = url;
          return url;
        })
        .catch((err) => {
          console.error("Erro no upload em background:", err);
          errorEl.innerText =
            "Erro ao conectar. Tente subir o vídeo novamente.";
          errorEl.style.color = "#ff4444";
          return "";
        });
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
      "Você pulou alguma etapa! Por favor, volte e preencha os Nomes e a URL.",
    );
    return;
  }

  if (
    (window.planoEscolhido === "plano1" ||
      window.planoEscolhido === "plano2") &&
    window.duracaoVideoAtual > 31
  ) {
    alert(
      "O seu filme tem mais de 30 segundos! Para prosseguir com ele, você precisa selecionar o plano 'Clássico Eterno', ou voltar e fazer o upload de um vídeo menor.",
    );
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ A validar a sua sessão...";

  try {
    const q = query(
      collection(db, "sessoes"),
      where("slug", "==", slugDigitado),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      alert(
        "Este link personalizado já está em uso! Volte para o Passo 1 e tente outro nome.",
      );
      btn.disabled = false;
      btn.innerText = originalText;
      return;
    }

    const temaEscolhido = document.getElementById("tema")?.value || "romance";

    let fotosReais = window.fotosArmazenadas || [];
    if (window.planoEscolhido === "plano1") {
      fotosReais = fotosReais.slice(0, 5);
    } else {
      fotosReais = fotosReais.slice(0, 7);
    }

    const dados = {
      plano: window.planoEscolhido,
      slug: slugDigitado,
      status: "ativo",
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

    btn.innerText = "⏳ A otimizar fotos para garantir alta velocidade...";

    const opcoesCompressao = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const promessasFotos = fotosReais.map(async (fotoObj) => {
      try {
        const fotoComprimida = await imageCompression(
          fotoObj.file,
          opcoesCompressao,
        );
        const url = await uploadToR2(fotoComprimida, "foto");
        return { url: url, titulo: fotoObj.titulo || "" };
      } catch (err) {
        console.warn("Erro ao comprimir, enviando foto original...", err);
        const url = await uploadToR2(fotoObj.file, "foto");
        return { url: url, titulo: fotoObj.titulo || "" };
      }
    });

    let urlVideo = urlVideoFinal;
    if (arquivoVideo && !urlVideo) {
      btn.innerText = "⏳ A finalizar envio do seu filme principal...";
      if (promessaVideoBackground) {
        urlVideo = await promessaVideoBackground;
      } else {
        urlVideo = await uploadToR2(arquivoVideo, "video");
      }
    }

    const fotosCompletas = await Promise.all(promessasFotos);
    dados.fotos = fotosCompletas;
    dados.video = urlVideo;

    btn.innerText = "✅ Tudo salvo! A redirecionar para o pagamento...";

    const docRef = await addDoc(collection(db, "sessoes"), dados);

    localStorage.setItem("ultimoSlugCineGift", slugDigitado);
    localStorage.setItem("ultimoTemaCineGift", temaEscolhido);

    const linksCakto = {
      plano1: "https://pay.cakto.com.br/373amsz",
      plano2: "https://pay.cakto.com.br/ayzqg7r_859775",
      plano3: "https://pay.cakto.com.br/dvqe4ru",
    };

    window.location.href = `${linksCakto[window.planoEscolhido]}?src=${docRef.id}`;
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar a sessão: Verifique a sua conexão de internet.");
    btn.disabled = false;
    btn.innerText = originalText;
  }
};
