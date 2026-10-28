import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RequestProvider } from '../context/RequestContext';

export default function RootLayout() {
  return (
    <RequestProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </RequestProvider>
  );
}
