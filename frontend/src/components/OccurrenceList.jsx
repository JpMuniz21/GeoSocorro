import React from 'react';

// mapeamento de badges em tons pastel
const statusConfig = {
  PENDENTE: {
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
    label: 'Pendente',
    dot: '#d97706',
  },
  ACEITO: {
    bg: '#e0f2fe',
    color: '#0369a1',
    border: '#bae6fd',
    label: 'Aceito',
    dot: '#0284c7',
  },
  EM_DESLOCAMENTO: {
    bg: '#e0e7ff',
    color: '#3730a3',
    border: '#c7d2fe',
    label: 'Em Deslocamento',
    dot: '#6366f1',
  },
  FINALIZADA: {
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0',
    label: 'Finalizada',
    dot: '#10b981',
  },
  RECUSADA: {
    bg: '#fef2f2',
    color: '#991b1b',
    border: '#fecaca',
    label: 'Recusada',
    dot: '#ef4444',
  },
};

// lista chamados operacionais com botao de chamada em destaque
export default function OccurrenceList({ ocorrencias, onAtualizarStatus, onVerHistorico, onEditar }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #dbeafe',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.05), 0 2px 4px -2px rgba(2, 132, 199, 0.05)',
      }}
    >
      {/* cabecalho da tabela operacional em azul pastel */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#f0f7ff',
          borderBottom: '1px solid #dbeafe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0c4a6e' }}>
            Ocorrências em Andamento
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Acompanhamento e despacho de viaturas em tempo real
          </span>
        </div>

        <span
          style={{
            fontSize: '12px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontWeight: '600',
          }}
        >
          Total: {ocorrencias.length}
        </span>
      </div>

      {/* lista de ocorrencias */}
      <div style={{ padding: '6px 0' }}>
        {ocorrencias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600' }}>Nenhuma ocorrência encontrada</p>
            <span style={{ fontSize: '13px' }}>todos os chamados foram finalizados ou aguardam despacho.</span>
          </div>
        ) : (
          ocorrencias.map((item) => {
            const config = statusConfig[item.status] || {
              bg: '#f1f5f9',
              color: '#475569',
              border: '#cbd5e1',
              label: item.status,
              dot: '#94a3b8',
            };

            const foiRecusada = item.status === 'RECUSADA';

            return (
              <div
                key={item.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f7ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'background-color 0.15s ease-in-out',
                }}
              >
                {/* dados da ocorrencia */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {/* badge arredondado de status pastel */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: config.dot,
                          display: 'inline-block',
                        }}
                      />
                      {config.label}
                    </span>

                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      Chamado #{item.id}
                    </strong>
                    <span style={{ fontSize: '13px', color: '#475569' }}>
                      — {item.tipo}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 2px 0', fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>
                    {item.rua}, {item.numero} — {item.bairro}
                  </p>
                  <small style={{ color: '#64748b', fontSize: '12px' }}>
                    {item.cidade}/{item.estado} • CEP {item.cep}
                  </small>
                </div>

                {/* acoes de transicao, historico e edicao com alto destaque */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.status === 'ACEITO' && (
                    <button
                      onClick={() => onAtualizarStatus(item.id, 'EM_DESLOCAMENTO')}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      Em Deslocamento
                    </button>
                  )}

                  {item.status === 'EM_DESLOCAMENTO' && (
                    <button
                      onClick={() => onAtualizarStatus(item.id, 'FINALIZADA')}
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                      }}
                    >
                      Finalizar Atendimento
                    </button>
                  )}

                  {/* botao de chamada em alto destaque quando recusada */}
                  {foiRecusada ? (
                    <button
                      onClick={() => onEditar(item)}
                      title="Editar status ou reverter recusa acidental"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                        letterSpacing: '0.2px',
                      }}
                    >
                      Editar Chamado
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditar(item)}
                      title="Editar ocorrência"
                      style={{
                        backgroundColor: '#f0f7ff',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Editar
                    </button>
                  )}

                  <button
                    onClick={() => onVerHistorico(item)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Histórico
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}