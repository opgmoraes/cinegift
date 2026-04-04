export async function uploadVideo(file, sessaoId) {
  // 1. Pedir URL de upload para a Vercel Function
  const res = await fetch("/api/stream-upload", {
    method: "POST",
    headers: {
      "upload-length": file.size,
      "upload-metadata": `filename ${btoa(file.name)},sessaoId ${btoa(sessaoId)}`,
    },
  });
  const { uploadUrl, streamId } = await res.json();

  // 2. Enviar o vídeo direto para o Cloudflare Stream
  await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/offset+octet-stream",
      "Upload-Offset": "0",
      "Tus-Resumable": "1.0.0",
    },
    body: file,
  });

  return streamId;
}
