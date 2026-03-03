import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import AuthLayout from "./layout/AuthLayout";

export default function Login() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmall = width < 480;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError("이메일과 비밀번호를 입력해주세요");
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token } = response.data;

      localStorage.setItem("token", token);
      window.location.replace("/");
      setIsLoggedIn(true);
      setLoginError("");
    } catch (error) {
      setLoginError(
        error.response?.data?.message ||
          "이메일 또는 비밀번호가 일치하지 않습니다"
      );
    }
  };

  return (
    <AuthLayout>
      <View style={styles.cardAccent} />
      <Text style={[styles.title, isSmall && styles.titleSmall]}>로그인</Text>
      <Text style={[styles.subtitle, isSmall && styles.subtitleSmall]}>
        로그인 후 이용 가능한 서비스입니다.
      </Text>
      <View style={[styles.form, isSmall && styles.formSmall]}>
        <Text style={[styles.label, isSmall && styles.labelSmall]}>이메일</Text>
        <TextInput
          style={[styles.input, isSmall && styles.inputSmall]}
          placeholder="이메일을 입력해주세요."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setLoginError("");
          }}
        />

        <Text style={[styles.label, isSmall && styles.labelSmall]}>
          비밀번호
        </Text>
        <View style={styles.passwordField}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              isSmall && styles.inputSmall,
              isSmall && styles.passwordInputSmall,
            ]}
            placeholder="비밀번호를 입력해주세요."
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLoginError("");
            }}
          />
          <TouchableOpacity
            style={[styles.passwordToggle, isSmall && styles.passwordToggleSmall]}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text
              style={[
                styles.passwordToggleText,
                isSmall && styles.passwordToggleTextSmall,
              ]}
            >
              {showPassword ? "숨기기" : "보기"}
            </Text>
          </TouchableOpacity>
        </View>

        {loginError ? (
          <Text style={[styles.errorText, isSmall && styles.errorTextSmall]}>
            {loginError}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isSmall && styles.primaryButtonSmall]}
          onPress={handleLogin}
        >
          <Text
            style={[
              styles.primaryButtonText,
              isSmall && styles.primaryButtonTextSmall,
            ]}
          >
            로그인
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.linkRow, isSmall && styles.linkRowSmall]}>
        <TouchableOpacity onPress={() => navigation.navigate("Change")}>
          <Text style={[styles.linkText, isSmall && styles.linkTextSmall]}>
            비밀번호 재설정
          </Text>
        </TouchableOpacity>
        <View style={[styles.linkDivider, isSmall && styles.linkDividerSmall]} />
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={[styles.linkText, isSmall && styles.linkTextSmall]}>
            회원가입
          </Text>
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
  titleSmall: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: FONT_BODY,
    marginBottom: 10
  },
  subtitleSmall: {
    fontSize: 12,
    marginBottom: 8,
  },
  form: {
    gap: 7,
  },
  formSmall: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2933",
    fontFamily: FONT_BODY,
  },
  labelSmall: {
    fontSize: 11,
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
  inputSmall: {
    paddingVertical: 10,
    fontSize: 13,
  },
  passwordField: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 80,
  },
  passwordInputSmall: {
    paddingRight: 70,
  },
  passwordToggle: {
    position: "absolute",
    right: 10,
    top: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E7F6",
  },
  passwordToggleSmall: {
    top: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  passwordToggleText: {
    fontSize: 12,
    color: "#121D6D",
    fontWeight: "600",
    fontFamily: FONT_BODY,
  },
  passwordToggleTextSmall: {
    fontSize: 11,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONT_BODY,
  },
  errorTextSmall: {
    fontSize: 11,
  },
  primaryButton: {
    backgroundColor: "#121D6D",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonSmall: {
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONT_BODY,
  },
  primaryButtonTextSmall: {
    fontSize: 14,
  },
  linkRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  linkRowSmall: {
    gap: 12,
    flexWrap: "wrap",
  },
  linkText: {
    color: "#121D6D",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONT_BODY,
  },
  linkTextSmall: {
    fontSize: 12,
  },
  linkDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#121D6D",
  },
  linkDividerSmall: {
    height: 14,
  },
});
