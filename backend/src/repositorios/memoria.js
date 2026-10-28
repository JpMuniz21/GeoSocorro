// Repositório em memória. Todas as funções são async de propósito:
// quando a Pessoa 1 definir o banco, basta reimplementar este módulo
// (mesmas assinaturas) sem mexer em rotas ou serviços.
const bcrypt = require("bcryptjs");
const { STATUS, PERFIS } = require("../constantes");

function createRepo() {
  const usuarios = [
    { id: 1, nome: "Central Demo", email: "central@geosocorro.local", perfil: PERFIS.CENTRAL, unidadeId: null, senhaHash: bcrypt.hashSync("central123", 8) },
    { id: 2, nome: "Admin Demo", email: "admin@geosocorro.local", perfil: PERFIS.ADMIN, unidadeId: null, senhaHash: bcrypt.hashSync("admin123", 8) },
    { id: 3, nome: "Socorrista A (Unidade 1)", email: "socorrista1@geosocorro.local", perfil: PERFIS.SOCORRISTA, unidadeId: 1, senhaHash: bcrypt.hashSync("socorro123", 8) },
    { id: 4, nome: "Socorrista B (Unidade 1)", email: "socorrista1b@geosocorro.local", perfil: PERFIS.SOCORRISTA, unidadeId: 1, senhaHash: bcrypt.hashSync("socorro123", 8) },
    { id: 5, nome: "Socorrista C (Unidade 2)", email: "socorrista2@geosocorro.local", perfil: PERFIS.SOCORRISTA, unidadeId: 2, senhaHash: bcrypt.hashSync("socorro123", 8) },
    { id: 6, nome: "Usuário Demo", email: "usuario@geosocorro.local", perfil: PERFIS.USUARIO, unidadeId: null, senhaHash: bcrypt.hashSync("usuario123", 8) },
  ];
  let seqUsuario = 7;
  const ocorrencias = new Map();
  const historico = [];
  const notificacoes = [];
  let seqOcorrencia = 1;
  let seqHistorico = 1;
  let seqNotificacao = 1;

  const agora = () => new Date().toISOString();
  const copia = (o) => (o ? { ...o, unidadesCandidatas: [...o.unidadesCandidatas], unidadesTentadas: [...o.unidadesTentadas] } : null);

  return {
    async buscarUsuarioPorEmail(email) {
      return usuarios.find((u) => u.email === email.toLowerCase()) || null;
    },
    // Retorna null se o e-mail já existir (checagem atômica, sem corrida).
    async criarUsuario({ nome, email, senhaHash, perfil, unidadeId = null }) {
      const e = email.toLowerCase();
      if (usuarios.some((u) => u.email === e)) return null;
      const u = { id: seqUsuario++, nome, email: e, perfil, unidadeId, senhaHash };
      usuarios.push(u);
      return u;
    },
    async listarUsuariosPorPerfil(perfil) {
      return usuarios.filter((u) => u.perfil === perfil);
    },
    async socorristasDaUnidade(unidadeId) {
      return usuarios.filter((u) => u.perfil === PERFIS.SOCORRISTA && u.unidadeId === unidadeId);
    },

    // Em produção, a criação é da Pessoa 1; aqui existe para testes e demo.
    async criarOcorrencia({ unidadesCandidatas = [], ...resto }) {
      const o = {
        id: seqOcorrencia++,
        status: STATUS.ABERTA,
        unidadesCandidatas,
        unidadesTentadas: [],
        unidadeAtualId: null,
        socorristaId: null,
        criadaEm: agora(),
        ...resto,
      };
      ocorrencias.set(o.id, o);
      return copia(o);
    },
    async buscarOcorrencia(id) {
      return copia(ocorrencias.get(Number(id)));
    },
    // predicado opcional; mais recentes primeiro
    async listarOcorrencias(predicado = () => true) {
      return [...ocorrencias.values()].filter(predicado).sort((a, b) => b.id - a.id).map(copia);
    },

    // Troca de status condicional + histórico de forma atômica.
    // Equivalente SQL: UPDATE ... WHERE id=? AND status=? dentro de uma transação
    // que também faz o INSERT no histórico. Retorna null se o status esperado mudou.
    async transicionar(id, { esperado, novo, patch = {}, historico: h }) {
      const o = ocorrencias.get(Number(id));
      if (!o || o.status !== esperado) return null;
      Object.assign(o, patch, { status: novo });
      historico.push({
        id: seqHistorico++,
        ocorrenciaId: o.id,
        usuarioId: h.usuarioId ?? null,
        statusAnterior: esperado,
        statusNovo: novo,
        acao: h.acao,
        motivo: h.motivo ?? null,
        origem: h.origem ?? null,
        em: agora(),
      });
      return copia(o);
    },
    // Registro de evento sem mudança de status (ex.: sem unidades disponíveis).
    async registrarEvento(ocorrenciaId, { usuarioId, acao, motivo, origem }) {
      const o = ocorrencias.get(Number(ocorrenciaId));
      historico.push({
        id: seqHistorico++,
        ocorrenciaId: Number(ocorrenciaId),
        usuarioId: usuarioId ?? null,
        statusAnterior: o?.status ?? null,
        statusNovo: o?.status ?? null,
        acao,
        motivo: motivo ?? null,
        origem: origem ?? null,
        em: agora(),
      });
    },
    async listarHistorico(ocorrenciaId) {
      return historico.filter((h) => h.ocorrenciaId === Number(ocorrenciaId));
    },

    async criarNotificacao({ destinatarioId, ocorrenciaId, tipo, mensagem }) {
      const n = { id: seqNotificacao++, destinatarioId, ocorrenciaId, tipo, mensagem, lida: false, em: agora() };
      notificacoes.push(n);
      return n;
    },
    async listarNotificacoes(destinatarioId) {
      return notificacoes.filter((n) => n.destinatarioId === destinatarioId).reverse();
    },
  };
}

module.exports = { createRepo };
