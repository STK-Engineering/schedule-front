import React, { useState } from "react";
import axios from "axios";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const api = axios.create({
    baseURL: "https://schedule.stkkr.com",
    timeout: 5000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요");

      navigation.navigate("Form");
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        email,
        password
      });

      console.log("로그인 성공:", response.data);

      navigation.navigate("Form");
    } catch (error) {
      console.log("error message:", error.message);
      console.log("error request:", error.request);
      Alert.alert(
        "로그인 실패",
        error.response?.data?.message || error.message
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
          height: "50%",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 19, fontWeight: 500, marginBottom: 30 }}>
          로그인 후 이용 가능한 서비스입니다.
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
          <TextInput
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 14,
              marginBottom: 10,
              borderRadius: 8,
            }}
            placeholder="이메일을 입력해주세요."
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
        </View>
        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
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
            ssecureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: "#121D6D",
            width: "100%",
            borderWidth: 1,
            borderColor: "#121D6D",
            paddingVertical: 16,
            borderRadius: 8,
          }}
          onPress={handleLogin}
        >
          <Text style={{ color: "white", textAlign: "center" }}>로그인</Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 35,
            display: "flex",
            flexDirection: "row",
            gap: 30,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("Find")}
          >
            <Text style={{ color: "#121D6D", fontSize: 16 }}>
              비밀번호 찾기
            </Text>
          </TouchableOpacity>
          <View
            style={{ height: "100%", width: 1, backgroundColor: "#A5A5A5" }}
          />
          <TouchableOpacity
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={{ color: "#121D6D", fontSize: 16 }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
