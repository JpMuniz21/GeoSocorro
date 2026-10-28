import React, { useState, useEffect } from 'react';
import NotificationBanner from './components/NotificationBanner';
import OccurrenceList from './components/OccurrenceList';
import UnitsManagement from './components/UnitsManagement';
import ActionHistoryModal from './components/ActionHistoryModal';
import EditOccurrenceModal from './components/EditOccurrenceModal';
import { socorristasApi } from './services/socorristasApi';

// painel operacional principal do frontend 4
export default function App() {
  const [tab, setTab] = useState('ocorrencias');
  const [ocorrencias, setOcorrencias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [chamadoPendente, setChamadoPendente] = useState(null);
  const [itemHistorico, setItemHistorico] = useState(null);
  const [logsHistorico, setLogsHistorico] = useState([]);
  const [itemEdicao, setItemEdicao] = useState(null);

  // carrega dados iniciais de ocorrencias e unidades
  useEffect(() => {
    carregarInicial();
  }, []);

  const carregarInicial = async () => {
    const occ = await socorristasApi.getOcorrencias();
    setOcorrencias(occ);

    // captura chamado pendente para alerta no banner
    const pendente = occ.find((o) => o.status === 'PENDENTE');
    if (pendente) {
      setChamadoPendente(pendente);
    }

    const und = await socorristasApi.getUnidades();
    setUnidades(und);
  };

  // aceita o chamado imediatamente no estado local
  const handleAceitar = (id) => {
    setChamadoPendente(null);
    setOcorrencias((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'ACEITO' } : item))
    );
    socorristasApi.atualizarStatus(id, 'ACEITO', 'despacho aceito pela viatura');
  };

  // recusa o chamado imediatamente no estado local
  const handleRecusar = (id) => {
    setChamadoPendente(null);
    setOcorrencias((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RECUSADA' } : item))
    );
    socorristasApi.atualizarStatus(id, 'RECUSADA', 'equipe indisponível');
  };

  // transicao em tempo real de status da ocorrencia sem recarregar tela
  const handleAtualizarStatus = (id, status) => {
    setOcorrencias((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    socorristasApi.atualizarStatus(id, status);
  };

  // abre modal de historico com logs sincronizados
  const handleVerHistorico = async (ocorrencia) => {
    setItemHistorico(ocorrencia);
    const logs = await socorristasApi.getHistorico(ocorrencia.id);
    setLogsHistorico(logs);
  };

  // abre modal para editar chamada ou reverter recusa acidental
  const handleAbrirEdicao = (ocorrencia) => {
    setItemEdicao(ocorrencia);
  };

  // salva a edicao do status da ocorrencia
  const handleSalvarEdicao = (id, novoStatus, justificativa) => {
    setOcorrencias((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: novoStatus } : item))
    );

    // se o status voltou para pendente, recoloca no banner de alerta
    if (novoStatus === 'PENDENTE') {
      const atual = ocorrencias.find((o) => o.id === id);
      setChamadoPendente(atual ? { ...atual, status: 'PENDENTE' } : { id, status: 'PENDENTE' });
    } else if (chamadoPendente && chamadoPendente.id === id) {
      setChamadoPendente(null);
    }

    // registra no historico e no servico
    socorristasApi.atualizarStatus(id, novoStatus, justificativa);
    setItemEdicao(null);
  };

  // cadastra viatura diretamente na tabela da aba
  const handleCadastrarUnidade = async (dados) => {
    const nova = await socorristasApi.cadastrarUnidade(dados);
    setUnidades((prev) => {
      if (prev.some((u) => u.id === nova.id)) return prev;
      return [nova, ...prev];
    });
  };

  // metricas operacionais rapidas para o topo
  const totalAtivas = ocorrencias.filter((o) => o.status !== 'FINALIZADA' && o.status !== 'RECUSADA').length;
  const emDeslocamento = ocorrencias.filter((o) => o.status === 'EM_DESLOCAMENTO').length;
  const totalUnidades = unidades.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f7ff', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* cabecalho em tons pastel azul claro sem emojis */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1px solid #dbeafe',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sistema Operacional Ativo
              </span>
            </div>
            <h2 style={{ margin: 0, color: '#0c4a6e', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
              GeoSocorro • Monitoramento e Socorristas
            </h2>
            <small style={{ color: '#64748b', fontSize: '13px' }}>
              Painel Operacional de Equipes de Campo e Despacho
            </small>
          </div>

          {/* alternador de abas em azul pastel */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: '#e0f2fe',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #bae6fd',
            }}
          >
            <button
              onClick={() => setTab('ocorrencias')}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: tab === 'ocorrencias' ? '#ffffff' : 'transparent',
                color: tab === 'ocorrencias' ? '#0369a1' : '#64748b',
                boxShadow: tab === 'ocorrencias' ? '0 2px 4px rgba(2, 132, 199, 0.1)' : 'none',
              }}
            >
              Ocorrências
            </button>
            <button
              onClick={() => setTab('unidades')}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: tab === 'unidades' ? '#ffffff' : 'transparent',
                color: tab === 'unidades' ? '#0369a1' : '#64748b',
                boxShadow: tab === 'unidades' ? '0 2px 4px rgba(2, 132, 199, 0.1)' : 'none',
              }}
            >
              Unidades e Equipes
            </button>
          </div>
        </header>

        {/* cards de resumo rapido com visual azul pastel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #dbeafe',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>Chamados Ativos</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>
              {totalAtivas}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #dbeafe',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: '600' }}>Em Deslocamento</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5', marginTop: '2px' }}>
              {emDeslocamento}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #dbeafe',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: '600' }}>Viaturas na Frota</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
              {totalUnidades}
            </div>
          </div>
        </div>

        {/* banner de despacho prioritario */}
        <NotificationBanner
          chamado={chamadoPendente}
          onAceitar={handleAceitar}
          onRecusar={handleRecusar}
        />

        {/* conteudo principal por aba selecionada */}
        {tab === 'ocorrencias' ? (
          <OccurrenceList
            ocorrencias={ocorrencias}
            onAtualizarStatus={handleAtualizarStatus}
            onVerHistorico={handleVerHistorico}
            onEditar={handleAbrirEdicao}
          />
        ) : (
          <UnitsManagement
            unidades={unidades}
            onCadastrar={handleCadastrarUnidade}
          />
        )}

        {/* modal de timeline de historico */}
        <ActionHistoryModal
          ocorrencia={itemHistorico}
          logs={logsHistorico}
          onClose={() => setItemHistorico(null)}
        />

        {/* modal para editar ou reverter chamada recusada sem querer */}
        <EditOccurrenceModal
          ocorrencia={itemEdicao}
          onSalvar={handleSalvarEdicao}
          onClose={() => setItemEdicao(null)}
        />
      </div>
    </div>
  );
}