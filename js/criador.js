import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";
// NÍVEL 2: Importando a biblioteca de compressão de imagens via CDN
import imageCompression from "https://esm.sh/browser-image-compression@2.0.2";

window.planoEscolhido = "plano1";
window.LIMITE_FOTOS = 5;
window.LIMITE_VIDEO = 31; // +1s margem
window.LIMITE_TAMANHO_MB = 70; // Nível 1: Limite máximo de peso do vídeo

let arquivoVideo = null;
let promessaVideoBackground = null; // Nível 3: Guarda o upload fantasma
let urlVideoFinal = ""; // Guarda o link do vídeo quando o upload termina

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

  // NÍVEL 1: Bloqueia vídeos absurdamente pesados (Acima de 50MB)
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
    // Correção para o erro ERR_FILE_NOT_FOUND do Google Chrome
    setTimeout(() => URL.revokeObjectURL(videoObj.src), 1000);

    if (videoObj.duration > window.LIMITE_VIDEO) {
      errorEl.innerText = `Vídeo muito longo! Máximo ${window.LIMITE_VIDEO - 1}s para este plano.`;
      errorEl.style.color = "#ff4444";
      e.target.value = "";
      arquivoVideo = null;
      promessaVideoBackground = null;
    } else {
      errorEl.innerText =
        "Vídeo aprovado e a ser preparado nos bastidores! ✅🎬";
      errorEl.style.color = "#00C851";
      arquivoVideo = file;

      // NÍVEL 3: Inicia o Upload em BACKGROUND imediatamente!
      promessaVideoBackground = uploadToR2(file, "video")
        .then((url) => {
          urlVideoFinal = url;
          console.log("Upload de vídeo em background finalizado com sucesso!");
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
      "Por favor, preencha todos os campos obrigatórios e o Link Personalizado.",
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

    btn.innerText = "⏳ A otimizar fotos para garantir alta velocidade...";

    // NÍVEL 2: Comprimindo as Fotos antes de subir para o servidor
    const fotosReais = window.fotosArmazenadas || [];
    const opcoesCompressao = {
      maxSizeMB: 0.8, // Comprime a foto para no máximo ~800KB
      maxWidthOrHeight: 1200, // Mantém a resolução alta o suficiente para telas
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
        // Fallback: se o compressor falhar, tenta subir a foto original
        const url = await uploadToR2(fotoObj.file, "foto");
        return { url: url, titulo: fotoObj.titulo || "" };
      }
    });

    // NÍVEL 3: Recuperando o vídeo que já estava sendo enviado de fundo
    let urlVideo = urlVideoFinal;
    if (arquivoVideo && !urlVideo) {
      btn.innerText = "⏳ A finalizar envio do seu filme principal...";
      if (promessaVideoBackground) {
        // A internet foi um pouco lenta, vamos esperar o background terminar
        urlVideo = await promessaVideoBackground;
      } else {
        // Redundância de segurança caso o background tenha falhado
        urlVideo = await uploadToR2(arquivoVideo, "video");
      }
    }

    // Espera as fotos comprimirem e subirem (agora incrivelmente rápido)
    const fotosCompletas = await Promise.all(promessasFotos);

    dados.fotos = fotosCompletas;
    dados.video = urlVideo;

    btn.innerText = "✅ Tudo salvo! A redirecionar para o pagamento...";

    const docRef = await addDoc(collection(db, "sessoes"), dados);

    // GUARDA NO NAVEGADOR PARA MOSTRAR NA PÁGINA DE SUCESSO DEPOIS DO PAGAMENTO
    localStorage.setItem("ultimoSlugCineGift", slugDigitado);
    localStorage.setItem("ultimoTemaCineGift", temaEscolhido);

    const linksCakto = {
      plano1: "https://pay.cakto.com.br/373amsz",
      plano2: "https://pay.cakto.com.br/ayzqg7r_859775",
      plano3: "https://pay.cakto.com.br/dvqe4ru",
    };

    // VAI PARA A CAKTO PASSANDO O ID NO FINAL DA URL
    window.location.href = `${linksCakto[window.planoEscolhido]}?src=${docRef.id}`;
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar a sessão: Verifique a sua conexão de internet.");
    btn.disabled = false;
    btn.innerText = originalText;
  }
};
