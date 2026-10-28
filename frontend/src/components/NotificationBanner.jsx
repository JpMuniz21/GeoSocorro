import React from 'react';

// alerta topo em tons de azul pastel com botao de chamada em alto destaque
export default function NotificationBanner({ chamado, onAceitar, onRecusar }) {
  if (!chamado) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #eff6ff 100%)',
        color: '#0f172a',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '18px',
        boxShadow: '0 10px 25px -4px rgba(2, 132, 199, 0.18), 0 4px 10px -2px rgba(2, 132, 199, 0.08)',
        border: '1.5px solid #93c5fd',
        animation: 'bannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        {/* badge com indicador suave */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #bae6fd',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#0369a1',
            letterSpacing: '0.5px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'inline-block',
              animation: 'pulseSoft 1.8s infinite ease-in-out',
            }}
          />
          NOVO DESPACHO • AÇÃO PRIORITÁRIA
        </div>

        <h4 style={{ margin: '10px 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0c4a6e', letterSpacing: '-0.3px' }}>
          Chamado #{chamado.id} — {chamado.tipo}
        </h4>

        <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: '1.4' }}>
          Endereço: {chamado.rua}, {chamado.numero} — {chamado.bairro} ({chamado.cidade}/{chamado.estado}) • CEP: {chamado.cep}
        </p>
      </div>

      {/* botoes com destaque maximo para o aceite de chamada */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => onAceitar(chamado.id)}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '11px 24px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            letterSpacing: '0.3px',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(2, 132, 199, 0.4), 0 2px 4px rgba(2, 132, 199, 0.25)',
            textTransform: 'uppercase',
          }}
        >
          Aceitar Chamado
        </button>

        <button
          onClick={() => onRecusar(chamado.id)}
          style={{
            backgroundColor: '#ffffff',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            padding: '11px 18px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          Recusar
        </button>
      </div>
    </div>
  );
}