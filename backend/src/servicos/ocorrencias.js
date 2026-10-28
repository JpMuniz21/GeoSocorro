// Regras de negócio do fluxo de ocorrências (notificar, responder, atualizar status).
const { STATUS } = require("../constantes");
const { PERFIS } = require("../constantes");
const { podeTransicionar } = require("./estados");
const { conflito, naoEncontrado, proibido } = require("../erros");

function criarServicoOcorrencias({ repo, notificador }) {
  async function obter(id) {
    const o = await repo.buscarOcorrencia(id);
    if (!o) throw naoEncontrado("Ocorrência não encontrada");
    return o;
  }

  // Envia a ocorrência (status "aberta") para a próxima unidade ainda não tentada.
  async function notificarProxima(ocorrencia, usuarioId) {
    const proxima = ocorrencia.unidadesCandidatas.find((u) => !ocorrencia.unidadesTentadas.includes(u));
    if (proxima === undefined) {
      await repo.registrarEvento(ocorrencia.id, { usuarioId, acao: "sem_unidades_disponiveis" });
      return { ocorrencia, semUnidades: true };
    }
    const atualizada = await repo.transicionar(ocorrencia.id, {
      esperado: STATUS.ABERTA,
      novo: STATUS.NOTIFICADA,
      patch: { unidadeAtualId: proxima, unidadesTentadas: [...ocorrencia.unidadesTentadas, proxima] },
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

  async function notificar(id, usuario) {
    const o = await obter(id);
    if (!podeTransicionar(o.status, STATUS.NOTIFICADA, usuario.perfil)) {
      throw conflito("OCORRENCIA_STATUS_INVALIDO", `Não é possível notificar uma ocorrência ${o.status}`);
    }
    return notificarProxima(o, usuario.id);
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
    // Reencaminha para a próxima unidade mais próxima.
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
    const o = await obter(id);
    if (usuario.perfil === PERFIS.SOCORRISTA && o.unidadeAtualId !== usuario.unidadeId && o.socorristaId !== usuario.id) {
      throw proibido("Sem acesso ao histórico desta ocorrência");
    }
    return repo.listarHistorico(o.id);
  }

  return { notificar, responder, atualizarStatus, historico };
}

module.exports = { criarServicoOcorrencias };
