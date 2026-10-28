// Notificação simulada: grava na caixa do destinatário (consultada por polling
// em GET /notificacoes). Para trocar por push/SSE/WebSocket, só reimplemente
// enviar() mantendo a assinatura.
function criarNotificador(repo) {
  return {
    async enviar(destinatarioId, { ocorrenciaId, tipo, mensagem }) {
      return repo.criarNotificacao({ destinatarioId, ocorrenciaId, tipo, mensagem });
    },
  };
}

module.exports = { criarNotificador };
