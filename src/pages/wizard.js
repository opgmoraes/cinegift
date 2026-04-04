const state = {
  tema: "romance",
  protagonistas: { nome1: "", nome2: "" },
  dataEstreia: null,
  fotoPoster: null, // File object
  fotosSlideshow: [], // Array de File objects (max 6)
  videoFile: null, // File object
  musicaUrl: "",
  mensagemFinal: "",
};

let passoAtual = 1;

export function render(container) {
  container.innerHTML = "";
  renderPasso(container, passoAtual);
}

function renderPasso(container, passo) {
  const passos = {
    1: renderPasso1,
    2: renderPasso2,
    3: renderPasso3,
    4: renderPasso4,
  };
  passos[passo](container);
}
