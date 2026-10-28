process.env.NODE_ENV = "test";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { chamarExterno, CircuitBreaker } = require("../src/servicos/chamarExterno");
const { podeTransicionar } = require("../src/servicos/estados");

// fetch falso que nunca responde até ser abortado
const fetchPendente = (url, { signal }) =>
  new Promise((_, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" }))));

test("timeout vira 504 EXTERNO_TIMEOUT sem derrubar o processo", async () => {
  await assert.rejects(
    chamarExterno("http://x", { timeoutMs: 30, fetchImpl: fetchPendente }),
    (e) => e.status === 504 && e.codigo === "EXTERNO_TIMEOUT"
  );
});

test("falha de rede e HTTP 5xx viram 502", async () => {
  await assert.rejects(chamarExterno("http://x", { fetchImpl: async () => { throw new Error("ECONNRESET"); } }), (e) => e.status === 502);
  await assert.rejects(chamarExterno("http://x", { fetchImpl: async () => ({ status: 503, json: async () => ({}) }) }), (e) => e.status === 502);
});

test("resposta OK devolve status e corpo", async () => {
  const r = await chamarExterno("http://x", { fetchImpl: async () => ({ status: 200, json: async () => ({ ok: 1 }) }) });
  assert.deepEqual(r, { status: 200, corpo: { ok: 1 } });
});

test("circuit breaker abre após N falhas, bloqueia, e fecha após sucesso no meio-aberto", async () => {
  let t = 0;
  const breaker = new CircuitBreaker({ falhas: 3, resetMs: 1000, agora: () => t });
  let chamadas = 0;
  const falha = async () => { chamadas++; throw new Error("fora"); };

  for (let i = 0; i < 3; i++) await assert.rejects(chamarExterno("http://x", { breaker, fetchImpl: falha }));
  assert.equal(breaker.estado, "aberto");

  await assert.rejects(chamarExterno("http://x", { breaker, fetchImpl: falha }), (e) => e.status === 503);
  assert.equal(chamadas, 3, "com o circuito aberto, o serviço externo não é chamado");

  t = 1500;
  assert.equal(breaker.estado, "meio-aberto");
  await chamarExterno("http://x", { breaker, fetchImpl: async () => ({ status: 200, json: async () => ({}) }) });
  assert.equal(breaker.estado, "fechado");
});

test("máquina de estados respeita perfis e bloqueia saltos", () => {
  assert.equal(podeTransicionar("notificada", "aceita", "socorrista"), true);
  assert.equal(podeTransicionar("notificada", "aceita", "central"), false);
  assert.equal(podeTransicionar("aberta", "finalizada", "administrador"), false);
  assert.equal(podeTransicionar("finalizada", "aberta", "administrador"), false);
});
