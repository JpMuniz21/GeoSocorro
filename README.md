# 🚑 GeoSocorro — Módulo de Resolução Geoespacial e Triagem de Emergências

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![API](https://img.shields.io/badge/Integration-ViaCEP%20REST-00599C)](https://viacep.com.br/)
[![Status](https://img.shields.io/badge/Release-v1.2-brightgreen)](https://github.com/)

---

## 📌 Visão Geral do Projeto

O **GeoSocorro** é uma plataforma distribuída concebida para atuar na triagem ágil e no despacho crítico de serviços de socorro imediato (como SAMU e Defesa Civil). Em chamados de emergência sob estresse elevado, relatos verbais de logradouros costumam conter inconsistências ortográficas ou dados incompletos, impactando de forma severa o SLA (*Service Level Agreement*) de saída da viatura.

O módulo de integração resolve esse gargalo: a partir da entrada de um identificador postal estruturado de 8 dígitos (CEP), o sistema faz a resolução cadastral instantânea via **ViaCEP**, preenche os dados de logradouro, bairro, cidade e estado em tempo real e calcula o despacho automatizado com emissão de alerta para as bases do SAMU mais próximas.

---

## 🏗️ Arquitetura da Solução

O ecossistema implementa o padrão arquitetural de desacoplamento em camadas com um intermediário **BFF (Backend For Frontend)**[cite: 55]:

```text
      ┌─────────────────────────┐
      │  Terminal Web Regulação │ (React 19 + Vite)
      └────────────┬────────────┘
                   │ HTTP local:3000
                   ▼
┌───────────────────────────────────────┐       HTTPS       ┌──────────────────┐
│   Proxy Intermediário / BFF Express   │ ────────────────► │ API Pública      │
│   - Gestão de CORS restritiva         │ ◄──────────────── │ ViaCEP           │
│   - Timeout (3-5s) & Circuit Breaker  │  (Payload JSON)   └──────────────────┘
│   - Arquitetura Stateless (LGPD)      │
│   - Roteamento de Despacho            │
└──────────────────┬────────────────────┘
                   │ WebSockets / Push Notifications
                   ▼
      ┌─────────────────────────┐
      │ Equipe de Campo / Viatura│ (React Native)
      └─────────────────────────┘
```

1. **Terminal Web (React 19 + Vite):** Interface de mesa para o atendente/regulador, com sanitização em tempo real na borda, controle reativo de formulários e estados de loading visual[cite: 55, 56, 57].
2. **Terminal Móvel (React Native):** Aplicativo embarcado nos dispositivos móveis das viaturas para recebimento de alertas de despacho e orientações de rota em campo[cite: 55, 58].
3. **Backend Proxy / BFF (Node.js + Express):** Barreira de isolamento arquitetural que gerencia CORS, valida CEPs, implementa timeouts defensivos, repassa contratos estruturados e aciona o despacho socorrista[cite: 55, 57, 58, 60, 61].
4. **Provedor Externo (ViaCEP):** Serviço público de terceiro consumido estritamente via HTTPS[cite: 55, 58, 59].

---

## ⚙️ Especificação de Endpoints

### 1. Consulta e Resolução de CEP
* **Rota Interna:** `GET /cep/:cep`[cite: 58]
* **Host Local:** `http://localhost:3000`[cite: 58]
* **Comunicação Externa:** `GET [https://viacep.com.br/ws/](https://viacep.com.br/ws/){cep}/json/`[cite: 58]

#### Exemplo de Resposta de Sucesso (`HTTP 200 OK`):
```json
{
  "rua": "Avenida Washington Soares",
  "bairro": "Edson Queiroz",
  "cidade": "Fortaleza",
  "estado": "CE"
}
```

#### Tratamento de Erros Padronizado:
* **CEP Inexistente (`HTTP 404`):** Retornado quando a ViaCEP sinaliza `{ erro: true }`[cite: 59, 63].
* **Entrada Inválida (`HTTP 400`):** Rejeição na camada de validação se o CEP contiver formato diferente de 8 dígitos numéricos[cite: 56, 62].
* **Indisponibilidade / Timeout (`HTTP 502/504`):** Aborto defensivo após 3 a 5 segundos sem resposta do serviço externo[cite: 57, 63, 64].

### 2. Notificação e Roteamento de Despacho
* **Rota:** `POST /despacho/notificar`[cite: 58]
* **Protocolo:** HTTPS / REST e canal de eventos assíncrono (WebSockets / Push)[cite: 58]
* **Papel:** Recebe as coordenadas/logradouro confirmados, calcula o raio geográfico para o posto mais próximo e emite o alerta operacional[cite: 56, 57, 60, 61].

---

## 🔒 Conformidade com a LGPD e Segurança

* **Arquitetura Stateless & Zero-Persistence:** O backend em Express não persiste em disco, banco de dados ou logs de negócio o CEP consultado nem o endereço gerado, eliminando riscos de vazamento de dados residenciais[cite: 57, 60].
* **Trânsito Criptografado:** Tráfego de saída realizado integralmente sob túnel seguro TLS/HTTPS[cite: 60].
* **Governança de CORS:** Política explícita de origens autorizadas restringindo o consumo do proxy exclusivamente aos clientes legítimos[cite: 57, 60].
### 🧪 Matriz de Testes Principais

| ID | Cenário | Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CT01** | CEP válido e existente | `60110-000` | Campos Rua, Bairro, Cidade e Estado preenchidos automaticamente com os dados retornados pela ViaCEP. |
| **CT02** | CEP com formato inválido (menos de 8 dígitos ou caracteres não numéricos) | `6011a-00` | Nenhuma requisição é disparada ao proxy; entrada é sanitizada e/ou mensagem de formato inválido é exibida. |
| **CT03** | CEP válido em formato, porém inexistente na base dos Correios | `99999-999` | Proxy retorna erro de negócio; frontend exibe mensagem de "CEP não encontrado" (RF04). |
| **CT04** | Indisponibilidade da API ViaCEP (timeout simulado ou falha de rede) | Qualquer CEP válido, com serviço externo indisponível | Proxy retorna erro técnico padronizado; frontend exibe mensagem de falha temporária de serviço (RF04). |
| **CT05** | Edição manual pós-preenchimento | CEP válido seguido de alteração manual do campo Bairro | Alteração do usuário é preservada e não é sobrescrita automaticamente (RF05). |
| **CT06** | Limpeza dos campos | Apagar o CEP preenchido ou acionar botão de limpeza | Campos de Rua, Bairro, Cidade e Estado retornam ao estado vazio (RF06). |


🚀 Como Executar o Projeto Localmente

Pré-requisitos

Node.js (versão 18 ou superior)

Gerenciador de pacotes npm ou yarn


1. Inicializar o Backend Proxy

cd backend
npm install
npm run dev
# Servidor Express executando em http://localhost:3000


2. Inicializar o Terminal Web

cd frontend
npm install
npm run dev
# Aplicação React 19 disponível na porta padrão do Vite (ex: http://localhost:5173)


👥 Equipe de Desenvolvimento
Projeto acadêmico desenvolvido para a disciplina de Técnicas de Integração de Sistemas (2026):

Ivyna Sousa   
João Paulo Muniz   
Lorena Brilhante
Maria Mirella Lima

Orientação: Prof. Ronnison
