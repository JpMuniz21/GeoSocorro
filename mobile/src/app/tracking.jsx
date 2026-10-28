import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRequest } from '../context/RequestContext';

const timeline = [
  { title: 'Chamado recebido', text: 'Sua solicitação foi registrada.', active: true },
  { title: 'Em análise pela Central', text: 'A Central está validando as informações.', active: true },
  { title: 'Unidade notificada', text: 'A equipe mais próxima será acionada.', active: false },
  { title: 'Equipe a caminho', text: 'Você receberá uma atualização.', active: false },
  { title: 'Atendimento finalizado', text: '', active: false },
];

export default function TrackingScreen() {
  const { request, protocol, resetRequest } = useRequest();
  const protocolId = protocol?.id || '—';

  function startNewRequest() {
    resetRequest();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}><Text style={styles.check}>✓</Text></View>
        <Text style={styles.title}>Chamado enviado!</Text>
        <Text style={styles.subtitle}>A Central recebeu sua solicitação e vai iniciar a triagem.</Text>

        <View style={styles.protocolCard}>
          <View style={styles.protocolSymbol}><Text style={styles.protocolSymbolText}>✚</Text></View>
          <View><Text style={styles.protocolLabel}>OCORRÊNCIA</Text><Text style={styles.protocol}>#{protocolId}</Text><Text style={styles.protocolType}>{request.tipo?.replaceAll('_', ' ') || 'Solicitação de ajuda'}</Text></View>
          {protocol?.id?.startsWith?.('SIM-') ? <Text style={styles.demoBadge}>DEMO</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Acompanhamento</Text>
        <View style={styles.timeline}>
          {timeline.map((item, index) => (
            <View key={item.title} style={styles.timelineItem}>
              <View style={styles.rail}><View style={[styles.dot, item.active && styles.dotActive]} />{index < timeline.length - 1 ? <View style={[styles.line, item.active && styles.lineActive]} /> : null}</View>
              <View style={styles.timelineCopy}><Text style={[styles.timelineTitle, item.active && styles.timelineTitleActive]}>{item.title}</Text>{item.text ? <Text style={styles.timelineText}>{item.text}</Text> : null}</View>
            </View>
          ))}
        </View>

        <View style={styles.addressCard}><Text style={styles.addressLabel}>LOCAL INFORMADO</Text><Text style={styles.address}>{request.rua || 'Endereço da ocorrência'}{request.numero ? `, ${request.numero}` : ''}</Text><Text style={styles.addressSub}>{request.bairro} · {request.cidade}/{request.estado}</Text></View>
      </ScrollView>
      <View style={styles.footer}><Pressable onPress={startNewRequest} style={styles.button}><Text style={styles.buttonText}>Voltar ao início</Text></Pressable></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 24, paddingTop: 42, paddingBottom: 105 }, successIcon: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#EE2636', alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: '#EE2636', shadowOpacity: 0.25, shadowRadius: 14, elevation: 5 }, check: { color: '#FFFFFF', fontSize: 37, fontWeight: '800' },
  title: { textAlign: 'center', color: '#132238', fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { textAlign: 'center', color: '#68758A', fontSize: 14, lineHeight: 21, marginTop: 8, paddingHorizontal: 16 },
  protocolCard: { marginTop: 27, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EAF0', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#1B2A3D', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, protocolSymbol: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF0F2', justifyContent: 'center', alignItems: 'center' }, protocolSymbolText: { color: '#EE2636', fontSize: 21, fontWeight: '800' }, protocolLabel: { color: '#8895A7', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }, protocol: { color: '#18263A', fontSize: 17, fontWeight: '800', marginTop: 2 }, protocolType: { color: '#69778C', fontSize: 11, marginTop: 2, textTransform: 'capitalize' }, demoBadge: { marginLeft: 'auto', color: '#C98708', backgroundColor: '#FFF5D6', overflow: 'hidden', borderRadius: 8, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '800' },
  sectionTitle: { color: '#1B2A3D', fontSize: 15, fontWeight: '800', marginTop: 27, marginBottom: 15 }, timeline: { gap: 0 }, timelineItem: { flexDirection: 'row', minHeight: 63 }, rail: { width: 27, alignItems: 'center' }, dot: { width: 12, height: 12, borderRadius: 7, borderWidth: 2, borderColor: '#D8DEE8', backgroundColor: '#FFFFFF', zIndex: 1 }, dotActive: { backgroundColor: '#EE2636', borderColor: '#EE2636' }, line: { position: 'absolute', top: 12, bottom: -1, width: 2, backgroundColor: '#E1E6ED' }, lineActive: { backgroundColor: '#F9A1A9' }, timelineCopy: { flex: 1, paddingBottom: 15 }, timelineTitle: { color: '#7D899B', fontSize: 14, fontWeight: '700' }, timelineTitleActive: { color: '#1A2A3E' }, timelineText: { color: '#7D899B', fontSize: 12, marginTop: 4, lineHeight: 17 },
  addressCard: { marginTop: 9, backgroundColor: '#F7F9FC', borderRadius: 14, padding: 15 }, addressLabel: { color: '#8290A2', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }, address: { color: '#25354A', fontSize: 14, fontWeight: '800', marginTop: 7 }, addressSub: { color: '#6F7D91', fontSize: 12, marginTop: 4 }, footer: { padding: 16, borderTopWidth: 1, borderColor: '#EEF1F5' }, button: { minHeight: 53, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EE2636', borderRadius: 14 }, buttonText: { color: '#D91D2C', fontWeight: '800', fontSize: 14 },
});
