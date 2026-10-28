const config = require("./config");
const logger = require("./logger");
const { createRepo } = require("./repositorios/memoria");
const { createApp } = require("./app");

async function iniciar() {
  const repo = createRepo();

  if (config.seedDemo) {
    // Ocorrência fictícia, só para a demonstração (sem dados reais).
    await repo.criarOcorrencia({ descricao: "Ocorrência de demonstração", unidadesCandidatas: [1, 2] });
    logger.info("Ocorrência de demonstração criada (id 1)");
  }

  createApp({ repo }).listen(config.porta, () => {
    logger.info(`Servidor rodando na porta ${config.porta}`);
  });
}

iniciar();
