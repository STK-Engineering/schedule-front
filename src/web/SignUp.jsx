import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api";
import AuthLayout from "./layout/AuthLayout";

export default function SignUp() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [password, setPassword] = useState("");

  const showSuccessAlert = (message) => {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
      return;
    }
    Alert.alert("완료", message);
  };

  const handleSignUp = async () => {
    if (!email || !authCode || !password) {
      Alert.alert("알림", "이메일과 인증번호, 비밀번호를 입력해주세요");
      return;
    }

    try {
      const response = await api.post("/auth/sign-up", {
        email,
        authCode,
        password,
      });

      console.log("회원가입 성공:", response.data);

      showSuccessAlert("회원가입이 완료되었습니다.");
      navigation.navigate("Login");
    } catch (error) {
      console.log("error message:", error.message);
      console.log("error request:", error.request);
      Alert.alert(
        "회원가입 실패",
        error.response?.data?.message || "서버 오류"
      );
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert("알림", "이메일을 입력해주세요");
      return;
    }

    try {
      const response = await api.post("/auth/send-verification-code", null, {
        params: { email },
      });

      console.log("인증코드 발송 성공:", response.data);
      showSuccessAlert("인증코드가 발송되었습니다.");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "인증코드 발송 실패",
        error.response?.data?.message || "서버 오류"
      );
    }
  };

  return (
    <AuthLayout>
      <View style={styles.cardAccent} />
      <Text style={styles.title}>회원가입</Text>
      <Text style={styles.subtitle}>
        이메일 인증 후 계정을 생성할 수 있어요.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>이메일</Text>
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="이메일 주소를 입력해주세요."
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(text) => setEmail(text)}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={handleSendEmail}
          >
            <Text style={styles.inlineButtonText}>인증번호 받기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>인증번호</Text>
        <TextInput
          style={styles.input}
          placeholder="인증번호를 입력해주세요."
          placeholderTextColor="#9CA3AF"
          value={authCode}
          onChangeText={(text) => setAuthCode(text)}
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력해주세요."
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.primaryButtonText}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>이미 계정이 있으신가요?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerLink}>로그인</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const FONT_TITLE = "Space Grotesk";
const FONT_BODY = "Manrope";

const styles = StyleSheet.create({
  cardAccent: {
    height: 3,
    borderRadius: 6,
    backgroundColor: "#121D6D",
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2933",
    fontFamily: FONT_TITLE,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: FONT_BODY,
  },
  form: {
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2933",
    fontFamily: FONT_BODY,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#121D6D",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    fontSize: 14,
    color: "#1F2933",
    outlineStyle: "none",
    outlineWidth: 0,
    fontFamily: FONT_BODY,
  },
  flexInput: {
    flex: 1,
    minWidth: 180,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  inlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#121D6D",
  },
  inlineButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: FONT_BODY,
  },
  primaryButton: {
    backgroundColor: "#121D6D",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONT_BODY,
  },
  footerRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: FONT_BODY,
  },
  footerLink: {
    fontSize: 13,
    color: "#121D6D",
    fontWeight: "700",
    fontFamily: FONT_BODY,
  },
});
