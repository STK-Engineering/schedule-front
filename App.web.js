import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, SafeAreaView, Text, useWindowDimensions } from "react-native";
import { navigationRef } from "./src/navigation/RootNavigation";
import { AuthContext } from "./src/context/AuthContext";
import { LeaveBalanceProvider } from "./src/context/LeaveBalanceContext";
import Header from "./src/components/Header";
import Sidebar from "./src/components/Sidebar";

import Login from "./src/web/Login";
import SignUp from "./src/web/SignUp";
import Find from "./src/web/Find";
import Change from "./src/web/Change";
import PasswordChange from "./src/web/PasswordChange";
import Home from "./src/web/Home";
import Schedule from "./src/web/Schedule";

import LeaveStatus from "./src/web/leaves/status/Status";
import LeaveStatusContent from "./src/web/leaves/status/Content";
import LeaveRequest from "./src/web/leaves/request/Request";
import LeaveRequestContent from "./src/web/leaves/request/Content";
import LeaveForm from "./src/web/leaves/Form";
import LeaveEdit from "./src/web/leaves/status/Edit"
import LeaveApplication from "./src/web/leaves/Application";

import OverTimeStatusContent from "./src/web/overtime/status/Content";
import OverTimeStatus from "./src/web/overtime/status/Status";
import OverTimeRequest from "./src/web/overtime/request/Request";
import OverTimeRequestContent from "./src/web/overtime/request/Content";
import OverTimeForm from "./src/web/overtime/Form";
import OverTimeEdit from "./src/web/overtime/status/Edit"
import OverTimeApplication from "./src/web/overtime/Application";

import DepartmentLeave from "./src/web/manage/DepartmentLeave";
import Setting from "./src/web/manage/Setting";
import ApprovalLine from "./src/web/manage/approval/ApprovalLine";
import ApprovalLineContent from "./src/web/manage/approval/ApprovalLineContent";

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
      initialRouteName="Schedule"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="PasswordChange" component={PasswordChange} />

      <Stack.Screen name="LeaveStatus" component={LeaveStatus} />
      <Stack.Screen name="LeaveStatusContent" component={LeaveStatusContent} />
      <Stack.Screen name="LeaveRequest" component={LeaveRequest} />
      <Stack.Screen name="LeaveRequestContent" component={LeaveRequestContent} />
      <Stack.Screen name="LeaveEdit" component={LeaveEdit} />
      <Stack.Screen name="LeaveForm" component={LeaveForm} />
      <Stack.Screen name="LeaveApplication" component={LeaveApplication} />

      <Stack.Screen name="OverTimeStatus" component={OverTimeStatus} />
      <Stack.Screen name="OverTimeStatusContent" component={OverTimeStatusContent} />
      <Stack.Screen name="OverTimeRequest" component={OverTimeRequest} />
      <Stack.Screen name="OverTimeRequestContent" component={OverTimeRequestContent} />
      <Stack.Screen name="OverTimeEdit" component={OverTimeEdit} />
      <Stack.Screen name="OverTimeForm" component={OverTimeForm} />
      <Stack.Screen name="OverTimeApplication" component={OverTimeApplication} />

      <Stack.Screen name="DepartmentLeave" component={DepartmentLeave} />
      <Stack.Screen name="Setting" component={Setting} />
      <Stack.Screen name="ApprovalLine" component={ApprovalLine} />
      <Stack.Screen name="ApprovalLineContent" component={ApprovalLineContent} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 800;

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <LeaveBalanceProvider>
        <NavigationContainer ref={navigationRef}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View
              style={{
                zIndex: 10,
                elevation: 10,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Header
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: isMobile ? "column" : "row",
                backgroundColor: "#FFFFFF",
                zIndex: 0,
              }}
            >
              {!isMobile ? (
                <View
                  style={{
                    overflow: "visible",
                    zIndex: 20,
                  }}
                >
                  <Sidebar
                    collapsed={isSidebarCollapsed}
                    onRequestClose={() => setIsSidebarCollapsed(true)}
                  />
                </View>
              ) : null}

              <View
                style={{ flex: 1, backgroundColor: "#F3F6FB", zIndex: 0 }}
              >
                {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
              </View>
            </View>
            <View
              style={{
                height: 25,
                borderTopWidth: 1,
                borderColor: "#E2E8F0",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text style={{ color: "#64748B", fontSize: 12 }}>
                Copyright © STK Engineering All Rights Reserved.
              </Text>
            </View>
          </SafeAreaView>
        </NavigationContainer>
      </LeaveBalanceProvider>
    </AuthContext.Provider>
  );
}
