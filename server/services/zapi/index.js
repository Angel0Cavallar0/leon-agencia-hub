import { zapiClient } from "./client.js";

export function enviarMensagemTexto(numero, mensagem) {
  return zapiClient.post("/send-text", {
    phone: numero,
    message: mensagem,
  });
}

export function enviarArquivo(numero, arquivoUrl, fileName) {
  return zapiClient.post("/send-file", {
    phone: numero,
    fileUrl: arquivoUrl,
    fileName,
  });
}

export function enviarImagem(numero, imagemUrl, caption) {
  return zapiClient.post("/send-image", {
    phone: numero,
    imageUrl: imagemUrl,
    caption,
  });
}

export function enviarMensagemComBotoes(numero, titulo, botoes) {
  return zapiClient.post("/send-buttons", {
    phone: numero,
    title: titulo,
    buttons: botoes,
  });
}

export function enviarMensagemComLista(numero, listaDeItens) {
  return zapiClient.post("/send-list", {
    phone: numero,
    items: listaDeItens,
  });
}

export function obterStatus() {
  return zapiClient.get("/status");
}

export function obterQRCode() {
  return zapiClient.get("/qr-code");
}

export function reconectarSessao() {
  return zapiClient.post("/session/reconnect");
}

export function desconectarSessao() {
  return zapiClient.post("/session/disconnect");
}
