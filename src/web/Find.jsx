import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api";

export default function Find() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmall = width < 560;
  const isTiny = width < 380;
  const [email, setEmail] = useState("");

  const handleSendEmail = async () => {
      if (!email) {
        Alert.alert("알림", "이메일을 입력해주세요");
        return;
      }
  
      try {
        const response = await api.post("/users/find/password", null, {
          params: { email },
        });
  
        navigation.navigate("Change");
        console.log("재설정 인증코드 발송 성공:", response.data);
      } catch (error) {
        console.log(error);
        Alert.alert(
          "재설정 인증코드 발송 실패",
          error.response?.data?.message || "서버 오류"
        );
      }
    };

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.card,
          isSmall && styles.cardSmall,
          isTiny && styles.cardTiny,
        ]}
      >
        <View
          style={[
            styles.headerRow,
            isSmall && styles.headerRowSmall,
            isTiny && styles.headerRowTiny,
          ]}
        >
          <Text style={[styles.title, isSmall && styles.titleSmall]}>
            비밀번호 찾기
          </Text>
          <Text style={[styles.note, isSmall && styles.noteSmall]}>
            *이메일 인증 완료 시에 변경 페이지로 넘어갑니다.
          </Text>
        </View>
        <Text style={[styles.label, isSmall && styles.labelSmall]}>이메일</Text>
        <View
          style={[
            styles.inputRow,
            isSmall && styles.inputRowSmall,
            isTiny && styles.inputRowTiny,
          ]}
        >
          <TextInput
            style={[
              styles.input,
              isSmall && styles.inputSmall,
              isTiny && styles.inputTiny,
            ]}
            placeholder="이메일 주소를 입력해주세요."
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <TouchableOpacity
            style={[
              styles.button,
              isSmall && styles.buttonSmall,
              isTiny && styles.buttonTiny,
            ]}
            onPress={handleSendEmail}
          >
            <Text
              style={[styles.buttonText, isSmall && styles.buttonTextSmall]}
            >
              인증(필수)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#F8FAFC",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 40,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#121D6D",
  },
  cardSmall: {
    padding: 28,
  },
  cardTiny: {
    padding: 20,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  headerRowSmall: {
    gap: 8,
    marginBottom: 20,
  },
  headerRowTiny: {
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: "600",
    color: "#1F2933",
  },
  titleSmall: {
    fontSize: 17,
  },
  note: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9B9B9B",
  },
  noteSmall: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#1F2933",
  },
  labelSmall: {
    fontSize: 13,
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputRowSmall: {
    flexWrap: "wrap",
  },
  inputRowTiny: {
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 240,
    borderWidth: 1,
    borderColor: "#121D6D",
    padding: 14,
    borderRadius: 8,
    outlineStyle: "none",
    outlineWidth: 0,
    fontSize: 14,
    color: "#1F2933",
  },
  inputSmall: {
    minWidth: "100%",
    paddingVertical: 12,
  },
  inputTiny: {
    paddingVertical: 10,
    fontSize: 13,
  },
  button: {
    backgroundColor: "#121D6D",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonSmall: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonTiny: {
    paddingVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonTextSmall: {
    fontSize: 12,
  },
});
