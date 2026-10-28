const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const config = require("../config");
const { autenticar, autorizar } = require("../middlewares/geral");
const { naoAutenticado, conflito } = require("../erros");
const { PERFIS, STATUS } = require("../constantes");

const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });
const respostaSchema = z.object({ aceite: z.boolean(), motivo: z.string().max(300).optional() });
const statusSchema = z.object({
  status: z.enum([STATUS.EM_DESLOCAMENTO, STATUS.FINALIZADA, STATUS.CANCELADA]),
});
const idSchema = z.coerce.number().int().positive();
const notificarSchema = z.object({ unidadeId: z.number().int().positive().optional() }).strict();

// ---- validação forte de entrada ----
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
// texto sem caracteres de controle nem < > (evita injeção de HTML no painel)
const texto = (min, max) =>
  z.string().trim().min(min).max(max).regex(/^[^<>\u0000-\u001f]*$/, "contém caracteres inválidos");
const cepSchema = z
  .string()
  .trim()
  .regex(/^\d{5}-?\d{3}$/, "CEP deve ter 8 dígitos")
  .transform((c) => c.replace("-", ""));

const campos = {
  tipo: texto(3, 60),
  cep: cepSchema,
  rua: texto(2, 120),
  numero: texto(1, 10),
  bairro: texto(2, 80),
  cidade: texto(2, 80),
  estado: z.string().trim().toUpperCase().pipe(z.enum(UFS)),
  descricao: texto(0, 500).optional(),
};
// O cidadão não escolhe unidades; só a central/admin informa candidatas.
const ocorrenciaUsuarioSchema = z.object(campos).strict();
const ocorrenciaCentralSchema = z
  .object({ ...campos, unidadesCandidatas: z.array(z.number().int().positive()).max(20).optional() })
  .strict();

const cadastroSchema = z
  .object({
    nome: texto(2, 80),
    email: z.string().trim().toLowerCase().email().max(120),
    // 72 = limite do bcrypt
    senha: z
      .string()
      .min(8, "mínimo 8 caracteres")
      .max(72)
      .regex(/[A-Za-z]/, "precisa ter ao menos uma letra")
      .regex(/\d/, "precisa ter ao menos um número"),
  })
  .strict();

// Todas as rotas async passam erros ao middleware central.
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

function criarRotas({ repo, servico, loginMax = config.loginRateMax, cadastroMax = config.cadastroRateMax, ocorrenciaMax = config.ocorrenciaRateMax }) {
  const r = express.Router();

  const criarLimitador = (limit, mensagem, opcoes = {}) =>
    rateLimit({
      windowMs: 60_000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) =>
        res.status(429).json({ erro: { codigo: "MUITAS_TENTATIVAS", mensagem, requestId: req.id } }),
      ...opcoes,
    });

  const limitadorLogin = criarLimitador(loginMax, "Muitas tentativas de login. Aguarde um minuto.");
  const limitadorCadastro = criarLimitador(cadastroMax, "Muitos cadastros deste endereço. Aguarde um minuto.");
  // Por usuário logado (não por IP): vários cidadãos atrás do mesmo IP não se bloqueiam.
  const limitadorOcorrencia = criarLimitador(ocorrenciaMax, "Muitas solicitações em pouco tempo. Aguarde um minuto.", {
    keyGenerator: (req) => `u${req.usuario.id}`,
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

  r.post(
    "/auth/cadastro",
    limitadorCadastro,
    rota(async (req, res) => {
      const { nome, email, senha } = cadastroSchema.parse(req.body);
      // Perfil sempre "usuario": ninguém se cadastra como central/socorrista/admin.
      const usuario = await repo.criarUsuario({
        nome,
        email,
        perfil: PERFIS.USUARIO,
        senhaHash: await bcrypt.hash(senha, 10),
      });
      if (!usuario) throw conflito("EMAIL_JA_CADASTRADO", "Este e-mail já está cadastrado");
      res.status(201).json({ usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil } });
    })
  );

  r.use(autenticar);

  // sub vem como string no JWT; normaliza para número
  r.use((req, res, next) => {
    req.usuario.id = Number(req.usuario.id);
    next();
  });

  r.post(
    "/ocorrencias",
    autorizar(PERFIS.USUARIO, PERFIS.CENTRAL, PERFIS.ADMIN),
    limitadorOcorrencia,
    rota(async (req, res) => {
      const schema = req.usuario.perfil === PERFIS.USUARIO ? ocorrenciaUsuarioSchema : ocorrenciaCentralSchema;
      res.status(201).json({ ocorrencia: await servico.criar(req.usuario, schema.parse(req.body)) });
    })
  );

  r.get(
    "/ocorrencias",
    rota(async (req, res) => {
      res.json({ ocorrencias: await servico.listar(req.usuario) });
    })
  );

  r.get(
    "/ocorrencias/:id",
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json({ ocorrencia: await servico.detalhar(id, req.usuario) });
    })
  );

  r.post(
    "/ocorrencias/:id/notificar",
    autorizar(PERFIS.CENTRAL, PERFIS.ADMIN),
    rota(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const { unidadeId } = notificarSchema.parse(req.body ?? {});
      res.json(await servico.notificar(id, req.usuario, { unidadeId }));
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
    rota(async (req, res) => {
      res.json({ notificacoes: await repo.listarNotificacoes(req.usuario.id) });
    })
  );

  return r;
}

module.exports = { criarRotas };
