import React, { useState } from "react";
import axios from "axios";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SignUp() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [authCode, setauthCode] = useState("");
  const [password, setPassword] = useState("");

  const api = axios.create({
    baseURL: "https://schedule.stkkr.com",
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });

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
    } catch (error) {
      console.log(error);
      Alert.alert(
        "인증코드 발송 실패",
        error.response?.data?.message || "서버 오류"
      );
    }
  };

  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "40%",
          height: "60%",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 30 }}>
            회원가입
          </Text>

          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 400, marginBottom: 5 }}>
              이메일
            </Text>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <TextInput
                style={{
                  width: "100%",
                  borderWidth: 1,
                  borderColor: "#121D6D",
                  padding: 14,
                  borderRadius: 8,
                }}
                placeholder="이메일 주소를 입력해주세요."
                value={email}
                onChangeText={(text) => setEmail(text)}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: "#121D6D",
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 8,
                }}
                onPress={handleSendEmail}
              >
                <Text style={{ color: "white" }}>인증번호 받기</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={{ fontSize: 14, fontWeight: 400, marginBottom: 5 }}>
            인증번호
          </Text>
          <TextInput
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 14,
              marginBottom: 10,
              borderRadius: 8,
            }}
            placeholder="인증번호를 입력해주세요."
            value={authCode}
            onChangeText={(text) => setauthCode(text)}
          />
          <Text style={{ fontSize: 14, fontWeight: 400, marginBottom: 5 }}>
            비밀번호
          </Text>
          <TextInput
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 14,
              marginBottom: 14,
              borderRadius: 8,
            }}
            placeholder="비밀번호를 입력해주세요."
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#121D6D",
              width: "100%",
              paddingVertical: 16,
              borderRadius: 8,
            }}
            onPress={handleSignUp}
          >
            <Text style={{ color: "#121D6D", textAlign: "center" }}>
              회원가입
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 10,
              marginTop: 35,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#121D6D",
                backgroundColor: "#121D6D",
                paddingHorizontal: 45,
                paddingVertical: 10,
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={{ color: "white" }}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
