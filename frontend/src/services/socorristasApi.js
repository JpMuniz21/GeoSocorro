// servico de integracao de ocorrencias, historico e viaturas
const API_BASE = 'http://localhost:3000';

// dados mock iniciais de ocorrencias
let mockOcorrencias = [
  {
    id: 101,
    tipo: 'Acidente de Trânsito',
    status: 'PENDENTE',
    rua: 'Avenida Washington Soares',
    numero: '1321',
    bairro: 'Edson Queiroz',
    cidade: 'Fortaleza',
    estado: 'CE',
    cep: '60811-905',
  },
  {
    id: 102,
    tipo: 'Emergência Clínica',
    status: 'EM_DESLOCAMENTO',
    rua: 'Rua Desembargador Leite Albuquerque',
    numero: '500',
    bairro: 'Aldeota',
    cidade: 'Fortaleza',
    estado: 'CE',
    cep: '60150-150',
  },
];

// historico em memoria com logs pre-carregados
let mockHistorico = {
  101: [
    { acao: 'CHAMADO_CRIADO', descricao: 'triagem via viacep', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { acao: 'DESPACHO_SOLICITADO', descricao: 'alerta enviado para viatura', timestamp: new Date(Date.now() - 1800000).toISOString() },
  ],
  102: [
    { acao: 'CHAMADO_CRIADO', descricao: 'triagem regulada pela central', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { acao: 'DESPACHO_SOLICITADO', descricao: 'alerta transmitido para equipe', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { acao: 'ACEITO', descricao: 'equipe aceitou o chamado', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { acao: 'EM_DESLOCAMENTO', descricao: 'equipe a caminho do local', timestamp: new Date(Date.now() - 900000).toISOString() },
  ],
};

// viaturas cadastradas inicialmente
let mockUnidades = [
  { id: 1, nome: 'USA-03', tipo: 'Suporte Avançado', base: 'Aldeota', status: 'DISPONÍVEL' },
  { id: 2, nome: 'USB-08', tipo: 'Suporte Básico', base: 'Sul', status: 'EM DESLOCAMENTO' },
  { id: 3, nome: 'MOT-01', tipo: 'Motolância', base: 'Centro', status: 'DISPONÍVEL' },
];

export const socorristasApi = {
  // busca lista de ocorrencias
  async getOcorrencias() {
    try {
      const res = await fetch(`${API_BASE}/ocorrencias`);
      if (!res.ok) throw new Error('erro ao buscar ocorrencias');
      const data = await res.json();
      return data;
    } catch {
      return [...mockOcorrencias];
    }
  },

  // atualiza status e registra acao no historico
  async atualizarStatus(id, novoStatus, justificativa = '') {
    // descricoes padronizadas curtas por acao
    const descricoes = {
      ACEITO: 'despacho aceito pela viatura',
      RECUSADA: justificativa || 'despacho recusado pela equipe',
      EM_DESLOCAMENTO: 'equipe em deslocamento para o local',
      FINALIZADA: 'atendimento concluído e finalizado',
    };

    const descricaoFinal = justificativa || descricoes[novoStatus] || `transição para ${novoStatus}`;
    const novoLog = {
      acao: novoStatus,
      descricao: descricaoFinal,
      timestamp: new Date().toISOString(),
    };

    // atualiza estado em memoria do historico
    if (!mockHistorico[id]) {
      mockHistorico[id] = [
        { acao: 'CHAMADO_CRIADO', descricao: 'triagem registrada', timestamp: new Date(Date.now() - 1800000).toISOString() },
      ];
    }
    mockHistorico[id].push(novoLog);

    // atualiza estado em memoria das ocorrencias
    mockOcorrencias = mockOcorrencias.map((item) =>
      item.id === id ? { ...item, status: novoStatus } : item
    );

    // sincroniza com backend se disponivel
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, justificativa: descricaoFinal, timestamp: novoLog.timestamp }),
      });
      return await res.json();
    } catch {
      return { success: true, id, status: novoStatus, log: novoLog };
    }
  },

  // consulta logs de historico da ocorrencia
  async getHistorico(id) {
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/${id}/historico`);
      if (!res.ok) throw new Error('erro ao obter historico');
      return await res.json();
    } catch {
      return mockHistorico[id] ? [...mockHistorico[id]] : [];
    }
  },

  // lista unidades operacionais
  async getUnidades() {
    try {
      const res = await fetch(`${API_BASE}/unidades`);
      if (!res.ok) throw new Error('erro ao obter unidades');
      return await res.json();
    } catch {
      return [...mockUnidades];
    }
  },

  // cadastra nova viatura
  async cadastrarUnidade(dados) {
    const novaUnidade = {
      id: Date.now(),
      status: 'DISPONÍVEL',
      ...dados,
    };
    mockUnidades.unshift(novaUnidade);

    try {
      const res = await fetch(`${API_BASE}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (res.ok) {
        return await res.json();
      }
      return novaUnidade;
    } catch {
      return novaUnidade;
    }
  },
};