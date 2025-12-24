import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Calendar } from "react-native-big-calendar";
import all from "../../assets/icon/category.png";
import department from "../../assets/icon/department.png";
import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

export default function Schedule() {
  const [mode, setMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDept, setSelectedDept] = useState([""]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  const departments = [
    "Management",
    "Sales&Marketing",
    "Engineering",
    "Coordinator",
    "Logistic&Warehouse",
    "IT/ISO",
  ];

  useEffect(() => {
    fetchLeaves();
  }, [selectedDept, onlyMine]);

  const toggleDept = (dept) => {
    setSelectedDept((prev) => {
      const next = prev.includes(dept)
        ? prev.filter((d) => d !== dept)
        : [...prev, dept];

      return next;
    });
  };
  const getDeptLabel = () => {
    if (selectedDept.length === 0) {
      return "";
    }

    if (selectedDept.length === 1) {
      return selectedDept[0];
    }

    const [first, ...rest] = selectedDept;
    return `${first} 외 ${rest.length}`;
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves", {
        params: {
          departments: selectedDept.length === 0 ? [] : selectedDept,
          onlyMine,
        },
      });

      const formatted = res.data.map((item) => ({
        title: item.title,
        start: new Date(item.start),
        end: new Date(item.end),
        isMine: item.isMine,
      }));

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
          display: "flex",
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
                      backgroundColor: "white",
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

        <View
          style={{
            flexDirection: "row",
            alignSelf: "flex-end",
            margin: 10,
            gap: 5,
          }}
        >
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
              <Text>
                {m === "day" ? "일간" : m === "week" ? "주간" : "월간"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ flex: 1, zIndex: -10 }}>
        <Calendar
          events={events}
          height={600}
          mode={mode}
          eventCellStyle={(e) => ({
            backgroundColor: e.isMine ? "#2563EB" : "#9CA3AF",
          })}
          onChangeDate={(range) => range.date && setCurrentDate(range.date)}
        />
      </View>
    </View>
  );
}
