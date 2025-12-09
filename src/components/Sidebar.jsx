import { View, Text, TouchableOpacity, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";

export default function Sidebar() {
  const navigation = useNavigation();

  return (
    <View
      style={{
        width: 350,
        backgroundColor: "#bebebeff",
        paddingVertical: 20,
        alignItems: "center",
        gap: 30
      }}
    >
      {/* 버튼 */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Calendar")}
        style={{
          backgroundColor: "#305685",
          paddingVertical: 17,
          paddingHorizontal: 60,
          borderRadius: 10,
        }}
      >
        <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            연차 쓰기
          </Text>
          <View
            style={{
              width: 1,
              backgroundColor: "#ccc",
              height: "100%",
              marginHorizontal: 10,
            }}
          />
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            진행 상황
          </Text>
        </View>
      </TouchableOpacity>

      {/* 달력 */}
      <View
        style={{
          width: 300,
          padding: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <Calendar />
      </View>

      {/* 연차 조회 */}
      <View>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#305685",
            paddingVertical: 15,
            paddingHorizontal: 115,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
            연차 조회
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            padding: 1,
            paddingHorizontal: 10,
            paddingVertical: 18,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            flexDirection: "row",
            gap: 23,
            justifyContent: "center",
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#E2E8F0"
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              marginBottom: 5,
              alignItems: "center",
            }}
          >
            <Text>총 연차</Text>
            <Text style={{ fontSize: 20 }}>15일</Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(213, 213, 213, 0.80)",
              height: "100%",
            }}
          />
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              marginBottom: 5,
              alignItems: "center",
            }}
          >
            <Text>사용 일수</Text>
            <Text style={{ fontSize: 20 }}>10일</Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(213, 213, 213, 0.80)",
              height: "100%",
            }}
          />
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              marginBottom: 5,
              alignItems: "center",
            }}
          >
            <Text>잔여 일수</Text>
            <Text style={{ fontSize: 20 }}>5일</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
