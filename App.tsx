import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Zap, BarChart3, Receipt, Sliders } from 'lucide-react-native';

// Screen Imports
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { BillingScreen } from './src/screens/BillingScreen';
import { ControlScreen } from './src/screens/ControlScreen';
import { TelemetryProvider } from './src/context/TelemetryContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <TelemetryProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#090d16',
                borderTopColor: '#1e293b',
                height: 65,
                paddingBottom: 10,
                paddingTop: 8,
              },
              tabBarActiveTintColor: '#38bdf8',
              tabBarInactiveTintColor: '#64748b',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
            }}
          >
            <Tab.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                tabBarLabel: 'Live Power',
                tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{
                tabBarLabel: 'Analytics',
                tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Billing"
              component={BillingScreen}
              options={{
                tabBarLabel: 'Billing & ROI',
                tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Controls"
              component={ControlScreen}
              options={{
                tabBarLabel: 'Controls',
                tabBarIcon: ({ color, size }) => <Sliders color={color} size={size} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </TelemetryProvider>
    </SafeAreaProvider>
  );
}
