import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import FlowHeader from '../components/FlowHeader';
import { useRequest } from '../context/RequestContext';
import { geoSocorroApi } from '../services/geoSocorroApi';

function DetailRow({ label, value, onPress }) {
  return <Pressable onPress={onPress} style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value} ›</Text></Pressable>;
}

export default function DetailsScreen() {
  const { request, updateRequest, setProtocol } = useRequest();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setSending(true);
    try {
      const result = await geoSocorroApi.createOccurrence({
        ...request,
        origem: 'MOBILE_USUARIO',
        status: 'PENDENTE',
      });
      setProtocol(result.ocorrencia);
      router.replace('/tracking');
    } catch (err) {
      setError(err.message || 'Não foi possível enviar seu chamado. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FlowHeader step={3} />
        <Text style={styles.title}>Conte o que aconteceu</Text>
        <Text style={styles.subtitle}>Descreva a situação com o máximo de detalhes possível.</Text>

        <TextInput
          value={request.descricao}
          onChangeText={(descricao) => updateRequest({ descricao })}
          placeholder="Ex.: Pessoa passou mal e não está respondendo. Respiração fraca."
          placeholderTextColor="#8B97A8"
          multiline
          maxLength={500}
          textAlignVertical="top"
          style={styles.textarea}
        />
        <Text style={styles.counter}>{request.descricao.length}/500</Text>

        <Text style={styles.sectionTitle}>Informações adicionais</Text>
        <View style={styles.infoCard}>
          <DetailRow label="Quantas vítimas?" value={request.vitimas} onPress={() => updateRequest({ vitimas: request.vitimas === '1' ? '2+' : '1' })} />
          <View style={styles.switchRow}><Text style={styles.detailLabel}>Há risco no local?</Text><Switch value={request.riscoLocal} onValueChange={(riscoLocal) => updateRequest({ riscoLocal })} trackColor={{ false: '#DCE3EC', true: '#FF9DA6' }} thumbColor={request.riscoLocal ? '#EE2636' : '#FFFFFF'} /></View>
          <View style={styles.switchRow}><Text style={styles.detailLabel}>A vítima está consciente?</Text><Switch value={request.consciente} onValueChange={(consciente) => updateRequest({ consciente })} trackColor={{ false: '#DCE3EC', true: '#FF9DA6' }} thumbColor={request.consciente ? '#EE2636' : '#FFFFFF'} /></View>
        </View>

        <Text style={styles.sectionTitle}>Ponto de referência</Text>
        <TextInput
          value={request.referencia}
          onChangeText={(referencia) => updateRequest({ referencia })}
          placeholder="Ex.: Próximo à praça central"
          placeholderTextColor="#8B97A8"
          style={styles.referenceInput}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.sendButton, sending && styles.sending]} disabled={sending} onPress={submit}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.sendText}>Enviar chamado</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 24, paddingBottom: 112 }, title: { color: '#132238', fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { color: '#68758A', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  textarea: { minHeight: 128, borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 14, padding: 14, color: '#16263A', fontSize: 14, lineHeight: 21 }, counter: { color: '#8A97A8', fontSize: 11, textAlign: 'right', marginTop: 6 },
  sectionTitle: { color: '#1B2A3D', fontSize: 14, fontWeight: '800', marginTop: 22, marginBottom: 10 }, infoCard: { borderWidth: 1, borderColor: '#E5EAF0', borderRadius: 14, overflow: 'hidden' }, detailRow: { minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEF1F5' }, switchRow: { minHeight: 57, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEF1F5' }, detailLabel: { color: '#35465B', fontSize: 13, fontWeight: '600' }, detailValue: { color: '#66758A', fontSize: 13, fontWeight: '700' },
  referenceInput: { minHeight: 52, borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 13, paddingHorizontal: 14, color: '#16263A', fontSize: 14 }, error: { color: '#C81E2D', marginTop: 10, fontSize: 12 }, footer: { padding: 16, borderTopWidth: 1, borderColor: '#EEF1F5', backgroundColor: '#FFFFFF' }, sendButton: { minHeight: 54, borderRadius: 14, backgroundColor: '#EE2636', justifyContent: 'center', alignItems: 'center' }, sending: { opacity: 0.7 }, sendText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
