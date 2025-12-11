import { View, Text, TouchableOpacity } from "react-native";
import { navigate } from "../navigation/RootNavigation";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";

export default function Sidebar() {
  const navigation = useNavigation();

  return (
    <View
      style={{
        width: 350,
        backgroundColor: "#white",
        borderRightWidth: 1,
        borderColor: "#D4D4D4",
        paddingVertical: 20,
        alignItems: "center",
        gap: 30,
      }}
    >
      {/* 버튼 */}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "#305685",
            paddingVertical: 17,
            paddingHorizontal: 40,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
          }}
          onPress={() => navigation.navigate("Content")}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            연차 쓰기
          </Text>
        </TouchableOpacity>
        <View
          style={{
            width: 1,
            backgroundColor: "#ccc",
            height: "50%",
            position: "absolute",
          }}
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#305685",
            paddingVertical: 17,
            paddingHorizontal: 40,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
          onPress={() => navigate("Status")}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            진행 상황
          </Text>
        </TouchableOpacity>
      </View>

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
            paddingVertical: 15,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            flexDirection: "row",
            gap: 23,
            justifyContent: "center",
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              display: "flex",
              gap: 5,
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
              alignItems: "center",
              display: "flex",
              gap: 5,
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
              alignItems: "center",
              display: "flex",
              gap: 5,
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
