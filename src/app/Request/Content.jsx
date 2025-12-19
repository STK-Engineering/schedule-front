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

export default function StatusDetail({ route }) {
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
        <Text style={{fontSize: 20, padding: 10, }}>{status}</Text>
      <View style={styles.box}>
        <InfoRow label="부서" value={department} />
        <InfoRow label="이름" value={name} />
        <InfoRow label="직급" value={position} />
        <InfoRow label="종류" value={type} />
        <InfoRow label="사용일자" value={useDate} />
        <InfoRow label="남은 일자" value={remainDays} />
        <InfoRow label="사유" value={reason} />
        <InfoRow label="기타사항" value={extra} />
      </View>

      <View style={styles.bottomBoxWrapper}>
        <View style={styles.bottomBox}>
          <Text style={styles.title}>거절 사유</Text>
          <TextInput style={styles.rejectText}>
          </TextInput>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>확인</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
    fontSize: 12,
    lineHeight: 22,
    color: "#EFEFEF",
    backgroundColor: "gray",
    height: "70%",
    borderRadius: 5
  },
  button: {
    backgroundColor: "#121D6D",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
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

  bottomBox: {
    backgroundColor: "#fff",
    padding: 18,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
