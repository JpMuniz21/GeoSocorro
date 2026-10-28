import React, { useEffect } from 'react';

// badges de acao em tons pastel para o historico
const badgePorAcao = {
  CHAMADO_CRIADO: { bg: '#f0f7ff', color: '#0369a1', border: '#bae6fd' },
  DESPACHO_SOLICITADO: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  ACEITO: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  EM_DESLOCAMENTO: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  FINALIZADA: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  RECUSADA: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  STATUS_EDITADO: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  PENDENTE: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
};

// modal de historico com backdrop blur e estilo pastel azul claro
export default function ActionHistoryModal({ ocorrencia, logs = [], onClose }) {
  // fecha modal com tecla esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ocorrencia) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'modalFadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08)',
          border: '1px solid #dbeafe',
          animation: 'modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* cabecalho do modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #e0edfd',
            paddingBottom: '14px',
            marginBottom: '18px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>
              Histórico do Chamado #{ocorrencia.id}
            </h4>
            <span style={{ fontSize: '13px', color: '#0369a1' }}>
              {ocorrencia.tipo} • {ocorrencia.bairro} ({ocorrencia.cidade})
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: '#f0f7ff',
              border: '1px solid #dbeafe',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* timeline vertical com logs de acao */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
          {logs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
              Nenhum log registrado para esta ocorrência.
            </p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              {/* linha guia da timeline em azul pastel */}
              <div
                style={{
                  position: 'absolute',
                  left: '6px',
                  top: '6px',
                  bottom: '6px',
                  width: '2px',
                  backgroundColor: '#dbeafe',
                }}
              />

              {logs.map((log, index) => {
                const badge = badgePorAcao[log.acao] || { bg: '#f0f7ff', color: '#0369a1', border: '#bae6fd' };
                const dataFormatada = new Date(log.timestamp).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
                    {/* ponto circular da linha do tempo em azul pastel */}
                    <span
                      style={{
                        position: 'absolute',
                        left: '-18px',
                        top: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 2px #bae6fd',
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {log.acao}
                      </span>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>{dataFormatada}</small>
                    </div>

                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#334155' }}>
                      {log.descricao || 'transição efetuada com sucesso'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* rodape do modal */}
        <div style={{ borderTop: '1px solid #e0edfd', paddingTop: '16px', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f0f7ff',
              border: '1px solid #dbeafe',
              borderRadius: '8px',
              color: '#0369a1',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}