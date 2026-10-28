# GeoSocorro Mobile

Aplicativo React Native/Expo para o usuário solicitar ajuda e acompanhar uma ocorrência em ambiente acadêmico simulado.

## Fluxo

1. Informar localização por CEP ou localização simulada.
2. Selecionar o tipo de emergência.
3. Descrever o ocorrido e enviar a solicitação.
4. Acompanhar o status da ocorrência.

## Integração prevista

O app já possui uma camada em `src/services/geoSocorroApi.js`, preparada para consumir:

- `GET /cep/:cep`
- `POST /ocorrencias`

Enquanto essas rotas ainda não estiverem prontas no backend, o aplicativo usa dados de demonstração para manter o fluxo apresentável.

## Executar

```bash
cd mobile
npm install
npx expo start
```

Para um aparelho físico, configure `EXPO_PUBLIC_API_URL` com o IP da máquina que executa o backend.
