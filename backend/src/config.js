require("dotenv").config();

const producao = process.env.NODE_ENV === "production";

if (producao && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET é obrigatório em produção");
}

module.exports = {
  producao,
  porta: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "segredo-apenas-para-desenvolvimento",
  jwtExpiraEm: process.env.JWT_EXPIRA_EM || "1h",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  externo: {
    timeoutMs: Number(process.env.EXTERNO_TIMEOUT_MS) || 4000,
    breakerFalhas: Number(process.env.EXTERNO_BREAKER_FALHAS) || 5,
    breakerResetMs: Number(process.env.EXTERNO_BREAKER_RESET_MS) || 15000,
  },
  loginRateMax: Number(process.env.LOGIN_RATE_MAX) || 10,
  cadastroRateMax: Number(process.env.CADASTRO_RATE_MAX) || 5,
  ocorrenciaRateMax: Number(process.env.OCORRENCIA_RATE_MAX) || 5,
  seedDemo: process.env.SEED_DEMO === "true",
};
