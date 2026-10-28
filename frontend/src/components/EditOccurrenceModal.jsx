import React, { useState, useEffect } from 'react';

// modal para editar status da ocorrencia ou reverter recusa acidental
export default function EditOccurrenceModal({ ocorrencia, onSalvar, onClose }) {
  const [novoStatus, setNovoStatus] = useState('PENDENTE');
  const [justificativa, setJustificativa] = useState('Recusa desfeita pelo operador');
  const [focoCampo, setFocoCampo] = useState(null);

  // preenche dados ao abrir
  useEffect(() => {
    if (ocorrencia) {
      // sugere reativar para pendente ou aceito se estiver recusada
      if (ocorrencia.status === 'RECUSADA') {
        setNovoStatus('PENDENTE');
        setJustificativa('Recusa desfeita pelo operador');
      } else {
        setNovoStatus(ocorrencia.status);
        setJustificativa('');
      }
    }
  }, [ocorrencia]);

  // fecha modal com tecla esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ocorrencia) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(ocorrencia.id, novoStatus, justificativa.trim() || 'Status atualizado manualmente');
  };

  const estiloCampo = (campo) => ({
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: focoCampo === campo ? '1px solid #38bdf8' : '1px solid #cbd5e1',
    boxShadow: focoCampo === campo ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none',
    fontSize: '13px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
  });

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
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08)',
          border: '1px solid #dbeafe',
          animation: 'modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* cabecalho */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #e0edfd',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>
              Editar Chamado #{ocorrencia.id}
            </h4>
            <span style={{ fontSize: '13px', color: '#0369a1' }}>
              Reverta recusas acidentais ou altere o status da ocorrência
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: '#f0f7ff',
              border: '1px solid #dbeafe',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              fontSize: '13px',
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

        {/* dados do chamado */}
        <div
          style={{
            backgroundColor: '#f0f7ff',
            border: '1px solid #dbeafe',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: '600', color: '#0f172a' }}>{ocorrencia.tipo}</div>
          <div style={{ color: '#475569', marginTop: '2px', fontSize: '12px' }}>
            {ocorrencia.rua}, {ocorrencia.numero} — {ocorrencia.bairro} ({ocorrencia.cidade})
          </div>
          <div style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Status atual: </span>
            <strong style={{ fontSize: '11px', color: '#0369a1', textTransform: 'uppercase' }}>
              {ocorrencia.status}
            </strong>
          </div>
        </div>

        {/* formulario de alteracao */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Novo Status Desejado
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
              onFocus={() => setFocoCampo('status')}
              onBlur={() => setFocoCampo(null)}
              style={estiloCampo('status')}
            >
              <option value="PENDENTE" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                Pendente (Reativar no banner de despacho)
              </option>
              <option value="ACEITO" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                Aceito (Pronto para envio)
              </option>
              <option value="EM_DESLOCAMENTO" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                Em Deslocamento
              </option>
              <option value="FINALIZADA" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                Finalizada
              </option>
              <option value="RECUSADA" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                Recusada
              </option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Observação / Motivo da Alteração
            </label>
            <input
              type="text"
              placeholder="Ex: Recusa desfeita pelo operador"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              onFocus={() => setFocoCampo('justificativa')}
              onBlur={() => setFocoCampo(null)}
              style={estiloCampo('justificativa')}
            />
          </div>

          {/* botoes de acao */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              Confirmar Alteração
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
