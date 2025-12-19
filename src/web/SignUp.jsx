import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SignUp() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [num, setNum] = useState("");
  const [password, setPassword] = useState("");

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
        <View style={{ width: "100%", justifyContent: "center", alignItems: "flex-start" }}>
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
                onChangeText={(text) => setEmail(text)}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: "#121D6D",
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 8,
                }}
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
            onChangeText={(text) => setNum(text)}
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
          >
            <Text style={{ color: "#121D6D", textAlign: "center" }}>
              회원가입
            </Text>
          </TouchableOpacity>
         
        </View>
        <View>
          <View style={{ display: "flex", flexDirection: "row", gap: 10, marginTop: 35, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16 }}>이미 계정이 있으신가요?</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#121D6D",
              backgroundColor: "#121D6D",
              paddingHorizontal: 45,
              paddingVertical: 10,
              borderRadius: 12,
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
