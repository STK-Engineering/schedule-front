import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native";
import { navigationRef } from "./src/navigation/RootNavigation";
import { AuthContext } from "./src/context/AuthContext";
import { LeaveBalanceProvider } from "./src/context/LeaveBalanceContext";
import Login from "./src/app/Login";
import SignUp from "./src/app/SignUp";
import Find from "./src/app/Find";
import Change from "./src/app/Change";
import Header from "./src/components/Header.app";

import Schedule from "./src/app/Schedule";
import Status from "./src/app/Status/Status";
import StatusContent from "./src/app/Status/Content";
import Form from "./src/app/Form";
import ManageApplication from "./src/app/Manage/Application";
import ManageDepartmentLeave from "./src/app/Manage/DepartmentLeave";
import ManageSetting from "./src/app/Manage/Setting";
import Request from "./src/app/Request/Request";
import RequestContent from "./src/app/Request/Content";
import Edit from "./src/app/Status/Edit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Schedule" component={Schedule} />
      <Tab.Screen name="Status" component={Status} />
      <Tab.Screen name="Form" component={Form} />
      <Tab.Screen name="Request" component={Request} />
      <Stack.Screen name="Manage" component={Manage} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="StatusContent" component={StatusContent} />
      <Stack.Screen name="Edit" component={Edit} />
      <Stack.Screen name="RequestContent" component={RequestContent} />
      <Stack.Screen name="Application" component={ManageApplication} />
      <Stack.Screen name="DepartmentLeave" component={ManageDepartmentLeave} />
      <Stack.Screen name="Setting" component={ManageSetting} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (mounted) setIsLoggedIn(!!token);
    };
    loadToken();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <LeaveBalanceProvider>
        <NavigationContainer ref={navigationRef}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <Header />
            {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
          </SafeAreaView>
        </NavigationContainer>
      </LeaveBalanceProvider>
    </AuthContext.Provider>
  );
}
