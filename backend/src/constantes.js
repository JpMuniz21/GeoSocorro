// Fonte única de verdade para status, perfis e origens.
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
  USUARIO: "usuario", // cidadão que pede ajuda pelo aplicativo móvel
  CENTRAL: "central",
  SOCORRISTA: "socorrista",
  ADMIN: "administrador",
});

// De onde veio a solicitação (registrado no histórico).
const ORIGENS = Object.freeze({
  APP_MOVEL: "app_movel",
  CENTRAL: "central",
});

module.exports = { STATUS, PERFIS, ORIGENS };
