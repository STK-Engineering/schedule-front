import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, SafeAreaView, Platform, Dimensions } from "react-native";
import { navigationRef } from "./src/navigation/RootNavigation";
import Sidebar from "./src/components/Sidebar";
import Header from "./src/components/Header";
import Schedule from "./src/pages/Schedule";
import Status from "./src/pages/Status/Status";
import Content from "./src/pages/Status/Content";
import Form from "./src/pages/Form";
const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="Status" component={Status} />
      <Stack.Screen name="Content" component={Content} />
      <Stack.Screen name="Form" component={Form} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { width } = Dimensions.get("window");

  const isDesktop = Platform.OS === "web" && width >= 900;

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header />

        <View style={{ flex: 1, flexDirection: "row" }}>
          
          {isDesktop && (
            <View style={{ width: 350 }}>
              <Sidebar />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <MainNavigator />
          </View>
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}
