🗺️ Roadmap Master: CineGift
Fase 1: Infraestrutura e Segurança (O Alicerce)
Nesta fase, deixamos os serviços em nuvem prontos para receber e entregar os dados de forma segura.

[ ] 1.1. Setup do Firebase Firestore:

Criar o projeto no Console do Firebase.

Ativar o Firestore Database (modo produção).

Criar a coleção principal: sessoes.

Configurar as Regras de Segurança (Security Rules): Permitir leitura (read) de um documento específico pelo ID (para o destinatário poder ver) e permitir escrita (write) apenas na hora da criação, bloqueando edições posteriores.

[ ] 1.2. Setup do Cloudflare R2 (Armazenamento de Mídia):

Criar a conta/logar no Cloudflare e ativar o R2.

Criar um Bucket chamado cinegift-media.

Configurar o CORS do Bucket: Isso é vital para permitir que o seu site hospedado na Vercel consiga enviar arquivos direto do navegador sem dar erro de "Bloqueio de Origem".

Gerar as Chaves de API (Access Key ID e Secret Access Key).

[ ] 1.3. O "Segurança da Porta" (Cloudflare Worker):

Como o JS roda no navegador, você não pode colocar as chaves do R2 direto no front-end.

Criar um pequeno script no Cloudflare Workers (100k requests/dia grátis) que recebe um pedido do seu site e devolve uma Presigned URL. É um link temporário e seguro que autoriza o front-end a fazer o upload do vídeo/foto direto para o R2.

Fase 2: Front-end do Criador (Wizard & Client-side)
A interface que já começamos a construir. Foco total em conversão e zero custo de servidor nos previews.

[x] 2.1. Estrutura Base: HTML e CSS do painel dividido (Wizard de um lado, celular de preview do outro).

[x] 2.2. Lógica de Preview: JS capturando nomes, textos e trocando cores baseado no tema (romance, amizade, família, aniversário).

[x] 2.3. Preview de Mídia: Uso de URL.createObjectURL para mostrar fotos e vídeo instantaneamente sem upload real.

[x] 2.4. Trava de Segurança Front-end: Validação via JS limitando vídeos a estritos 30 segundos antes de liberar o botão de avançar.

Fase 3: A Integração (O "Motor" da Aplicação)
O momento em que o usuário clica em "Gerar Sessão" e os arquivos viajam.

[ ] 3.1. Upload Seguro para o R2:

JS pede a Presigned URL para o seu Cloudflare Worker.

JS usa o fetch com método PUT para enviar as fotos e o vídeo de 30s direto para o R2 usando a URL temporária.

Exibir barra de progresso visual para o usuário não fechar a aba.

[ ] 3.2. Gravação no Firestore:

Após o upload do R2 terminar com sucesso, pegar os links públicos dessas mídias.

Montar o objeto (Nomes, Mensagem, Tema, Links das fotos, Link do vídeo).

Gravar esse objeto no Firestore e obter o ID do documento gerado (ex: aB3x9Yq).

[ ] 3.3. Entrega do Ingresso:

Exibir a tela de sucesso.

Gerar o link compartilhável final (ex: cinegift.app/sessao.html?id=aB3x9Yq).

(Opcional) Gerar um QR Code na tela usando uma biblioteca JS simples.

Fase 4: Experiência do Destinatário (A Magia)
O fluxo imersivo que mapeamos na versão V2. Quem acessa o link final vive o "cinema".

[ ] 4.1. Roteamento Inteligente:

O JS da sessao.html lê o ?id= da URL.

Bate no Firestore e puxa todos os dados (Se o ID não existir, mostra tela de erro "Sessão Expirada").

[ ] 4.2. A Bilheteria e Gamificação:

Interface com a mensagem surpresa (Tema baseado nos dados).

Lógica simples para selecionar assentos fictícios (muda a cor da poltrona ao clicar).

[ ] 4.3. Ingresso e Scanner:

Tela do ingresso preenchida dinamicamente com os dados do Firestore.

Animação CSS do laser escaneando o código de barras.

[ ] 4.4. O Lobby:

Carrossel injetando os links públicos das fotos hospedadas no R2 dentro das molduras.

[ ] 4.5. A Telona (Modo Teatro):

Animação das cortinas abrindo (CSS Keyframes).

Tag <video> carregando o arquivo do R2 em autoplay.

[ ] 4.6. Créditos Finais:

Vídeo termina, dispara evento JS que esconde o player.

Animação da dedicatória e créditos subindo.

Fase 5: Monetização e Lançamento (Próximos Passos)
Depois de testar o fluxo de ponta a ponta.

[ ] 5.1. Paywall (Checkout): Integrar o fluxo da Fase 3 com um gateway (Stripe/Mercado Pago). O upload para o R2 só ocorre após a confirmação do pagamento (via Webhook ou callback).

[ ] 5.2. Deploy Final: Configurar o domínio personalizado na Vercel.
