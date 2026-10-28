const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const config = require("../config");
const { autenticar, autorizar } = require("../middlewares/geral");
const { naoAutenticado } = require("../erros");
const { PERFIS, STATUS } = require("../constantes");

const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });
const respostaSchema = z.object({ aceite: z.boolean(), motivo: z.string().max(300).optional() });
const statusSchema = z.object({
  status: z.enum([STATUS.EM_DESLOCAMENTO, STATUS.FINALIZADA, STATUS.CANCELADA]),
});
const idSchema = z.coerce.number().int().positive();

// Todas as rotas async passam erros ao middleware central.
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

function criarRotas({ repo, servico, loginMax = config.loginRateMax }) {
  const r = express.Router();

  const limitadorLogin = rateLimit({
    windowMs: 60_000,
    limit: loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        erro: { codigo: "MUITAS_TENTATIVAS", mensagem: "Muitas tentativas de login. Aguarde um minuto.", requestId: req.id },
      }),
  });

  r.post(
    "/auth/login",
    limitadorLogin,
    rota(async (req, res) => {
      const { email, senha } = loginSchema.parse(req.body);
      const usuario = await repo.buscarUsuarioPorEmail(email);
      // Mesma mensagem para e-mail inexistente e senha errada.
      if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
        throw naoAutenticado("E-mail ou senha incorretos");
      }
      const token = jwt.sign({ perfil: usuario.perfil, unidadeId: usuario.unidadeId }, config.jwtSecret, {
        subject: String(usuario.id),
        expiresIn: config.jwtExpiraEm,
      });
      res.json({
        token,
        usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil, unidadeId: usuario.unidadeId },
      });
    })
  );

  r.use(autenticar);

  // sub vem como string no JWT; normaliza para número
  r.use((req, res, next) => {
    req.usuario.id = Number(req.usuario.id);
    next();
  });

  r.post(
    "/ocorrencias/:id/notificar",
    autorizar(PERFIS.CENTRAL, PERFIS.ADMIN),
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json(await servico.notificar(id, req.usuario));
    })
  );

  r.post(
    "/ocorrencias/:id/resposta",
    autorizar(PERFIS.SOCORRISTA),
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json(await servico.responder(id, req.usuario, respostaSchema.parse(req.body)));
    })
  );

  r.patch(
    "/ocorrencias/:id/status",
    autorizar(PERFIS.SOCORRISTA, PERFIS.CENTRAL, PERFIS.ADMIN),
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const { status } = statusSchema.parse(req.body);
      res.json({ ocorrencia: await servico.atualizarStatus(id, req.usuario, status) });
    })
  );

  r.get(
    "/ocorrencias/:id/historico",
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json({ historico: await servico.historico(id, req.usuario) });
    })
  );

  r.get(
    "/notificacoes",
    autorizar(PERFIS.SOCORRISTA),
    rota(async (req, res) => {
      res.json({ notificacoes: await repo.listarNotificacoes(req.usuario.id) });
    })
  );

  return r;
}

module.exports = { criarRotas };
