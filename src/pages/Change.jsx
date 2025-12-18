import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Change() {
  const navigation = useNavigation();
  const [token, setToken] = useState("");
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
              secureTextEntry
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
              color: "#121D6D",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("Password")}
          >
            비밀번호 찾기
          </TouchableOpacity>
          <View
            style={{ height: "100%", width: 1, backgroundColor: "#A5A5A5" }}
          />
          <TouchableOpacity
            style={{
              color: "#121D6D",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("SignUp")}
          >
            회원가입
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
