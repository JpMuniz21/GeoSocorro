// Regras de negócio do fluxo de ocorrências.
const { STATUS, PERFIS, ORIGENS } = require("../constantes");
const { podeTransicionar } = require("./estados");
const { conflito, naoEncontrado, proibido } = require("../erros");

// O cidadão só enxerga o que é dele e nada de dados operacionais internos.
function visaoUsuario(o) {
  const { id, tipo, status, cep, rua, numero, bairro, cidade, estado, descricao, criadaEm } = o;
  return { id, tipo, status, cep, rua, numero, bairro, cidade, estado, descricao, criadaEm };
}

function criarServicoOcorrencias({ repo, notificador }) {
  // Quem pode ver esta ocorrência?
  function podeVer(usuario, o) {
    switch (usuario.perfil) {
      case PERFIS.CENTRAL:
      case PERFIS.ADMIN:
        return true;
      case PERFIS.USUARIO:
        return o.criadaPor === usuario.id;
      case PERFIS.SOCORRISTA:
        return o.unidadeAtualId === usuario.unidadeId || o.socorristaId === usuario.id;
      default:
        return false;
    }
  }

  const apresentar = (usuario, o) => (usuario.perfil === PERFIS.USUARIO ? visaoUsuario(o) : o);

  async function obter(id) {
    const o = await repo.buscarOcorrencia(id);
    if (!o) throw naoEncontrado("Ocorrência não encontrada");
    return o;
  }

  // Cidadão que tenta acessar ocorrência alheia recebe 404 (não revela que existe).
  async function obterVisivel(id, usuario) {
    const o = await obter(id);
    if (usuario.perfil === PERFIS.USUARIO && !podeVer(usuario, o)) {
      throw naoEncontrado("Ocorrência não encontrada");
    }
    return o;
  }

  async function avisarCentrais(ocorrenciaId, tipo, mensagem, exceto) {
    const centrais = await repo.listarUsuariosPorPerfil(PERFIS.CENTRAL);
    await Promise.all(
      centrais
        .filter((c) => c.id !== exceto)
        .map((c) => notificador.enviar(c.id, { ocorrenciaId, tipo, mensagem }))
    );
  }

  // ---------- criação e consulta ----------

  async function criar(usuario, dados) {
    const origem = usuario.perfil === PERFIS.USUARIO ? ORIGENS.APP_MOVEL : ORIGENS.CENTRAL;
    const o = await repo.criarOcorrencia({
      ...dados,
      unidadesCandidatas: dados.unidadesCandidatas ?? [],
      criadaPor: usuario.id,
      origem,
    });
    await repo.registrarEvento(o.id, {
      usuarioId: usuario.id,
      acao: "solicitacao_criada",
      motivo: origem === ORIGENS.APP_MOVEL ? "Solicitação recebida do aplicativo móvel" : "Solicitação registrada pela central",
      origem,
    });
    await avisarCentrais(
      o.id,
      "nova_solicitacao",
      `Nova solicitação #${o.id} (${origem === ORIGENS.APP_MOVEL ? "aplicativo móvel" : "central"}): ${o.tipo}`,
      usuario.id
    );
    return apresentar(usuario, o);
  }

  async function listar(usuario) {
    const lista = await repo.listarOcorrencias((o) => podeVer(usuario, o));
    return lista.map((o) => apresentar(usuario, o));
  }

  async function detalhar(id, usuario) {
    const o = await obterVisivel(id, usuario);
    if (!podeVer(usuario, o)) throw proibido("Sem acesso a esta ocorrência");
    return apresentar(usuario, o);
  }

  // ---------- despacho ----------

  // Envia a ocorrência (status "aberta") para uma unidade: a escolhida pela central
  // (unidadeId) ou, se não houver, a próxima ainda não tentada da lista de candidatas.
  async function notificarProxima(ocorrencia, usuarioId, unidadeId) {
    const proxima = unidadeId ?? ocorrencia.unidadesCandidatas.find((u) => !ocorrencia.unidadesTentadas.includes(u));
    if (proxima === undefined) {
      await repo.registrarEvento(ocorrencia.id, { usuarioId, acao: "sem_unidades_disponiveis" });
      await avisarCentrais(
        ocorrencia.id,
        "sem_unidades",
        `Ocorrência #${ocorrencia.id} sem unidade disponível. Selecione uma unidade para despachar.`,
        usuarioId
      );
      return { ocorrencia, semUnidades: true };
    }
    const tentadas = ocorrencia.unidadesTentadas.includes(proxima)
      ? ocorrencia.unidadesTentadas
      : [...ocorrencia.unidadesTentadas, proxima];
    const atualizada = await repo.transicionar(ocorrencia.id, {
      esperado: STATUS.ABERTA,
      novo: STATUS.NOTIFICADA,
      patch: { unidadeAtualId: proxima, unidadesTentadas: tentadas },
      historico: { usuarioId, acao: "notificada", motivo: `unidade ${proxima}` },
    });
    if (!atualizada) throw conflito("OCORRENCIA_STATUS_INVALIDO", "A ocorrência mudou de status; tente novamente");

    const socorristas = await repo.socorristasDaUnidade(proxima);
    await Promise.all(
      socorristas.map((s) =>
        notificador.enviar(s.id, {
          ocorrenciaId: ocorrencia.id,
          tipo: "novo_chamado",
          mensagem: `Novo chamado #${ocorrencia.id} para a sua unidade`,
        })
      )
    );
    return { ocorrencia: atualizada, semUnidades: false };
  }

  async function notificar(id, usuario, { unidadeId } = {}) {
    const o = await obter(id);
    if (!podeTransicionar(o.status, STATUS.NOTIFICADA, usuario.perfil)) {
      throw conflito("OCORRENCIA_STATUS_INVALIDO", `Não é possível notificar uma ocorrência ${o.status}`);
    }
    return notificarProxima(o, usuario.id, unidadeId);
  }

  async function responder(id, usuario, { aceite, motivo }) {
    const o = await obter(id);
    const alvo = aceite ? STATUS.ACEITA : STATUS.ABERTA;
    if (!podeTransicionar(o.status, alvo, usuario.perfil)) {
      throw conflito("OCORRENCIA_STATUS_INVALIDO", `Ocorrência está ${o.status}; não aceita resposta agora`);
    }
    if (o.unidadeAtualId !== usuario.unidadeId) {
      throw proibido("Esta ocorrência foi notificada para outra unidade");
    }

    if (aceite) {
      const atualizada = await repo.transicionar(o.id, {
        esperado: STATUS.NOTIFICADA,
        novo: STATUS.ACEITA,
        patch: { socorristaId: usuario.id },
        historico: { usuarioId: usuario.id, acao: "aceita" },
      });
      // null = outro socorrista aceitou/cancelou antes (corrida)
      if (!atualizada) throw conflito("OCORRENCIA_JA_RESPONDIDA", "Esta ocorrência já foi respondida");
      return { ocorrencia: atualizada };
    }

    const reaberta = await repo.transicionar(o.id, {
      esperado: STATUS.NOTIFICADA,
      novo: STATUS.ABERTA,
      patch: { unidadeAtualId: null },
      historico: { usuarioId: usuario.id, acao: "recusada", motivo },
    });
    if (!reaberta) throw conflito("OCORRENCIA_JA_RESPONDIDA", "Esta ocorrência já foi respondida");
    // Reencaminha para a próxima unidade; se não houver, a central é avisada.
    return notificarProxima(reaberta, usuario.id);
  }

  async function atualizarStatus(id, usuario, novo) {
    const o = await obter(id);
    if (!podeTransicionar(o.status, novo, usuario.perfil)) {
      throw conflito("OCORRENCIA_STATUS_INVALIDO", `Transição ${o.status} → ${novo} não permitida para ${usuario.perfil}`);
    }
    if (usuario.perfil === PERFIS.SOCORRISTA && o.socorristaId !== usuario.id) {
      throw proibido("Apenas o socorrista responsável pode atualizar esta ocorrência");
    }
    const atualizada = await repo.transicionar(o.id, {
      esperado: o.status,
      novo,
      historico: { usuarioId: usuario.id, acao: `status_${novo}` },
    });
    if (!atualizada) throw conflito("OCORRENCIA_STATUS_INVALIDO", "A ocorrência mudou de status; tente novamente");
    return atualizada;
  }

  async function historico(id, usuario) {
    const o = await obterVisivel(id, usuario);
    if (usuario.perfil === PERFIS.SOCORRISTA && !podeVer(usuario, o)) {
      throw proibido("Sem acesso ao histórico desta ocorrência");
    }
    const lista = await repo.listarHistorico(o.id);
    // Cidadão não vê quem atendeu nem motivos internos (recusas etc.).
    if (usuario.perfil === PERFIS.USUARIO) {
      return lista.map(({ usuarioId, motivo, ...publico }) => publico); // eslint-disable-line no-unused-vars
    }
    return lista;
  }

  return { criar, listar, detalhar, notificar, responder, atualizarStatus, historico };
}

module.exports = { criarServicoOcorrencias };
