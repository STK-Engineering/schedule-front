import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, SafeAreaView } from "react-native";
import { navigationRef } from "./src/navigation/RootNavigation";
import Sidebar from "./src/components/Sidebar";
import Header from "./src/components/Header";
import Schedule from "./src/pages/Schedule";
import Status from "./src/pages/Status/Status";
import Content from "./src/pages/Status/Content";

const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="Status" component={Status} />
      <Stack.Screen name="Content" component={Content} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Sidebar />
            <MainNavigator  />
          </View>
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}
