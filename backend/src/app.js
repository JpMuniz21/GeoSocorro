const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const { createRepo } = require("./repositorios/memoria");
const { criarNotificador } = require("./servicos/notificador");
const { criarServicoOcorrencias } = require("./servicos/ocorrencias");
const { criarRotas } = require("./rotas");
const { requestId, logRequisicao, rotaNaoEncontrada, tratarErros } = require("./middlewares/geral");

function createApp({ repo = createRepo(), loginMax, cadastroMax, ocorrenciaMax } = {}) {
  const app = express();
  const notificador = criarNotificador(repo);
  const servico = criarServicoOcorrencias({ repo, notificador });

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Sem Origin (curl, testes, server-to-server) passa; navegador só se estiver na lista.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
    })
  );
  app.use(express.json({ limit: "50kb" }));
  app.use(logRequisicao);

  app.get("/saude", (req, res) => res.json({ status: "ok" }));
  app.use(criarRotas({ repo, servico, loginMax, cadastroMax, ocorrenciaMax }));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}

module.exports = { createApp };
