const pino = require("pino");
const config = require("./config");

// Nunca registrar CEP, endereço ou dados do chamado (LGPD).
const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  redact: ["req.headers.authorization", "senha", "*.senha", "cep", "*.cep", "endereco", "*.endereco"],
});

module.exports = logger;
