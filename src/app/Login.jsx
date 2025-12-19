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
  const [email, setEmail] = useState("");
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
          width: "80%",
          height: "50%",
          justifyContent: "center",
          alignItems: "center",
          padding: 30,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: 500, marginBottom: 30 }}>
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
          <Text style={{ fontSize: 12, fontWeight: 400, marginBottom: 8 }}>
            이메일
          </Text>
          <TextInput
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 12,
              marginBottom: 10,
              borderRadius: 8,
              fontSize: 12
            }}
            placeholder="이메일을 입력해주세요."
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
          <Text style={{ fontSize: 12, fontWeight: 400, marginBottom: 8 }}>
            비밀번호
          </Text>
          <TextInput
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 12,
              marginBottom: 14,
              borderRadius: 8,
              fontSize: 12
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
            paddingVertical: 12,
            borderRadius: 8,
          }}
            onPress={() => navigation.replace("Main")}
        >
          <Text style={{ color: "white", textAlign: "center" }}>로그인</Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 25,
            display: "flex",
            flexDirection: "row",
            gap: 20,
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
            <Text style={{ color: "#121D6D", fontSize: 13 }}>
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
            <Text style={{ color: "#121D6D", fontSize: 13 }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
