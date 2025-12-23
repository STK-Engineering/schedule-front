import { useState } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { navigationRef } from "./src/navigation/RootNavigation";

import Sidebar from "./src/components/Sidebar";
import Header from "./src/components/Header";

import Login from "./src/web/Login";
import SignUp from "./src/web/SignUp";
import Find from "./src/web/Find";
import Change from "./src/web/Change";
import Schedule from "./src/web/Schedule";
import Status from "./src/web/Status/Status";
import StatusContent from "./src/web/Status/Content";
import Request from "./src/web/Request/Request";
import RequestContent from "./src/web/Request/Content";
import Form from "./src/web/Form";
import Application from "./src/web/Application";
import Setting from "./src/web/Setting";

const AuthStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="SignUp" component={SignUp} />
      <AuthStack.Screen name="Find" component={Find} />
      <AuthStack.Screen name="Change" component={Change} />
    </AuthStack.Navigator>
  );
}

const MainStack = createStackNavigator();

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Schedule" component={Schedule} />
      <MainStack.Screen name="Status" component={Status} />
      <MainStack.Screen name="StatusContent" component={StatusContent} />
      <MainStack.Screen name="Request" component={Request} />
      <MainStack.Screen name="RequestContent" component={RequestContent} />
      <MainStack.Screen name="Form" component={Form} />
      <MainStack.Screen name="Application" component={Application} />
      <MainStack.Screen name="Setting" component={Setting} />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header />

          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ width: 350 }}>
              <View style={{ width: 350, position: "relative" }}>
                {isLoggedIn ? (
                  <></>
                ) : (
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
                <View />
                <Sidebar />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
            </View>
          </View>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
