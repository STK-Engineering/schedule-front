import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-big-calendar";

export default function Schedule() {
  const [mode, setMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = [
    {
      title: "Meeting",
      start: new Date(2025, 11, 10, 10, 0),
      end: new Date(2025, 11, 10, 12, 0),
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 20}}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </Text>

      {/* 달력 변환 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 10,
          alignSelf: "end",
          paddingVertical: 10,
          paddingHorizontal: 50
        }}
      >
        <TouchableOpacity
          onPress={() => setMode("day")}
          style={{
            backgroundColor: "white",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        >
          <Text style={{ fontSize: 16 }}>일간</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode("week")}
          style={{
            backgroundColor: "white",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Text style={{ fontSize: 16 }}>주간</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode("month")}
          style={{
            backgroundColor: "white",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
        >
          <Text style={{ fontSize: 16 }}>월간</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        events={events}
        height={600}
        mode={mode}
        onChangeDate={(range) => {
          if (range.date) {
            setCurrentDate(range.date);
          }
        }}
      />
    </View>
  );
}
