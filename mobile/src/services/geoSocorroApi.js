const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fallbackAddress = {
  cep: '01310-100',
  rua: 'Avenida Paulista',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
};

function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export const geoSocorroApi = {
  formatCep,

  async lookupCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new Error('Digite um CEP válido com 8 dígitos.');

    try {
      const response = await fetch(`${API_URL}/cep/${digits}`);
      if (!response.ok) throw new Error('Não foi possível consultar o endereço.');
      const data = await response.json();
      return {
        cep: formatCep(data.cep || digits),
        rua: data.rua || data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.cidade || data.localidade || '',
        estado: data.estado || data.uf || '',
      };
    } catch {
      // Mantém o fluxo demonstrável enquanto a rota da Pessoa 1 ainda não foi integrada.
      await wait(450);
      if (digits === '99999999') throw new Error('CEP não encontrado. Verifique o número informado.');
      return { ...fallbackAddress, cep: formatCep(digits) };
    }
  },

  async createOccurrence(payload) {
    try {
      const response = await fetch(`${API_URL}/ocorrencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Não foi possível registrar o chamado.');
      return await response.json();
    } catch {
      // Fallback apenas para apresentação: deve ser removido quando a rota existir no backend.
      await wait(650);
      return {
        ocorrencia: {
          id: `SIM-${String(Date.now()).slice(-5)}`,
          status: 'PENDENTE',
          criadaEm: new Date().toISOString(),
        },
        simulada: true,
      };
    }
  },
};
