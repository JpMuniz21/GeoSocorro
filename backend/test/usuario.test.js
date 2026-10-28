process.env.NODE_ENV = "test";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");
const { createRepo } = require("../src/repositorios/memoria");

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const pedido = {
  tipo: "Emergência Clínica",
  cep: "60110-000",
  rua: "Rua Exemplo",
  numero: "100",
  bairro: "Centro",
  cidade: "Fortaleza",
  estado: "ce",
};

async function setup(opcoes = {}) {
  const repo = createRepo();
  const app = createApp({ repo, loginMax: 1000, cadastroMax: 1000, ocorrenciaMax: 1000, ...opcoes });
  const login = async (email, senha) => (await request(app).post("/auth/login").send({ email, senha })).body.token;
  const cadastrar = async (nome, email) => {
    const r = await request(app).post("/auth/cadastro").send({ nome, email, senha: "senhaForte1" });
    assert.equal(r.status, 201);
    return login(email, "senhaForte1");
  };
  return {
    app,
    login,
    cadastrar,
    central: await login("central@geosocorro.local", "central123"),
    s1: await login("socorrista1@geosocorro.local", "socorro123"),
    s2: await login("socorrista2@geosocorro.local", "socorro123"),
    usuario: await login("usuario@geosocorro.local", "usuario123"),
  };
}

test("cadastro cria sempre perfil usuario e permite login", async () => {
  const { app, login } = await setup();
  const r = await request(app).post("/auth/cadastro").send({ nome: "Maria", email: "Maria@Email.com", senha: "senhaForte1" });
  assert.equal(r.status, 201);
  assert.equal(r.body.usuario.perfil, "usuario");
  assert.ok(await login("maria@email.com", "senhaForte1"));
});

test("cadastro: senha fraca 400, e-mail duplicado 409, perfil injetado 400", async () => {
  const { app } = await setup();
  const base = { nome: "Joao", email: "joao@email.com", senha: "senhaForte1" };
  assert.equal((await request(app).post("/auth/cadastro").send({ ...base, senha: "curta1" })).status, 400);
  assert.equal((await request(app).post("/auth/cadastro").send({ ...base, senha: "somenteletras" })).status, 400);
  assert.equal((await request(app).post("/auth/cadastro").send({ ...base, perfil: "administrador" })).status, 400);
  assert.equal((await request(app).post("/auth/cadastro").send(base)).status, 201);
  const dup = await request(app).post("/auth/cadastro").send(base);
  assert.equal(dup.status, 409);
  assert.equal(dup.body.erro.codigo, "EMAIL_JA_CADASTRADO");
});

test("usuário cria ocorrência associada a ele, com CEP e UF normalizados", async () => {
  const { app, usuario, central } = await setup();
  const r = await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido);
  assert.equal(r.status, 201);
  assert.equal(r.body.ocorrencia.status, "aberta");
  assert.equal(r.body.ocorrencia.cep, "60110000");
  assert.equal(r.body.ocorrencia.estado, "CE");
  // visão do cidadão não expõe dados operacionais
  assert.equal(r.body.ocorrencia.criadaPor, undefined);
  assert.equal(r.body.ocorrencia.unidadesCandidatas, undefined);

  const visaoCentral = await request(app).get(`/ocorrencias/${r.body.ocorrencia.id}`).set(auth(central));
  assert.equal(visaoCentral.body.ocorrencia.criadaPor, 6);
  assert.equal(visaoCentral.body.ocorrencia.origem, "app_movel");
});

test("histórico registra que a solicitação veio do aplicativo móvel", async () => {
  const { app, usuario, central } = await setup();
  const { body } = await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido);
  const h = await request(app).get(`/ocorrencias/${body.ocorrencia.id}/historico`).set(auth(central));
  assert.equal(h.body.historico[0].acao, "solicitacao_criada");
  assert.equal(h.body.historico[0].origem, "app_movel");
  assert.match(h.body.historico[0].motivo, /aplicativo móvel/);
});

test("usuário vê somente as próprias ocorrências (lista, detalhe e histórico)", async () => {
  const { app, usuario, cadastrar, central } = await setup();
  const outro = await cadastrar("Outro", "outro@email.com");
  const minha = (await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido)).body.ocorrencia;

  assert.equal((await request(app).get("/ocorrencias").set(auth(usuario))).body.ocorrencias.length, 1);
  assert.equal((await request(app).get("/ocorrencias").set(auth(outro))).body.ocorrencias.length, 0);
  assert.equal((await request(app).get(`/ocorrencias/${minha.id}`).set(auth(outro))).status, 404);
  assert.equal((await request(app).get(`/ocorrencias/${minha.id}/historico`).set(auth(outro))).status, 404);
  assert.equal((await request(app).get("/ocorrencias").set(auth(central))).body.ocorrencias.length, 1);
});

test("histórico para o cidadão não revela quem atendeu nem motivos internos", async () => {
  const { app, usuario, central, s1 } = await setup();
  const o = (await request(app).post("/ocorrencias").set(auth(central)).send({ ...pedido, unidadesCandidatas: [1] })).body.ocorrencia;
  await request(app).post(`/ocorrencias/${o.id}/notificar`).set(auth(central));
  await request(app).post(`/ocorrencias/${o.id}/resposta`).set(auth(s1)).send({ aceite: false, motivo: "interno" });
  // o cidadão só enxerga as ocorrências dele; cria uma e confere os campos do histórico
  const minha = (await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido)).body.ocorrencia;
  const h = (await request(app).get(`/ocorrencias/${minha.id}/historico`).set(auth(usuario))).body.historico;
  assert.ok(h.length >= 1);
  for (const e of h) {
    assert.equal(e.usuarioId, undefined);
    assert.equal(e.motivo, undefined);
  }
});

test("central é notificada ao receber nova solicitação", async () => {
  const { app, usuario, central } = await setup();
  const { body } = await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido);
  const n = (await request(app).get("/notificacoes").set(auth(central))).body.notificacoes;
  assert.equal(n.length, 1);
  assert.equal(n[0].tipo, "nova_solicitacao");
  assert.equal(n[0].ocorrenciaId, body.ocorrencia.id);
});

test("central escolhe a unidade ao despachar uma solicitação do app", async () => {
  const { app, usuario, central, s2 } = await setup();
  const { body } = await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido);
  const r = await request(app).post(`/ocorrencias/${body.ocorrencia.id}/notificar`).set(auth(central)).send({ unidadeId: 2 });
  assert.equal(r.status, 200);
  assert.equal(r.body.ocorrencia.status, "notificada");
  assert.equal(r.body.ocorrencia.unidadeAtualId, 2);
  assert.equal((await request(app).get("/notificacoes").set(auth(s2))).body.notificacoes.length, 1);
  // sem unidadeId e sem candidatas: avisa que falta escolher
  const outra = (await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido)).body.ocorrencia;
  const sem = await request(app).post(`/ocorrencias/${outra.id}/notificar`).set(auth(central));
  assert.equal(sem.body.semUnidades, true);
});

test("quando todas as unidades recusam, a central é avisada para escolher outra", async () => {
  const { app, central, s1 } = await setup();
  const o = (await request(app).post("/ocorrencias").set(auth(central)).send({ ...pedido, unidadesCandidatas: [1] })).body.ocorrencia;
  await request(app).post(`/ocorrencias/${o.id}/notificar`).set(auth(central));
  const rec = await request(app).post(`/ocorrencias/${o.id}/resposta`).set(auth(s1)).send({ aceite: false });
  assert.equal(rec.body.semUnidades, true);
  const n = (await request(app).get("/notificacoes").set(auth(central))).body.notificacoes;
  assert.ok(n.some((x) => x.tipo === "sem_unidades" && x.ocorrenciaId === o.id));
});

test("validação forte: CEP, UF, campos extras, HTML e unidades escolhidas pelo cidadão", async () => {
  const { app, usuario } = await setup();
  const enviar = (corpo) => request(app).post("/ocorrencias").set(auth(usuario)).send(corpo);
  assert.equal((await enviar({ ...pedido, cep: "6011a-00" })).status, 400);
  assert.equal((await enviar({ ...pedido, cep: "123" })).status, 400);
  assert.equal((await enviar({ ...pedido, estado: "XX" })).status, 400);
  assert.equal((await enviar({ ...pedido, rua: "<script>alert(1)</script>" })).status, 400);
  assert.equal((await enviar({ ...pedido, status: "finalizada" })).status, 400);
  assert.equal((await enviar({ ...pedido, unidadesCandidatas: [1] })).status, 400);
  assert.equal((await enviar({ ...pedido, tipo: "x".repeat(200) })).status, 400);
  const sem = { ...pedido };
  delete sem.rua;
  assert.equal((await enviar(sem)).status, 400);
});

test("limite de solicitações é por usuário: excedeu → 429 sem afetar outro usuário", async () => {
  const { app, usuario, cadastrar } = await setup({ ocorrenciaMax: 2 });
  const outro = await cadastrar("Outro", "outro@email.com");
  const enviar = (t) => request(app).post("/ocorrencias").set(auth(t)).send(pedido);
  assert.equal((await enviar(usuario)).status, 201);
  assert.equal((await enviar(usuario)).status, 201);
  const bloqueada = await enviar(usuario);
  assert.equal(bloqueada.status, 429);
  assert.equal(bloqueada.body.erro.codigo, "MUITAS_TENTATIVAS");
  assert.equal((await enviar(outro)).status, 201);
});

test("limite de cadastros por IP retorna 429", async () => {
  const { app } = await setup({ cadastroMax: 2 });
  const novo = (i) => request(app).post("/auth/cadastro").send({ nome: "Fulano", email: `f${i}@email.com`, senha: "senhaForte1" });
  assert.deepEqual([(await novo(1)).status, (await novo(2)).status, (await novo(3)).status], [201, 201, 429]);
});

test("cidadão não consegue notificar, responder nem alterar status (403)", async () => {
  const { app, usuario } = await setup();
  const { body } = await request(app).post("/ocorrencias").set(auth(usuario)).send(pedido);
  const id = body.ocorrencia.id;
  assert.equal((await request(app).post(`/ocorrencias/${id}/notificar`).set(auth(usuario))).status, 403);
  assert.equal((await request(app).post(`/ocorrencias/${id}/resposta`).set(auth(usuario)).send({ aceite: true })).status, 403);
  assert.equal((await request(app).patch(`/ocorrencias/${id}/status`).set(auth(usuario)).send({ status: "cancelada" })).status, 403);
});
