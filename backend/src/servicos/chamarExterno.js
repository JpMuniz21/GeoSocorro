// Wrapper para APIs externas (ViaCEP, geocodificação): timeout, circuit breaker
// e mapeamento de falhas para erros padronizados. A Pessoa 1 deve usar isto.
const { AppError } = require("../erros");

class CircuitBreaker {
  constructor({ falhas = 5, resetMs = 15000, agora = Date.now } = {}) {
    this.limite = falhas;
    this.resetMs = resetMs;
    this.agora = agora;
    this.falhas = 0;
    this.abertoDesde = null;
  }
  get estado() {
    if (this.abertoDesde === null) return "fechado";
    return this.agora() - this.abertoDesde >= this.resetMs ? "meio-aberto" : "aberto";
  }
  permite() {
    return this.estado !== "aberto"; // meio-aberto deixa passar uma tentativa de teste
  }
  sucesso() {
    this.falhas = 0;
    this.abertoDesde = null;
  }
  falha() {
    this.falhas += 1;
    if (this.estado === "meio-aberto" || this.falhas >= this.limite) {
      this.abertoDesde = this.agora();
    }
  }
}

// Retorna o JSON da resposta. Erros: 504 (timeout), 502 (falha/5xx/JSON inválido),
// 503 (circuito aberto). Respostas 4xx do provedor NÃO contam como falha do serviço.
async function chamarExterno(url, { breaker, timeoutMs = 4000, fetchImpl = fetch, nome = "serviço externo" } = {}) {
  if (breaker && !breaker.permite()) {
    throw new AppError(503, "EXTERNO_CIRCUITO_ABERTO", `${nome} temporariamente indisponível`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resposta = await fetchImpl(url, { signal: controller.signal });
    if (resposta.status >= 500) throw new Error(`HTTP ${resposta.status}`);
    const corpo = await resposta.json();
    breaker?.sucesso();
    return { status: resposta.status, corpo };
  } catch (err) {
    if (err instanceof AppError) throw err;
    breaker?.falha();
    if (err.name === "AbortError") {
      throw new AppError(504, "EXTERNO_TIMEOUT", `${nome} não respondeu a tempo`);
    }
    throw new AppError(502, "EXTERNO_FALHA", `Falha ao consultar ${nome}`);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chamarExterno, CircuitBreaker };
