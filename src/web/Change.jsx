import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api";

export default function Change() {
  const navigation = useNavigation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(""); 

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

      console.log("비밀번호 변경 성공:", response.data);
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert(
        "비밀번호 변경 실패",
        error.response?.data?.message || "서버 오류"
      );
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
        <View style={{ width: "100%" }}>
          <Text style={{ fontSize: 19, fontWeight: "500", marginBottom: 30 }}>
            비밀번호 변경
          </Text>

          <Text>토큰</Text>
          <TextInput
            style={inputStyle}
            placeholder="메일로 받은 암호를 입력해주세요."
            value={token}
            onChangeText={setToken}
          />

          <Text>새비밀번호</Text>
          <TextInput
            style={inputStyle}
            placeholder="새 비밀번호를 입력해주세요."
            secureTextEntry
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setPasswordError(""); 
            }}
          />

          <Text>새비밀번호 확인</Text>
          <TextInput
            style={inputStyle}
            placeholder="새 비밀번호를 다시 입력해주세요."
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
            <Text style={{ color: "red", marginBottom: 10, fontSize: 12 }}>
              {passwordError}
            </Text>
          ) : null}

          <TouchableOpacity style={buttonStyle} onPress={handleChange}>
            <Text style={{ color: "white", textAlign: "center" }}>변경</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const inputStyle = {
  width: "100%",
  borderWidth: 1,
  borderColor: "#121D6D",
  padding: 14,
  marginBottom: 10,
  borderRadius: 8,
  outlineStyle: "none",
  outlineWidth: 0,
};

const buttonStyle = {
  backgroundColor: "#121D6D",
  width: "100%",
  paddingVertical: 16,
  borderRadius: 8,
};
