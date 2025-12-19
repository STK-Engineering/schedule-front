import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import pdf from "../../../assets/img/pdf.png";

export default function Status() {
  
  const statusList = [
    {
      id: 1,
      type: "반차(오후)",
      date: "2025.12.23",
      days: "2일",
      file: pdf,
      state: "대기",
    },
    {
      id: 2,
      type: "연차",
      date: "2025.12.10",
      days: "1일",
      file: pdf,
      state: "승인",
    },
    {
      id: 3,
      type: "연차",
      date: "2025.11.29",
      days: "1일",
      file: pdf,
      state: "거절",
    },
    {
      id: 4,
      type: "연차",
      date: "2025.11.12",
      days: "1일",
      file: pdf,
      state: "대기",
    },
    {
      id: 5,
      type: "반차(오전)",
      date: "2025.10.05",
      days: "0.5일",
      file: pdf,
      state: "승인",
    },
  ];

  const waitingList = statusList.filter((item) => item.state === "대기");
  const doneList = statusList.filter((item) => item.state !== "대기");

  return (
    <ScrollView
      style={{ flex: 1, paddingTop: 20 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          marginLeft: 25,
          marginBottom: 30,
        }}
      >
        승인 대기
      </Text>

      {waitingList.length === 0 && (
        <Text
          style={{ textAlign: "center", color: "#94A3B8", marginBottom: 20 }}
        >
          승인해야 할 요청이 없습니다.
        </Text>
      )}

      {waitingList.map((item) => (
        <Item key={item.id} item={item} />
      ))}

      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          marginLeft: 25,
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        진행 완료
      </Text>

      {doneList.length === 0 && (
        <Text style={{ textAlign: "center", color: "#94A3B8" }}>
          처리된 요청이 없습니다.
        </Text>
      )}

      {doneList.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

function Item({ item }) {
  const navigation = useNavigation();

  const stateColor =
    item.state === "승인"
      ? "#121D6D"
      : item.state === "거절"
      ? "#FF2116"
      : "#64748B";

  return (
    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#fff",
        padding: 16,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        marginBottom: 16,
      }}
      onPress={() => navigation.navigate("StatusContent")}
      activeOpacity={0.8}
    >
      {/* 상단 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          {item.type}
        </Text>

        <Image
          source={item.file}
          style={{ width: 28, height: 28, resizeMode: "contain" }}
        />
      </View>

      {/* 날짜 / 일수 */}
      <Text style={{ fontSize: 14, color: "#64748B", marginBottom: 6 }}>
        {item.date} · {item.days}
      </Text>

      {/* 상태 */}
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: stateColor,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          marginTop: 6,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {item.state}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
