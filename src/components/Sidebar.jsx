import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import reqeust from "../../assets/icon/request.png";
import setting from "../../assets/icon/setting.png";

export default function Sidebar() {
  const navigation = useNavigation();

  return (
    <View
      style={{
        width: 350,
        backgroundColor: "white",
        borderRightWidth: 1,
        borderColor: "#D4D4D4",
        paddingVertical: 20,
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* 버튼 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "#305685",
            paddingVertical: 15,
            paddingHorizontal: 40,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
          }}
          onPress={() => navigation.navigate("Form")}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            연차 쓰기
          </Text>
        </TouchableOpacity>

        <View
          style={{
            width: 1,
            backgroundColor: "#ccc",
            height: 40,
            position: "absolute",
          }}
        />

        <TouchableOpacity
          style={{
            backgroundColor: "#305685",
            paddingVertical: 15,
            paddingHorizontal: 40,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
          onPress={() => navigation.navigate("Status")}
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
          backgroundColor: "white",
          overflow: "hidden",
        }}
      >
        <Calendar style={{ height: 350 }} />
      </View>

      {/* 연차 조회 */}
      <View>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#305685",
            paddingVertical: 12,
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
            paddingVertical: 13,
            paddingHorizontal: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            flexDirection: "row",
            gap: 23,
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 60
          }}
        >
          <View style={{ alignItems: "center", gap: 5 }}>
            <Text>총 연차</Text>
            <Text style={{ fontSize: 18 }}>15일</Text>
          </View>

          <View
            style={{
              width: 1,
              backgroundColor: "rgba(213, 213, 213, 0.80)",
              height: "100%",
            }}
          />

          <View style={{ alignItems: "center", gap: 5 }}>
            <Text>사용 일수</Text>
            <Text style={{ fontSize: 18 }}>10일</Text>
          </View>

          <View
            style={{
              width: 1,
              backgroundColor: "rgba(213, 213, 213, 0.80)",
              height: "100%",
            }}
          />

          <View style={{ alignItems: "center", gap: 5 }}>
            <Text>잔여 일수</Text>
            <Text style={{ fontSize: 18 }}>5일</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            width: "100%",
            borderWidth: 2,
            borderColor: "#305685",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 13,
            flexDirection: "row",
            gap: 20,
            marginBottom: 10
          }}
          onPress={navigation.navigate("Request")}
        >
          <Image source={reqeust} style={{ width: 20, height: 20 }} />
          <Text style={{ color: "#305685", fontSize: 16, fontWeight: 600 }}>요청 현황</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: "100%",
            borderWidth: 2,
            borderColor: "#305685",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 13,
            flexDirection: "row",
            gap: 20
          }}
          onPress={navigation.navigate("Application")}
        >
          <Image source={setting} style={{ width: 20, height: 20 }} />
          <Text style={{ color: "#305685", fontSize: 16, fontWeight: 600 }}>신청서 / 계정 관리</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}
