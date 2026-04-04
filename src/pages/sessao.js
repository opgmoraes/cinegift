export async function render(container, path) {
  const linkId = path.split("/s/")[1];
  const { db } = await import("../services/firebase.js");
  const { doc, getDoc, updateDoc, serverTimestamp } =
    await import("firebase/firestore");

  const snap = await getDoc(doc(db, "sessoes", linkId));
  if (!snap.exists()) {
    container.innerHTML = "<p>Sessão não encontrada.</p>";
    return;
  }
  const sessao = snap.data();

  // Marcar abertura (só na primeira vez)
  if (!sessao.abertaEm) {
    await updateDoc(doc(db, "sessoes", linkId), {
      abertaEm: serverTimestamp(),
    });
  }

  // Iniciar na tela 1
  mostrarTela(container, sessao, 1);
}

function mostrarTela(container, sessao, tela) {
  const telas = {
    1: tela1Poster,
    2: tela2Ingresso,
    3: tela3Slideshow,
    4: tela4Player,
    5: tela5Creditos,
  };
  const proxima = () => mostrarTela(container, sessao, tela + 1);
  telas[tela](container, sessao, proxima);
}
