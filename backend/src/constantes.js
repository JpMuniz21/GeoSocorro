// Fonte única de verdade para status, perfis e códigos de erro.
// Pessoa 1 e o front devem importar/espelhar estes valores.

const STATUS = Object.freeze({
  ABERTA: "aberta",
  NOTIFICADA: "notificada",
  ACEITA: "aceita",
  EM_DESLOCAMENTO: "em_deslocamento",
  FINALIZADA: "finalizada",
  CANCELADA: "cancelada",
});

const PERFIS = Object.freeze({
  CENTRAL: "central",
  SOCORRISTA: "socorrista",
  ADMIN: "administrador",
});

module.exports = { STATUS, PERFIS };
