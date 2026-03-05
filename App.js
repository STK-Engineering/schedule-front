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

import SchedulingForm from "./src/web/scheduling/Form";
import SchedulingList from "./src/web/scheduling/List";
import SchedulingContent from "./src/web/scheduling/Content";

const Stack = createStackNavigator();

const ROUTE_TITLE_MAP = {
  Login: "로그인",
  SignUp: "회원가입",
  Change: "비밀번호 재설정",
  PasswordChange: "비밀번호 변경",
  Home: "홈",
  Schedule: "일정",
  LeaveStatus: "내 휴가 신청 내역",
  LeaveStatusContent: "휴가 신청 상세",
  LeaveRequest: "휴가 결재 요청",
  LeaveRequestContent: "휴가 요청 상세",
  LeaveForm: "휴가 신청",
  LeaveEdit: "휴가 수정",
  LeaveApplication: "승인된 휴가",
  OverTimeStatus: "내 연장 근로 신청 내역",
  OverTimeStatusContent: "연장 근로 신청 상세",
  OverTimeRequest: "연장 근로 결재 요청",
  OverTimeRequestContent: "연장 근로 요청 상세",
  OverTimeForm: "연장 근로 신청",
  OverTimeEdit: "연장 근로 수정",
  OverTimeApplication: "승인된 연장 근로",
  DepartmentLeave: "연차 현황 관리",
  Setting: "사용자 관리",
  ApprovalLine: "결재 라인 관리",
  ApprovalLineContent: "결재 라인 상세",
  SchedulingForm: "일정 등록",
  SchedulingList: "일정 관리",
  SchedulingContent: "일정 상세",
};

const getActiveRouteName = (state) => {
  if (!state) return null;
  const route = state.routes?.[state.index ?? 0];
  if (!route) return null;
  return route.state ? getActiveRouteName(route.state) : route.name;
};

const setWebTitle = (routeName) => {
  if (typeof document === "undefined") return;
  const title = ROUTE_TITLE_MAP[routeName] ?? routeName ?? "STK";
  document.title = title;
};

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
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

      <Stack.Screen name="SchedulingForm" component={SchedulingForm} />
      <Stack.Screen name="SchedulingList" component={SchedulingList} />
      <Stack.Screen name="SchedulingContent" component={SchedulingContent} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { width } = useWindowDimensions();
  const isMobile = width < 800;

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <LeaveBalanceProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => setWebTitle(navigationRef.getCurrentRoute()?.name)}
          onStateChange={(state) => setWebTitle(getActiveRouteName(state))}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {isLoggedIn ? (
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
            ) : null}
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
            {isLoggedIn ? (
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
            ) : null}
          </SafeAreaView>
        </NavigationContainer>
      </LeaveBalanceProvider>
    </AuthContext.Provider>
  );
}
