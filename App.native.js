import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { navigationRef } from "./src/navigation/RootNavigation";
import Header from "./src/components/Header.app";
import Bottom from "./src/components/Bottom"
import Login from "./src/app/Login";
import SignUp from "./src/app/SignUp";
import Find from "./src/app/Find"
import Change from "./src/app/Change"
import Schedule from "./src/app/Schedule";
import Form from "./src/app/Form"
import Setting from "./src/app/Setting"
import Status from "./src/app/Status/Status";
import StatusContent from "./src/app/Status/Content";
import Request from "./src/app/Request/Request";
import RequestContent from "./src/app/Request/Content";


const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Find" component={Find} />
      <Stack.Screen name="Change" component={Change} />
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="Form" component={Form} />
      <Stack.Screen name="Setting" component={Setting} />
      <Stack.Screen name="Status" component={Status} />
      <Stack.Screen name="StatusContent" component={StatusContent} />
      <Stack.Screen name="Request" component={Request} />
      <Stack.Screen name="RequestContent" component={RequestContent} />
      <Stack.Screen name="Main" component={Bottom} />
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
