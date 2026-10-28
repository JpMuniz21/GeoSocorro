import { createContext, useContext, useMemo, useState } from 'react';

const RequestContext = createContext(null);

const initialRequest = {
  cep: '',
  rua: '',
  bairro: '',
  cidade: '',
  estado: '',
  numero: '',
  referencia: '',
  tipo: '',
  descricao: '',
  vitimas: '1',
  riscoLocal: false,
  consciente: true,
};

export function RequestProvider({ children }) {
  const [request, setRequest] = useState(initialRequest);
  const [protocol, setProtocol] = useState(null);

  const value = useMemo(
    () => ({
      request,
      protocol,
      updateRequest: (changes) => setRequest((current) => ({ ...current, ...changes })),
      setProtocol,
      resetRequest: () => {
        setRequest(initialRequest);
        setProtocol(null);
      },
    }),
    [request, protocol]
  );

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequest deve ser usado dentro de RequestProvider');
  return context;
}
