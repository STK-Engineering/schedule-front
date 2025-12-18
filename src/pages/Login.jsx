import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const navigation = useNavigation();

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
            아이디
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
            placeholder="아이디를 입력해주세요."
            onChangeText={(text) => setId(text)}
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
            paddingHorizontal: "45%",
            borderWidth: 1,
            borderColor: "#121D6D",
            paddingVertical: 16,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>로그인</Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "row",
            gap: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>아직 회원이 아니신가요?</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#121D6D",
              paddingHorizontal: 45,
              paddingVertical: 10,
              borderRadius: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={{ color: "#121D6D" }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
