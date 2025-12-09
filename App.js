import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, SafeAreaView } from 'react-native';
import Sidebar from './src/components/Sidebar';
import Calendar from "./src/pages/Calendar";

const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Calendar" component={Calendar} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Sidebar />
          <View style={{ flex: 1 }}>
            <MainNavigator />
          </View>
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}
