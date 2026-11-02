import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FlowHeader from '../components/FlowHeader';
import { useRequest } from '../context/RequestContext';

const emergencies = [
  { id: 'EMERGENCIA_MEDICA', icon: '♥', title: 'Emergência médica', text: 'Mal súbito, dor no peito, dificuldade para respirar' },
  { id: 'ACIDENTE_TRANSITO', icon: '▣', title: 'Acidente de trânsito', text: 'Colisões, atropelamentos ou vítimas na via' },
  { id: 'INCENDIO', icon: '♨', title: 'Incêndio', text: 'Fumaça, fogo ou risco de explosão' },
  { id: 'VIOLENCIA', icon: '♟', title: 'Violência', text: 'Agressões ou risco à vida' },
  { id: 'OUTROS', icon: '•••', title: 'Outros', text: 'Outra situação que requer ajuda' },
];

export default function EmergencyScreen() {
  const { request, updateRequest } = useRequest();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <FlowHeader step={2} />
        <Text style={styles.title}>Qual é a emergência?</Text>
        <Text style={styles.subtitle}>Selecione a opção que mais representa o que aconteceu.</Text>

        <View style={styles.list}>
          {emergencies.map((item) => {
            const selected = request.tipo === item.id;
            return (
              <Pressable key={item.id} onPress={() => updateRequest({ tipo: item.id })} style={[styles.card, selected && styles.cardSelected]}>
                <View style={[styles.iconBox, selected && styles.iconSelected]}><Text style={[styles.icon, selected && styles.iconTextSelected]}>{item.icon}</Text></View>
                <View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.text}</Text></View>
                {selected ? <View style={styles.radio}><View style={styles.radioDot} /></View> : <View style={styles.radioEmpty} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.continue, !request.tipo && styles.disabled]} disabled={!request.tipo} onPress={() => router.push('/details')}><Text style={styles.continueText}>Continuar</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 24, paddingBottom: 110 },
  title: { color: '#132238', fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { color: '#68758A', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 23 },
  list: { gap: 11 }, card: { minHeight: 76, padding: 13, borderRadius: 15, backgroundColor: '#F7F8FA', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'transparent' }, cardSelected: { backgroundColor: '#FFF2F3', borderColor: '#FF6A76' },
  iconBox: { width: 45, height: 45, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF1F5' }, iconSelected: { backgroundColor: '#FFE1E4' }, icon: { color: '#35465B', fontSize: 21, fontWeight: '800' }, iconTextSelected: { color: '#E42131' },
  cardCopy: { flex: 1 }, cardTitle: { color: '#18263A', fontWeight: '800', fontSize: 14 }, cardText: { color: '#738096', fontSize: 11, lineHeight: 16, marginTop: 3 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#EE2636', alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 9, height: 9, borderRadius: 6, backgroundColor: '#EE2636' }, radioEmpty: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#D6DDE7' },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#EEF1F5', backgroundColor: '#FFFFFF' }, continue: { minHeight: 54, borderRadius: 14, backgroundColor: '#EE2636', justifyContent: 'center', alignItems: 'center' }, disabled: { backgroundColor: '#F2B7BD' }, continueText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
