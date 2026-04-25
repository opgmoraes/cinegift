import admin from "firebase-admin";

// Inicializa o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const payload = req.body;
    const data = payload.data || payload;

    const eventName = payload.event || data.event || "";
    const status = data.status || data.state || "";

    // CAKTO TRACKING: A Cakto envia os parâmetros da URL em diferentes locais dependendo da versão
    const tracking =
      data.tracking ||
      data.trackingParameters ||
      data.tracking_parameters ||
      {};
    const metadata = data.metadata || {};

    // Extrai o ID da sessão que enviamos via ?src=
    const sessionId =
      data.src || tracking.src || metadata.src || payload.src || data.reference;

    console.log(
      `WEBHOOK CINEGIFT | Evento: [${eventName}] | Status: [${status}] | Sessão: [${sessionId}]`,
    );

    if (!sessionId) {
      console.log(
        "❌ Ignorado: ID da Sessão não encontrado. (Certifique-se que o link de checkout tem ?src=ID)",
      );
      return res.json({
        message: "Session ID missing",
        payload_recebido: payload,
      });
    }

    // 1. VERIFICA SE O PAGAMENTO FOI APROVADO OU PIX GERADO (MODO TESTE)
    const isApproved =
      eventName === "purchase_approved" ||
      status === "paid" ||
      status === "approved" ||
      eventName === "pix_gerado" || // <-- MODO TESTE PIX
      status === "waiting_payment"; // <-- MODO TESTE PIX

    if (!isApproved) {
      console.log(
        `⏳ Evento ignorado (Aguardando pagamento real ou cancelado).`,
      );
      return res.json({ message: "Evento ignorado." });
    }

    // 2. BUSCA A SESSÃO NO FIREBASE
    const sessionRef = db.collection("sessoes").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.log(`❌ Erro: Sessão [${sessionId}] não encontrada no banco.`);
      return res.status(404).json({ error: "Sessão não encontrada" });
    }

    const dadosSessao = sessionSnap.data();

    // Evita reprocessar se já estiver pago
    if (dadosSessao.status === "pago") {
      console.log(`✅ A sessão [${sessionId}] já estava ativa.`);
      return res.json({ success: true, message: "Já processado" });
    }

    // 3. CALCULA A VALIDADE COM BASE NO PLANO
    let mesesExpiracao = 6;
    if (dadosSessao.plano === "plano2") mesesExpiracao = 12;
    else if (dadosSessao.plano === "plano3") mesesExpiracao = 1200;

    const dataExp = new Date();
    dataExp.setMonth(dataExp.getMonth() + mesesExpiracao);

    // 4. ATUALIZA A SESSÃO PARA "PAGO" E LIBERA O ACESSO
    await sessionRef.update({
      status: "pago",
      dataExpiracao: admin.firestore.Timestamp.fromDate(dataExp),
      pagoEm: admin.firestore.FieldValue.serverTimestamp(),
      gatewayId: data.id || `cakto_${Date.now()}`,
    });

    console.log(`🎉 SUCESSO: Sessão [${sessionId}] ativada!`);
    return res.json({ success: true });
  } catch (error) {
    console.error("ERRO CRÍTICO NO WEBHOOK:", error);
    return res.status(500).json({ error: error.message });
  }
}
