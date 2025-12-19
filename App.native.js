import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { navigationRef } from "./src/navigation/RootNavigation";
import Login from "./src/pages/Login";
import Header from "./src/components/Header";
import Schedule from "./src/pages/Schedule";
import Status from "./src/pages/Status/Status";
import Form from "./src/pages/Form";
import SignUp from "./src/pages/SignUp";
import Find from "./src/pages/Find";
import Change from "./src/pages/Change";
import Request from "./src/pages/Request/Request";
import StatusContent from "./src/pages/Status/Content";
import RequestContent from "./src/pages/Request/Content";
import Setting from "./src/pages/Setting";
import Application from "./src/pages/Application";

const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Find" component={Find} />
      <Stack.Screen name="Change" component={Change} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="Status" component={Status} />
      <Stack.Screen name="StatusContent" component={StatusContent} />
      <Stack.Screen name="RequestContent" component={RequestContent} />
      <Stack.Screen name="Form" component={Form} />
      <Stack.Screen name="Request" component={Request} />
      <Stack.Screen name="Setting" component={Setting} />
      <Stack.Screen name="Application" component={Application} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header />
          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <MainNavigator />
            </View>
          </View>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
