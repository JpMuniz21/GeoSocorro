process.env.NODE_ENV = "test";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");
const { createRepo } = require("../src/repositorios/memoria");

async function setup({ loginMax = 1000 } = {}) {
  const repo = createRepo();
  const app = createApp({ repo, loginMax });
  const oc = await repo.criarOcorrencia({ unidadesCandidatas: [1, 2] });
  const login = async (email, senha) => (await request(app).post("/auth/login").send({ email, senha })).body.token;
  const tokens = {
    central: await login("central@geosocorro.local", "central123"),
    admin: await login("admin@geosocorro.local", "admin123"),
    s1: await login("socorrista1@geosocorro.local", "socorro123"),
    s1b: await login("socorrista1b@geosocorro.local", "socorro123"),
    s2: await login("socorrista2@geosocorro.local", "socorro123"),
  };
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  return { app, repo, oc, tokens, auth };
}

test("login: senha errada retorna 401 com erro padronizado", async () => {
  const { app } = await setup();
  const r = await request(app).post("/auth/login").send({ email: "central@geosocorro.local", senha: "errada" });
  assert.equal(r.status, 401);
  assert.equal(r.body.erro.codigo, "NAO_AUTENTICADO");
  assert.ok(r.body.erro.requestId);
});

test("login: corpo inválido retorna 400", async () => {
  const { app } = await setup();
  const r = await request(app).post("/auth/login").send({ email: "nao-e-email" });
  assert.equal(r.status, 400);
  assert.equal(r.body.erro.codigo, "VALIDACAO");
});

test("rotas protegidas: sem token 401, token inválido 401", async () => {
  const { app } = await setup();
  assert.equal((await request(app).get("/notificacoes")).status, 401);
  const r = await request(app).get("/notificacoes").set("Authorization", "Bearer lixo");
  assert.equal(r.status, 401);
});

test("perfil sem permissão recebe 403", async () => {
  const { app, oc, tokens, auth } = await setup();
  const r = await request(app).post(`/ocorrencias/${oc.id}/notificar`).set(auth(tokens.s1));
  assert.equal(r.status, 403);
});

test("fluxo completo: notificar → aceitar → deslocamento → finalizar, com histórico", async () => {
  const { app, oc, tokens, auth } = await setup();
  assert.equal((await request(app).post(`/ocorrencias/${oc.id}/notificar`).set(auth(tokens.central))).status, 200);

  const notif = await request(app).get("/notificacoes").set(auth(tokens.s1));
  assert.equal(notif.body.notificacoes.length, 1);

  assert.equal((await request(app).post(`/ocorrencias/${oc.id}/resposta`).set(auth(tokens.s1)).send({ aceite: true })).status, 200);
  const desloc = await request(app).patch(`/ocorrencias/${oc.id}/status`).set(auth(tokens.s1)).send({ status: "em_deslocamento" });
  assert.equal(desloc.status, 200);
  const fim = await request(app).patch(`/ocorrencias/${oc.id}/status`).set(auth(tokens.s1)).send({ status: "finalizada" });
  assert.equal(fim.body.ocorrencia.status, "finalizada");

  const h = await request(app).get(`/ocorrencias/${oc.id}/historico`).set(auth(tokens.central));
  assert.deepEqual(h.body.historico.map((x) => x.statusNovo), ["notificada", "aceita", "em_deslocamento", "finalizada"]);
});

test("transição inválida retorna 409 (aberta → finalizada)", async () => {
  const { app, oc, tokens, auth } = await setup();
  const r = await request(app).patch(`/ocorrencias/${oc.id}/status`).set(auth(tokens.s1)).send({ status: "finalizada" });
  assert.equal(r.status, 409);
  assert.equal(r.body.erro.codigo, "OCORRENCIA_STATUS_INVALIDO");
});

test("recusa reencaminha para a próxima unidade", async () => {
  const { app, oc, tokens, auth } = await setup();
  await request(app).post(`/ocorrencias/${oc.id}/notificar`).set(auth(tokens.central));
  const rec = await request(app).post(`/ocorrencias/${oc.id}/resposta`).set(auth(tokens.s1)).send({ aceite: false, motivo: "sem viatura" });
  assert.equal(rec.status, 200);
  assert.equal(rec.body.ocorrencia.status, "notificada");
  assert.equal(rec.body.ocorrencia.unidadeAtualId, 2);
  const n2 = await request(app).get("/notificacoes").set(auth(tokens.s2));
  assert.equal(n2.body.notificacoes.length, 1);
});

test("socorrista de outra unidade não pode responder (403)", async () => {
  const { app, oc, tokens, auth } = await setup();
  await request(app).post(`/ocorrencias/${oc.id}/notificar`).set(auth(tokens.central));
  const r = await request(app).post(`/ocorrencias/${oc.id}/resposta`).set(auth(tokens.s2)).send({ aceite: true });
  assert.equal(r.status, 403);
});

test("dupla aceitação simultânea: só um socorrista consegue", async () => {
  const { app, oc, tokens, auth } = await setup();
  await request(app).post(`/ocorrencias/${oc.id}/notificar`).set(auth(tokens.central));
  const [a, b] = await Promise.all([
    request(app).post(`/ocorrencias/${oc.id}/resposta`).set(auth(tokens.s1)).send({ aceite: true }),
    request(app).post(`/ocorrencias/${oc.id}/resposta`).set(auth(tokens.s1b)).send({ aceite: true }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
});

test("rate limit no login retorna 429 após exceder o limite", async () => {
  const { app } = await setup({ loginMax: 3 });
  // setup já fez 5 logins no mesmo IP com loginMax alto; aqui criamos app novo com limite baixo
  const app2 = createApp({ loginMax: 3 });
  const body = { email: "central@geosocorro.local", senha: "errada" };
  const status = [];
  for (let i = 0; i < 5; i++) status.push((await request(app2).post("/auth/login").send(body)).status);
  assert.deepEqual(status, [401, 401, 401, 429, 429]);
  void app;
});

test("rota inexistente e JSON malformado usam o formato de erro padrão", async () => {
  const { app, tokens, auth } = await setup();
  assert.equal((await request(app).get("/nao-existe")).status, 401);
  assert.equal((await request(app).get("/nao-existe").set(auth(tokens.central))).body.erro.codigo, "NAO_ENCONTRADO");
  const r = await request(app).post("/auth/login").set("Content-Type", "application/json").send("{quebrado");
  assert.equal(r.status, 400);
  assert.equal(r.body.erro.codigo, "JSON_INVALIDO");
});
