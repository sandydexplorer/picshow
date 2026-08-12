import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SafeShowProvider } from './src/context/SafeShowContext';
import AppNavigator from './src/navigation/AppNavigator';

function RootApp() {
  const { checkOnboarded } = useAuth();
  useEffect(() => { checkOnboarded(); }, []);
  return <AppNavigator />;
}

export default function App() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <SafeShowProvider>
            <RootApp />
          </SafeShowProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
