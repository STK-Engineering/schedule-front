import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import reqeust from "../../assets/icon/request.png";
import setting from "../../assets/icon/setting.png";
import api from "../api/api";

export default function Sidebar() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(null);

  const [leave, setLeave] = useState({
    total: 0,
    used: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchLeaveSummary = async () => {
      try {
        setLoading(true);

        const res = await api.get("/balances");
        const data = res.data;

        if (!mounted) return;

        setLeave({
          total: Number(data.totalDays ?? 0),
          used: Number(data.usedDays ?? 0),
          remaining: Number(data.remainingDays ?? 0),
        });
      } catch (e) {
        console.log(
          "leave fetch error:",
          e?.response?.status,
          e?.response?.data
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchMe = async () => {
      try {
        const res = await api.get("/employees/me");
        const data = res.data;

        if (!mounted) return;

        setRole(String(data?.role ?? "").toLowerCase());
        setIsLoggedOut(false);
      } catch (e) {
        console.log("me fetch error:", e?.response?.status, e?.response?.data);
        if (!mounted) return;

        setRole(null);
        setIsLoggedOut(true);
      }
    };

    fetchLeaveSummary();
    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  const canSeeRequest = role === "admin" || role === "manager";
  const canSeeManage = role === "admin";

  return (
    <View style={styles.container}>
      {/* 버튼 */}
      <View style={styles.topButtonsWrap}>
        <TouchableOpacity
          style={styles.leftButton}
          onPress={() => navigation.navigate("Form")}
          disabled={isLoggedOut}
        >
          <Text style={styles.topButtonText}>연차 쓰기</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => navigation.navigate("Status")}
          disabled={isLoggedOut}
        >
          <Text style={styles.topButtonText}>진행 상황</Text>
        </TouchableOpacity>
      </View>

      {/* 달력 */}
      <View style={styles.calendarWrap}>
        <Calendar
          style={{ height: 350 }}
          onDayPress={(day) => {
            if (isLoggedOut) return;
            setSelectedDate(day.dateString);

            navigation.navigate("Schedule", {
              date: day.dateString,
              mode: "day",
            });
          }}
          markedDates={
            selectedDate
              ? {
                  [selectedDate]: { selected: true },
                }
              : undefined
          }
        />
      </View>

      {/* 연차 조회 */}
      <View>
        <View style={styles.leaveHeader}>
          <Text style={styles.leaveHeaderText}>연차 조회</Text>
        </View>

        <View style={styles.leaveBody}>
          <View style={styles.leaveCol}>
            <Text>총 연차</Text>
            <Text style={styles.leaveValue}>
              {loading ? "-" : `${leave.total}일`}
            </Text>
          </View>

          <View style={styles.leaveVLine} />

          <View style={styles.leaveCol}>
            <Text>사용 일수</Text>
            <Text style={styles.leaveValue}>
              {loading ? "-" : `${leave.used}일`}
            </Text>
          </View>

          <View style={styles.leaveVLine} />

          <View style={styles.leaveCol}>
            <Text>잔여 일수</Text>
            <Text style={styles.leaveValue}>
              {loading ? "-" : `${leave.remaining}일`}
            </Text>
          </View>
        </View>

        {canSeeRequest && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate("Request")}
            disabled={isLoggedOut}
          >
            <Image source={reqeust} style={{ width: 20, height: 20 }} />
            <Text style={styles.menuBtnText}>요청 현황</Text>
          </TouchableOpacity>
        )}

        {canSeeManage && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate("Manage")}
            disabled={isLoggedOut}
          >
            <Image source={setting} style={{ width: 20, height: 20 }} />
            <Text style={styles.menuBtnText}>신청서 / 계정 관리</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoggedOut && (
        <View style={styles.lockOverlay} pointerEvents="auto">
          <Text style={styles.lockText}>로그인 후 이용 가능합니다</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 350,
    backgroundColor: "white",
    borderRightWidth: 1,
    borderColor: "#D4D4D4",
    paddingVertical: 20,
    alignItems: "center",
    gap: 10,
    position: "relative", 
  },

  topButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  leftButton: {
    backgroundColor: "#305685",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightButton: {
    backgroundColor: "#305685",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  topButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },

  divider: {
    width: 1,
    backgroundColor: "#ccc",
    height: 40,
    position: "absolute",
  },

  calendarWrap: {
    width: 300,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "white",
    overflow: "hidden",
  },

  leaveHeader: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#305685",
    paddingVertical: 12,
    paddingHorizontal: 115,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  leaveHeaderText: { fontSize: 18, fontWeight: "bold", color: "white" },

  leaveBody: {
    backgroundColor: "white",
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    flexDirection: "row",
    gap: 23,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 60,
  },
  leaveCol: { alignItems: "center", gap: 5 },
  leaveValue: { fontSize: 18 },
  leaveVLine: {
    width: 1,
    backgroundColor: "rgba(213, 213, 213, 0.80)",
    height: "100%",
  },

  menuBtn: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#305685",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 13,
    flexDirection: "row",
    gap: 20,
    marginBottom: 10,
  },
  menuBtnText: { color: "#305685", fontSize: 16, fontWeight: 600 },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.83)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  lockText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000ff",
  },
});
