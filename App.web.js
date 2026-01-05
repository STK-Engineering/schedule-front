import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, SafeAreaView, Platform, Dimensions } from "react-native";
import { navigationRef } from "./src/navigation/RootNavigation";
import { AuthContext } from "./src/context/AuthContext";
import Login from "./src/web/Login";
import SignUp from "./src/web/SignUp";
import Find from "./src/web/Find";
import Change from "./src/web/Change";

import Sidebar from "./src/components/Sidebar";
import Header from "./src/components/Header";

import Schedule from "./src/web/Schedule";
import Status from "./src/web/Status/Status";
import StatusContent from "./src/web/Status/Content";
import Form from "./src/web/Form";
import Application from "./src/web/Manage/Application";
import Setting from "./src/web/Manage/Setting";
import Manage from "./src/web/Manage";
import Request from "./src/web/Request/Request";
import RequestContent from "./src/web/Request/Content";
import Edit from "./src/web/Status/Edit"

const Stack = createStackNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="Find" component={Find} />
      <Stack.Screen name="Change" component={Change} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Form"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="Status" component={Status} />
      <Stack.Screen name="StatusContent" component={StatusContent} />
      <Stack.Screen name="Edit" component={Edit} />
      <Stack.Screen name="Application" component={Application} />
      <Stack.Screen name="Setting" component={Setting} />
      <Stack.Screen name="Form" component={Form} />
      <Stack.Screen name="Request" component={Request} />
      <Stack.Screen name="RequestContent" component={RequestContent} />
      <Stack.Screen name="Manage" component={Manage} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header />

          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ width: 350 }}>
              <Sidebar />
            </View>

            <View style={{ flex: 1 }}>
              {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
            </View>
          </View>
        </SafeAreaView>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
