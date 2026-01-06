import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View
        style={{
          width: "40%",
          height: "50%",
          padding: 40,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 19, fontWeight: "500", marginBottom: 30 }}>
          로그인 후 이용 가능한 서비스입니다.
        </Text>

        <Text>이메일</Text>
        <TextInput
          style={inputStyle}
          placeholder="이메일을 입력해주세요."
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setLoginError(""); 
          }}
        />

        <Text>비밀번호</Text>
        <TextInput
          style={inputStyle}
          placeholder="비밀번호를 입력해주세요."
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLoginError(""); 
          }}
        />

        {loginError ? (
          <Text
            style={{
              color: "red",
              fontSize: 12,
              marginBottom: 12,
              marginTop: -4,
            }}
          >
            {loginError}
          </Text>
        ) : null}

        <TouchableOpacity style={buttonStyle} onPress={handleLogin}>
          <Text style={{ color: "white", textAlign: "center" }}>로그인</Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 35,
            flexDirection: "row",
            gap: 30,
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => navigation.navigate("Find")}>
            <Text style={{ color: "#121D6D", fontSize: 16 }}>
              비밀번호 찾기
            </Text>
          </TouchableOpacity>
          <View style={{ height: "100%", width: 1, backgroundColor: "#A5A5A5" }} />
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={{ color: "#121D6D", fontSize: 16 }}>회원가입</Text>
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
};

const buttonStyle = {
  backgroundColor: "#121D6D",
  width: "100%",
  paddingVertical: 16,
  borderRadius: 8,
};
