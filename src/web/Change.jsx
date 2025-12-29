import React, { useState } from "react";
import axios from "axios";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Change() {
  const navigation = useNavigation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const api = axios.create({
    baseURL: "https://schedule.stkkr.com",
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const handleChange = async () => {
    if (!token || !newPassword) {
      Alert.alert("알림", "토큰과 기존비밀번호, 새비밀번호를 입력해주세요");
      return;
    }

    try {
      const response = await api.patch("/users/reset/password", {
        token,
        newPassword,
      });

      console.log("비밀번호 변경 성공:", response.data);
      navigation.navigate("Login");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "비밀번호 변경 실패",
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
          height: "50%",
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
          <Text style={{ fontSize: 19, fontWeight: 500, marginBottom: 30 }}>
            비밀번호 변경
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
              토큰
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
              placeholder="메일로 받은 암호를 입력해주세요."
              value={token}
              onChangeText={(text) => setToken(text)}
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
              새비밀번호
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
              placeholder="새비밀번호를 입력해주세요."
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => setNewPassword(text)}
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
            onPress={handleChange}
          >
            <Text style={{ color: "white", textAlign: "center" }}>변경</Text>
          </TouchableOpacity>
        </View>
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
