import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TextInput } from "react-native-gesture-handler";

export default function RequestDetail({ route }) {
  const navigation = useNavigation();
  const params = route?.params ?? {};

  const {
    department = "",
    name = "",
    position = "사원",
    type = "연차",
    useDate = "2025.11.12",
    remainDays = "5일",
    reason = "가족 여행",
    extra = "없음.",
    status = "대기",
    rejectReason = "—",
  } = params;

  return (
    <ScrollView style={styles.container}>
      <Text style={{ fontSize: 20, padding: 5 }}>{status}</Text>
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: 520,
            height: 700,
            backgroundColor: "#fff",
            marginTop: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              borderWidth: 1,
              borderColor: "#333",
              height: 80,
            }}
          >
            <View
              style={{
                width: 278,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                휴가 사용 신청서
              </Text>
            </View>

            {["신청인", "부서장", "대표"].map((item) => (
              <View
                key={item}
                style={{
                  width: 80,
                  borderLeftWidth: 1,
                  borderColor: "#333",
                }}
              >
                <View
                  style={{
                    height: 22,
                    borderBottomWidth: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 11 }}>{item}</Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                />
              </View>
            ))}
          </View>

          <FormRow label="소속" value="IT/ISO" />
          <FormRow label="성명" value={name} />
          <FormRow label="휴가형태" value={type} />
          <FormRow label="기 간" value={useDate} />
          <FormRow label="사용일" value={remainDays} />
          <FormRow label="사유" value={reason || "기타"} />
          <FormRow label="기타 사항" value={extra} height={280} />

          <View
            style={{
              flexDirection: "row",
              borderWidth: 1,
              borderColor: "#333",
              marginTop: -1,
              height: 50,
            }}
          >
            <Cell title="휴가 일수 현황" width={120} />
            <Cell title="총 휴가 일수" width={80} />
            <Cell value="15일" />
            <Cell title="잔여 일수" width={80} />
            <Cell value="13일" />
          </View>

          {/* 날짜 */}
          <View style={{ marginTop: 10, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11 }}>2025.03.11</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 20 }}>
          <View style={{ position: "relative" }}>
            <View style={styles.bottomBox}>
              <View style={{flexDirection: "row", alignItems: "flex-end", gap: 10}}>
                <Text style={styles.title}>거절 사유</Text>
                <Text
                  style={{ fontSize: 13, color: "#FF2116", fontWeight: 400, marginBottom: 10 }}
                >
                  *반려를 선택할 시, 필수로 적어주셔야 하는 항목입니다.
                </Text>
              </View>
              <TextInput
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#EFEFEF",
                  padding: 20,
                }}
                placeholder="사유를 입력해주세요."
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#121D6D",
                  borderWidth: 1,
                  borderColor: "#121D6D",
                  paddingVertical: 14,
                  borderRadius: 10,
                  width: "49%",
                }}
                onPress={() => navigation.goBack()}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 17,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  확인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 2,
                  borderColor: "#FF2116",
                  backgroundColor: "white",
                  paddingVertical: 14,
                  borderRadius: 10,
                  width: "49%",
                }}
                onPress={() => navigation.goBack()}
              >
                <Text
                  style={{
                    color: "#FF2116",
                    fontSize: 17,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  반려
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FormRow({ label, value, height = 50 }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#333",
        marginTop: -1,
        height,
      }}
    >
      <View
        style={{
          width: 120,
          borderRightWidth: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 12 }}>{label}</Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 12 }}>{value}</Text>
      </View>
    </View>
  );
}

function Cell({ title, value, width }) {
  return (
    <View
      style={{
        width: width || undefined,
        flex: width ? undefined : 1,
        borderRightWidth: 1,
        borderColor: "#333",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 12 }}>{title || value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bottomBox: {
    backgroundColor: "#fff",
    padding: 18,
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#555",
  },
  pendingText: {
    fontSize: 18,
    color: "#F59E0B",
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  rejectText: {
    fontSize: 16,
    color: "#FF2116",
    lineHeight: 22,
  },
  bottomBoxWrapper: {
    position: "relative",
    marginBottom: 20,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(229, 229, 229, 0.67)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  overlayText: {
    color: "black",
    fontSize: 18,
    fontWeight: "400",
  },
});
