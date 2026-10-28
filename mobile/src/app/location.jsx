import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import FlowHeader from '../components/FlowHeader';
import { useRequest } from '../context/RequestContext';
import { geoSocorroApi } from '../services/geoSocorroApi';

export default function LocationScreen() {
  const { request, updateRequest } = useRequest();
  const [cep, setCep] = useState(request.cep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressReady, setAddressReady] = useState(Boolean(request.rua));

  async function searchCep() {
    setError('');
    setLoading(true);
    try {
      const address = await geoSocorroApi.lookupCep(cep);
      updateRequest(address);
      setCep(address.cep);
      setAddressReady(true);
    } catch (err) {
      setAddressReady(false);
      setError(err.message || 'Não foi possível consultar o CEP.');
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    // A geolocalização nativa entra quando a equipe configurar expo-location e a permissão do dispositivo.
    updateRequest({ ...request, rua: 'Localização atual simulada', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE' });
    setAddressReady(true);
    setError('');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FlowHeader step={1} />
        <Text style={styles.title}>Onde você está?</Text>
        <Text style={styles.subtitle}>Precisamos do local para enviar sua solicitação à Central.</Text>

        <View style={styles.mapCard}>
          <View style={styles.mapGrid} />
          <View style={styles.pinOuter}><View style={styles.pinInner} /></View>
          <Text style={styles.mapLabel}>Localização da ocorrência</Text>
        </View>

        <Pressable style={styles.locationButton} onPress={useCurrentLocation}>
          <Text style={styles.locationIcon}>⌖</Text>
          <Text style={styles.locationText}>Usar minha localização atual</Text>
        </Pressable>

        <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>ou informe seu CEP</Text><View style={styles.line} /></View>

        <Text style={styles.label}>CEP</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={cep}
            onChangeText={(value) => { setCep(geoSocorroApi.formatCep(value)); setAddressReady(false); }}
            placeholder="00000-000"
            placeholderTextColor="#9AA6B7"
            keyboardType="numeric"
            maxLength={9}
            style={styles.input}
          />
          <Pressable style={styles.searchButton} onPress={searchCep} disabled={loading}>
            {loading ? <ActivityIndicator color="#EE2636" /> : <Text style={styles.searchText}>Buscar</Text>}
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {addressReady ? (
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>ENDEREÇO ENCONTRADO</Text>
            <Text style={styles.addressText}>{request.rua || 'Localização atual'}</Text>
            <Text style={styles.addressSubtext}>{request.bairro} · {request.cidade}/{request.estado}</Text>
            <TextInput
              value={request.numero}
              onChangeText={(numero) => updateRequest({ numero })}
              placeholder="Número"
              placeholderTextColor="#9AA6B7"
              keyboardType="numeric"
              style={styles.numberInput}
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.continue, !addressReady && styles.disabled]} disabled={!addressReady} onPress={() => router.push('/emergency')}>
          <Text style={styles.continueText}>Continuar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 24, paddingBottom: 118 },
  title: { color: '#132238', fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#68758A', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  mapCard: { height: 178, backgroundColor: '#EDF2F4', borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5EAF0' },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.7, backgroundColor: '#E9F0EE', transform: [{ rotate: '-8deg' }] },
  pinOuter: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(238,38,54,0.18)', alignItems: 'center', justifyContent: 'center' },
  pinInner: { width: 22, height: 22, borderRadius: 12, backgroundColor: '#EE2636', borderColor: '#FFFFFF', borderWidth: 3 },
  mapLabel: { position: 'absolute', bottom: 13, color: '#65748A', fontSize: 12, fontWeight: '700' },
  locationButton: { marginTop: 14, minHeight: 52, borderRadius: 13, backgroundColor: '#FFF0F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  locationIcon: { color: '#EE2636', fontSize: 19 }, locationText: { color: '#D91D2C', fontWeight: '800', fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 21 }, line: { height: 1, backgroundColor: '#E6EAF0', flex: 1 }, dividerText: { color: '#78859A', fontSize: 12 },
  label: { color: '#334155', fontSize: 13, fontWeight: '800', marginBottom: 8 }, inputRow: { borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 13, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  input: { flex: 1, paddingHorizontal: 15, minHeight: 52, color: '#15233A', fontSize: 16, fontWeight: '600' }, searchButton: { paddingHorizontal: 15, minHeight: 52, alignItems: 'center', justifyContent: 'center' }, searchText: { color: '#D91D2C', fontSize: 13, fontWeight: '800' },
  error: { color: '#C81E2D', marginTop: 9, fontSize: 12 }, addressCard: { marginTop: 15, backgroundColor: '#F7F9FC', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF0' },
  addressLabel: { color: '#688097', fontWeight: '800', fontSize: 10, letterSpacing: 0.8 }, addressText: { color: '#16263A', fontWeight: '800', marginTop: 8, fontSize: 15 }, addressSubtext: { color: '#65748A', marginTop: 3, fontSize: 13 },
  numberInput: { marginTop: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 10, paddingHorizontal: 12, minHeight: 44, color: '#16263A' },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#EEF1F5', backgroundColor: '#FFFFFF' }, continue: { minHeight: 54, borderRadius: 14, backgroundColor: '#EE2636', justifyContent: 'center', alignItems: 'center' }, disabled: { backgroundColor: '#F2B7BD' }, continueText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
