import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
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
      type: "병가",
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
  return (
    <View
      style={{
        width: "85%",
        backgroundColor: "#fff",
        paddingHorizontal: 50,
        paddingVertical: 20,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        marginBottom: 20,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "500", width: 100 }}>
        {item.type}
      </Text>

      <Text style={{ fontSize: 16, color: "#475569", width: 100 }}>
        {item.date}
      </Text>
      <Text style={{ fontSize: 16, color: "#475569", width: 50 }}>
        {item.days}
      </Text>

      <TouchableOpacity>
        
        <Image
          source={item.file}
          style={{ width: 35, height: 35, resizeMode: "contain" }}
        />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {item.state}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
              item.state === "승인"
                ? "#121D6D"
                : item.state === "거절"
                ? "#FF2116"
                : "#64748B",
            marginRight: 6,
          }}
        />
      </Text>
    </View>
  );
}
