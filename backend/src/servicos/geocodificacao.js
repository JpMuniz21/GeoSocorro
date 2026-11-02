const { chamarExterno } = require('./chamarExterno');

const aguardar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function buscarPorCep(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    throw { status: 400, mensagem: 'CEP inválido. Deve conter exatamente 8 dígitos.' };
  }

  const dadosCep = await chamarExterno(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  if (dadosCep.erro) {
    throw { status: 404, mensagem: 'CEP não encontrado na base de dados.' };
  }

  const queryEndereco = `${dadosCep.logradouro}, ${dadosCep.bairro}, ${dadosCep.localidade} - ${dadosCep.uf}, Brasil`;
  const urlNominatim = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryEndereco)}&limit=1`;

  await aguardar(1000);

  const resultadoGeo = await chamarExterno(urlNominatim, {
    headers: { 'User-Agent': 'geoSocorro-App/1.0' }
  });

  let lat = null;
  let lng = null;

  if (Array.isArray(resultadoGeo) && resultadoGeo.length > 0) {
    lat = parseFloat(resultadoGeo[0].lat);
    lng = parseFloat(resultadoGeo[0].lon);
  }

  return {
    cep: dadosCep.cep,
    logradouro: dadosCep.logradouro,
    bairro: dadosCep.bairro,
    cidade: dadosCep.localidade,
    uf: dadosCep.uf,
    lat,
    lng
  };
}

module.exports = { buscarPorCep };