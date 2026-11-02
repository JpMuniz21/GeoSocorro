function calcularHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em quilómetros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2)); 
}

function ranquearUnidadesPorProximidade(latOcorrencia, lngOcorrencia, listaUnidades) {
  const ranqueadas = listaUnidades.map((unidade) => {
    const distanciaKm = calcularHaversine(latOcorrencia, lngOcorrencia, unidade.lat, unidade.lng);
    return {
      ...unidade,
      distanciaKm
    };
  });

  ranqueadas.sort((a, b) => a.distanciaKm - b.distanciaKm);

  return ranqueadas;
}

module.exports = { calcularHaversine, ranquearUnidadesPorProximidade };