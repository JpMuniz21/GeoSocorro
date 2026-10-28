import React, { useState } from 'react';

// form e tabela de viaturas com paleta pastel azul claro
export default function UnitsManagement({ unidades, onCadastrar }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Suporte Básico');
  const [base, setBase] = useState('');
  const [focoCampo, setFocoCampo] = useState(null);

  // envia novo cadastro diretamente para tabela local
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim() || !base.trim()) return;

    onCadastrar({
      nome: nome.trim(),
      tipo,
      base: base.trim(),
      status: 'DISPONÍVEL',
    });

    setNome('');
    setBase('');
  };

  // estilo compartilhado de campos para anular conflito escuro/claro
  const estiloCampo = (campo) => ({
    width: '100%',
    padding: '8px 12px',
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
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #dbeafe',
        padding: '22px',
        boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.05), 0 2px 4px -2px rgba(2, 132, 199, 0.05)',
      }}
    >
      {/* cabecalho da secao */}
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0c4a6e' }}>
          Gestão de Unidades e Equipes
        </h3>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Cadastre novas viaturas e acompanhe a disponibilidade operacional
        </span>
      </div>

      {/* formulario de criacao em tom pastel azul */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          backgroundColor: '#f0f7ff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #dbeafe',
          marginBottom: '22px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            Viatura / Identificação
          </label>
          <input
            type="text"
            placeholder="Ex: USA-04"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onFocus={() => setFocoCampo('nome')}
            onBlur={() => setFocoCampo(null)}
            style={estiloCampo('nome')}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            Tipo de Suporte
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            onFocus={() => setFocoCampo('tipo')}
            onBlur={() => setFocoCampo(null)}
            style={estiloCampo('tipo')}
          >
            <option value="Suporte Básico" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              Suporte Básico (USB)
            </option>
            <option value="Suporte Avançado" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              Suporte Avançado (USA)
            </option>
            <option value="Motolância" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              Motolância (MOTO)
            </option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            Base Operacional
          </label>
          <input
            type="text"
            placeholder="Ex: Aldeota"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            onFocus={() => setFocoCampo('base')}
            onBlur={() => setFocoCampo(null)}
            style={estiloCampo('base')}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '9px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
            }}
          >
            Cadastrar Unidade
          </button>
        </div>
      </form>

      {/* tabela de viaturas cadastradas */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #dbeafe', color: '#0369a1', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', backgroundColor: '#f0f7ff' }}>
              <th style={{ padding: '10px 12px' }}>Viatura</th>
              <th style={{ padding: '10px 12px' }}>Tipo</th>
              <th style={{ padding: '10px 12px' }}>Base</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {unidades.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Nenhuma viatura registrada no sistema.
                </td>
              </tr>
            ) : (
              unidades.map((u) => {
                const isDisponivel = u.status === 'DISPONÍVEL';
                return (
                  <tr key={u.id || u.nome} style={{ borderBottom: '1px solid #f0f7ff' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{u.nome}</td>
                    <td style={{ padding: '12px', color: '#334155' }}>{u.tipo}</td>
                    <td style={{ padding: '12px', color: '#334155' }}>{u.base}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          backgroundColor: isDisponivel ? '#ecfdf5' : '#e0f2fe',
                          color: isDisponivel ? '#065f46' : '#0369a1',
                          border: `1px solid ${isDisponivel ? '#a7f3d0' : '#bae6fd'}`,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isDisponivel ? '#10b981' : '#0284c7',
                            display: 'inline-block',
                          }}
                        />
                        {u.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}