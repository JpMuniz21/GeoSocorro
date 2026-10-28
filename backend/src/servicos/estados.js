// Máquina de estados das ocorrências (função pura, sem banco).
const { STATUS: S, PERFIS: P } = require("../constantes");

// "statusAtual>novoStatus" -> perfis autorizados a fazer a transição
const TRANSICOES = {
  [`${S.ABERTA}>${S.NOTIFICADA}`]: [P.CENTRAL, P.ADMIN],
  [`${S.ABERTA}>${S.CANCELADA}`]: [P.CENTRAL, P.ADMIN],
  [`${S.NOTIFICADA}>${S.ACEITA}`]: [P.SOCORRISTA],
  [`${S.NOTIFICADA}>${S.ABERTA}`]: [P.SOCORRISTA], // recusa: volta para reencaminhar
  [`${S.NOTIFICADA}>${S.CANCELADA}`]: [P.CENTRAL, P.ADMIN],
  [`${S.ACEITA}>${S.EM_DESLOCAMENTO}`]: [P.SOCORRISTA],
  [`${S.ACEITA}>${S.CANCELADA}`]: [P.CENTRAL, P.ADMIN],
  [`${S.EM_DESLOCAMENTO}>${S.FINALIZADA}`]: [P.SOCORRISTA],
  [`${S.EM_DESLOCAMENTO}>${S.CANCELADA}`]: [P.CENTRAL, P.ADMIN],
};

function transicaoExiste(atual, novo) {
  return Object.prototype.hasOwnProperty.call(TRANSICOES, `${atual}>${novo}`);
}

function podeTransicionar(atual, novo, perfil) {
  return transicaoExiste(atual, novo) && TRANSICOES[`${atual}>${novo}`].includes(perfil);
}

module.exports = { podeTransicionar, transicaoExiste, TRANSICOES };
