import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Request() {
  const statusList = [
    {
      id: 1,
      depart: "IT/ISO",
      name: "이지우",
      type: "반차(오후)",
      date: "2025.12.23",
      days: "2일"
    },
    {
      id: 2,
      depart: "IT/ISO",
      name: "이지우",
      type: "연차",
      date: "2025.12.10",
      days: "1일",
      state: "승인",
    },
    {
      id: 3,
      depart: "IT/ISO",
      name: "이지우",
      type: "연차",
      date: "2025.11.29",
      days: "1일"
    },
    {
      id: 4,
      depart: "IT/ISO",
      name: "이지우",
      type: "연차",
      date: "2025.11.12",
      days: "1일"
    },
    {
      id: 5,
      depart: "IT/ISO",
      name: "이지우",
      type: "반차(오전)",
      date: "2025.10.05",
      days: "0.5일"
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, padding: 20 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: 400,
          marginLeft: 5,
          marginTop: 30,
          marginBottom: 15,
        }}
      >
        요청 건({statusList.length})
      </Text>

      {statusList.length === 0 && (
        <Text
          style={{ textAlign: "center", color: "#94A3B8", marginBottom: 20 }}
        >
          승인해야 할 요청이 없습니다.
        </Text>
      )}

      {statusList.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

function Item({ item }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        width: "100%",
        backgroundColor: "#fff",
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        marginBottom: 10,
      }}
      onPress={() => navigation.navigate("RequestContent")}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 14, color: "#64748B" }}>
          {item.depart}
        </Text>
        <Text style={{ fontSize: 14, color: "#64748B" }}>
          {item.name}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 6,
          color: "#0F172A",
        }}
      >
        {item.type}
      </Text>

      <View
        style={{
          flexDirection: "row",
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 14, color: "#475569", marginRight: 10 }}>
          {item.date}
        </Text>
        <Text style={{ fontSize: 14, color: "#475569" }}>
          {item.days}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#121D6D",
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            승인
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#FF2116",
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FF2116", fontWeight: "600" }}>
            반려
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
