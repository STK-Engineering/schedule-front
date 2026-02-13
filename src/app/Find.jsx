import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Find() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");

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
          width: "85%",
          height: "25%",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 30,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 14, fontWeight: 500, marginBottom: 30 }}>
            비밀번호 찾기
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 500,
              marginBottom: 30,
              color: "#9B9B9B",
            }}
          >
            *이메일 인증 완료 시에 변경 페이지로 넘어갑니다.
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: 400, marginBottom: 8 }}>
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
              width: "75%",
              borderWidth: 1,
              borderColor: "#121D6D",
              padding: 14,
              borderRadius: 8,
              fontSize: 12,
            }}
            placeholder="이메일 주소를 입력해주세요."
            onChangeText={(text) => setEmail(text)}
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#121D6D",
              paddingHorizontal: 12,
              paddingVertical: 14,
              borderRadius: 8,
            }}
            onPress={() => navigation.navigate("Change")}
          >
            <Text style={{ color: "white", fontSize: 12 }}>인증(필수)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
