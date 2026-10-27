import type React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Pasangan ikon: [aktif, tidak aktif]
const ICONS: Record<string, [IoniconName, IoniconName]> = {
  index:      ['home',               'home-outline'],
  riwayat:    ['time',              'time-outline'],
  pengaturan: ['settings',           'settings-outline'],
  tentang:    ['information-circle', 'information-circle-outline'],
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index"      options={{ title: 'Beranda',          tabBarLabel: 'Beranda' }} />
      <Tabs.Screen name="riwayat"    options={{ title: 'Favorit & Riwayat', tabBarLabel: 'Riwayat' }} />
      <Tabs.Screen name="pengaturan" options={{ title: 'Pengaturan',        tabBarLabel: 'Pengaturan' }} />
      <Tabs.Screen name="tentang"    options={{ title: 'Tentang',           tabBarLabel: 'Tentang' }} />
    </Tabs>
  );
}