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
          marginLeft: 25,
          marginTop: 30,
          marginBottom: 30,
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
        cursor: "pointer",
      }}
      onPress={() => navigation.navigate("RequestContent")}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 60,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "400", width: 100 }}>
          {item.depart}
        </Text>{" "}
        <Text style={{ fontSize: 18, fontWeight: "400", width: 100 }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "400", width: 100 }}>
          {item.type}
        </Text>
        <Text style={{ fontSize: 18, color: "#475569", width: 100 }}>
          {item.date}
        </Text>
        <Text style={{ fontSize: 18, color: "#475569", width: 50 }}>
          {item.days}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "#121D6D",
            backgroundColor: "#121D6D",
            height: "100%",
            paddingHorizontal: 15,
            paddingVertical: 7,
            borderRadius: 12
          }}
        >
          <Text style={{ color: "white", fontWeight: 500 }}>승인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "#FF2116",
            backgroundColor: "white",
            height: "100%",
            paddingHorizontal: 15,
            paddingVertical: 7,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FF2116", fontWeight: 500 }}>반려</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
