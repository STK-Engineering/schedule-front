import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } 
  from "react-native-safe-area-context";
import { navigationRef } from "./src/navigation/RootNavigation";
import Login from "./src/pages/Login";
import Sidebar from "./src/components/Sidebar";
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
      <Stack.Screen
        name="Find"
        component={Find}
        options={{ sidebarDisabled: true }}
      />
      <Stack.Screen
        name="Change"
        component={Change}
        options={{ sidebarDisabled: true }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ sidebarDisabled: true }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{ sidebarDisabled: true }}
      />
      <Stack.Screen
        name="Schedule"
        component={Schedule}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="Status"
        component={Status}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="StatusContent"
        component={StatusContent}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="RequestContent"
        component={RequestContent}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="Form"
        component={Form}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="Request"
        component={Request}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="Setting"
        component={Setting}
        options={{ sidebarDisabled: false }}
      />
      <Stack.Screen
        name="Application"
        component={Application}
        options={{ sidebarDisabled: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isSidebarDisabled, setIsSidebarDisabled] = useState(true);

  useEffect(() => {
    if (!navigationRef.isReady()) return;

    const unsubscribe = navigationRef.addListener("state", () => {
      const route = navigationRef.getCurrentRoute();
      const options = route?.params ?? {};

      setIsSidebarDisabled(options.sidebarDisabled === true);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          const route = navigationRef.getCurrentRoute();
          const options = route?.params ?? {};
          setIsSidebarDisabled(options.sidebarDisabled === true);
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Header />

          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ width: 350, position: "relative" }}>
              {isSidebarDisabled && (
                <View
                  style={{
                    position: "absolute",
                    backgroundColor: "rgba(255, 255, 255, 0.59)",
                    zIndex: 1000,
                    height: "100%",
                    width: "100%",
                  }}
                />
              )}
              <Sidebar />
            </View>

            <View style={{ flex: 1 }}>
              <MainNavigator />
            </View>
          </View>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
