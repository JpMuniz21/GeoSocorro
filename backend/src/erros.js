class AppError extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

const naoAutenticado = (msg = "Autenticação necessária") =>
  new AppError(401, "NAO_AUTENTICADO", msg);
const proibido = (msg = "Sem permissão para esta ação") =>
  new AppError(403, "PROIBIDO", msg);
const naoEncontrado = (msg = "Recurso não encontrado") =>
  new AppError(404, "NAO_ENCONTRADO", msg);
const conflito = (codigo, msg) => new AppError(409, codigo, msg);
const validacao = (msg) => new AppError(400, "VALIDACAO", msg);

module.exports = {
  AppError,
  naoAutenticado,
  proibido,
  naoEncontrado,
  conflito,
  validacao,
};
