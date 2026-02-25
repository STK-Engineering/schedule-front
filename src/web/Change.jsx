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

export default function Change() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
        error.response?.data?.message || "서버 오류",
      );
    }
  };

  const handleChange = async () => {
    if (!token || !newPassword || !confirmNewPassword) {
      Alert.alert("알림", "토큰과 새비밀번호, 새비밀번호 확인을 입력해주세요");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다");
      return;
    }

    setPasswordError("");

    try {
      const response = await api.patch("/users/reset/password", {
        token,
        newPassword,
      });

      console.log("비밀번호 재설정 성공:", response.data);
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert(
        "비밀번호 재설정 실패",
        error.response?.data?.message || "서버 오류",
      );
    }
  };

  return (
    <AuthLayout>
      <View style={styles.cardAccent} />
      <Text style={styles.title}>비밀번호 재설정</Text>
      <Text style={styles.subtitle}>
        이메일 인증 후 새 비밀번호를 설정해주세요.
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
            <Text style={styles.inlineButtonText}>인증코드 받기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>토큰</Text>
        <TextInput
          style={styles.input}
          placeholder="메일로 받은 인증코드를 입력해주세요."
          placeholderTextColor="#9CA3AF"
          value={token}
          onChangeText={setToken}
        />

        <Text style={styles.label}>새 비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="새 비밀번호를 입력해주세요."
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setPasswordError("");
          }}
        />

        <Text style={styles.label}>새 비밀번호 확인</Text>
        <TextInput
          style={styles.input}
          placeholder="새 비밀번호를 다시 입력해주세요."
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={confirmNewPassword}
          onChangeText={(text) => {
            setConfirmNewPassword(text);
            if (newPassword !== text) {
              setPasswordError("새 비밀번호가 일치하지 않습니다");
            } else {
              setPasswordError("");
            }
          }}
        />

        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleChange}>
          <Text style={styles.primaryButtonText}>재설정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>로그인</Text>
        </TouchableOpacity>
        <View style={styles.linkDivider} />
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.linkText}>회원가입</Text>
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
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 2,
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
  linkRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  linkText: {
    color: "#121D6D",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONT_BODY,
  },
  linkDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#121D6D",
  },
});
