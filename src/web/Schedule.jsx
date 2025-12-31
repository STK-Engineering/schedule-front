import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Calendar } from "react-native-big-calendar";
import api from "../api/api"
import department from "../../assets/icon/department.png";

function leaveTypeToTimeRange(leaveType) {
  switch (leaveType) {
    case "AM_HALF":
      return { startH: 9, startM: 0, endH: 14, endM: 0 };
    case "PM_HALF":
      return { startH: 14, startM: 0, endH: 18, endM: 0 };
    case "FULL": 
    case "ANNUAL":
    default:
      return { startH: 9, startM: 0, endH: 18, endM: 0 };
  }
}

function toDate(dateStr, h, m) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, 0);
}

function leaveToEvent(item) {
  const empName = item?.employee?.name ?? "이름없음";
  const deptName = item?.employee?.department?.name ?? "";
  const leaveType = item?.leaveType ?? "";
  const status = item?.leaveStatus ?? "";
  const reason = item?.reason ?? "";

  const { startH, startM, endH, endM } = leaveTypeToTimeRange(leaveType);

  const start = toDate(item.startDate, startH, startM);
  const end = toDate(item.endDate, endH, endM);

  const typeLabel =
    leaveType === "PM_HALF"
      ? "반차(오후)"
      : leaveType === "AM_HALF"
      ? "반차(오전)"
      : "연차";

  const title = `${empName}${deptName ? ` (${deptName})` : ""} - ${typeLabel}${
    reason ? ` / ${reason}` : ""
  }`;

  return {
    title,
    start,
    end,
    isMine: item?.isMine ?? false,
    raw: item, 
  };
}

export default function Schedule() {
  const [mode, setMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  const departments = useMemo(
    () => [
      "Management",
      "Sales&Marketing",
      "Engineering",
      "Coordinator",
      "Logistic&Warehouse",
      "IT/ISO",
    ],
    []
  );

  useEffect(() => {
    fetchLeaves();
  }, [selectedDept, onlyMine]);

  const toggleDept = (dept) => {
    setSelectedDept((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const getDeptLabel = () => {
    if (selectedDept.length === 0) return "전체";
    if (selectedDept.length === 1) return selectedDept[0];
    const [first, ...rest] = selectedDept;
    return `${first} 외 ${rest.length}`;
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves", {
        params: {
          departments: selectedDept,
          onlyMine,
        },
      });

      const formatted = (res.data ?? []).map(leaveToEvent);
      setEvents(formatted);
    } catch (e) {
      console.error("스케줄 불러오기 실패", e);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: 20,
        }}
      >
        <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
          <TouchableOpacity
            onPress={() => setDeptOpen(!deptOpen)}
            style={{
              width: 200,
              height: 40,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "white",
            }}
          >
            <Text numberOfLines={1}>부서: {getDeptLabel()}</Text>
            <Text>{deptOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {deptOpen && (
            <View
              style={{
                position: "absolute",
                width: 200,
                marginTop: 40,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "white",
              }}
            >
              {departments.map((dept) => {
                const isSelected = selectedDept.includes(dept);
                return (
                  <TouchableOpacity
                    key={dept}
                    onPress={() => toggleDept(dept)}
                    style={{
                      padding: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={department}
                      style={{ width: 18, height: 18, marginRight: 8 }}
                      resizeMode="contain"
                    />
                    <Text style={{ color: isSelected ? "#2563EB" : "#6B7280" }}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setOnlyMine((v) => !v)}
          style={{
            height: 40,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: "white",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text>{onlyMine ? "전체 일정 보기" : "내 일정만 보기"}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", margin: 10, gap: 5 }}>
          {["day", "week", "month"].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{
                backgroundColor: "white",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 10,
              }}
            >
              <Text>{m === "day" ? "일간" : m === "week" ? "주간" : "월간"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Calendar
          events={events}
          height={600}
          mode={mode}
          eventCellStyle={(e) => ({
            backgroundColor: e.isMine ? "#2563EB" : "#9CA3AF",
          })}
          onChangeDate={(range) => range?.date && setCurrentDate(range.date)}
        />
      </View>
    </View>
  );
}
