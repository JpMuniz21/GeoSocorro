import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <Text style={styles.logo}>✚</Text>
        <Text style={styles.title}>Ajuda Rápida</Text>
        <Text style={styles.subtitle}>Solicite atendimento e acompanhe sua ocorrência em um só lugar.</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Ambiente de simulação</Text>
          <Text style={styles.noticeText}>Este aplicativo é acadêmico. Em uma emergência real, ligue 192.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/location')}>
          <Text style={styles.primaryIcon}>✚</Text>
          <Text style={styles.primaryText}>Solicitar ajuda</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/tracking')}>
          <Text style={styles.secondaryIcon}>◷</Text>
          <View>
            <Text style={styles.secondaryTitle}>Meus chamados</Text>
            <Text style={styles.secondaryText}>Acompanhe uma solicitação enviada</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { flex: 1.05, backgroundColor: '#15233A', paddingHorizontal: 30, justifyContent: 'flex-end', paddingBottom: 52, overflow: 'hidden' },
  glowOne: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#EE2636', opacity: 0.28, top: -130, right: -65 },
  glowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFFFF', opacity: 0.06, bottom: -90, left: -35 },
  logo: { color: '#FFFFFF', fontSize: 64, fontWeight: '800', marginBottom: 18 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: '#D8E0EC', fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 290 },
  panel: { flex: 0.95, padding: 24, justifyContent: 'center', gap: 15 },
  notice: { backgroundColor: '#FFF1F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFE0E3' },
  noticeTitle: { color: '#B91C2A', fontWeight: '800', fontSize: 13, marginBottom: 3 },
  noticeText: { color: '#7F2832', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 58, borderRadius: 16, backgroundColor: '#EE2636', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, shadowColor: '#EE2636', shadowOpacity: 0.24, shadowRadius: 12, elevation: 4 },
  primaryIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderColor: '#E5EAF0', borderWidth: 1 },
  secondaryIcon: { color: '#EE2636', fontSize: 24 },
  secondaryTitle: { color: '#18263A', fontSize: 15, fontWeight: '800' },
  secondaryText: { color: '#758195', fontSize: 12, marginTop: 2 },
  chevron: { marginLeft: 'auto', color: '#9AA6B7', fontSize: 25 },
});
