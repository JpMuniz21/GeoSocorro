const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { ZodError } = require("zod");
const config = require("../config");
const logger = require("../logger");
const { AppError, naoAutenticado, proibido, naoEncontrado } = require("../erros");

function requestId(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}

// Log por requisição: só método, rota (sem query string) e status.
function logRequisicao(req, res, next) {
  const inicio = Date.now();
  res.on("finish", () => {
    logger.info({
      requestId: req.id,
      metodo: req.method,
      rota: req.baseUrl + (req.route ? req.route.path : req.path),
      status: res.statusCode,
      ms: Date.now() - inicio,
    });
  });
  next();
}

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");
  if (tipo !== "Bearer" || !token) return next(naoAutenticado());
  try {
    const p = jwt.verify(token, config.jwtSecret);
    req.usuario = { id: p.sub, perfil: p.perfil, unidadeId: p.unidadeId ?? null };
    next();
  } catch {
    next(naoAutenticado("Token inválido ou expirado"));
  }
}

const autorizar =
  (...perfis) =>
  (req, res, next) =>
    perfis.includes(req.usuario?.perfil) ? next() : next(proibido());

function rotaNaoEncontrada(req, res, next) {
  next(naoEncontrado("Rota não encontrada"));
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  let status = 500;
  let codigo = "ERRO_INTERNO";
  let mensagem = "Erro interno do servidor";
  let detalhes;

  if (err instanceof AppError) {
    ({ status, codigo } = err);
    mensagem = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    codigo = "VALIDACAO";
    mensagem = "Dados de entrada inválidos";
    detalhes = err.issues.map((i) => ({ campo: i.path.join("."), problema: i.message }));
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    codigo = "JSON_INVALIDO";
    mensagem = "Corpo da requisição não é um JSON válido";
  } else {
    logger.error({ requestId: req.id, err: { message: err.message, stack: err.stack } });
  }

  res.status(status).json({
    erro: { codigo, mensagem, ...(detalhes && { detalhes }), requestId: req.id },
  });
}

module.exports = { requestId, logRequisicao, autenticar, autorizar, rotaNaoEncontrada, tratarErros };
