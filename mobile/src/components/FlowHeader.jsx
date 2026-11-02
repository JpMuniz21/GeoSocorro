import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function FlowHeader({ step }) {
  return (
    <View style={styles.container}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <View style={styles.steps}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.step, item <= step && styles.stepActive]} />
        ))}
      </View>
      <Text style={styles.stepText}>{step}/3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#F7F8FA' },
  backIcon: { color: '#132238', fontSize: 34, lineHeight: 36, marginTop: -3 },
  steps: { flex: 1, flexDirection: 'row', gap: 5 },
  step: { height: 4, flex: 1, borderRadius: 4, backgroundColor: '#E3E7ED' },
  stepActive: { backgroundColor: '#EE2636' },
  stepText: { fontSize: 12, fontWeight: '700', color: '#748093' },
});
