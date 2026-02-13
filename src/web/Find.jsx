import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api"

export default function Find() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");

  const handleSendEmail = async () => {
      if (!email) {
        Alert.alert("알림", "이메일을 입력해주세요");
        return;
      }
  
      try {
        const response = await api.post("/users/find/password", null, {
          params: { email },
        });
  
        navigation.navigate("Change");
        console.log("재설정 인증코드 발송 성공:", response.data);
      } catch (error) {
        console.log(error);
        Alert.alert(
          "재설정 인증코드 발송 실패",
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
          height: "25%",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 40,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 19, fontWeight: 500, marginBottom: 30 }}>
            비밀번호 찾기
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 30,
              color: "#9B9B9B",
            }}
          >
            *이메일 인증 완료 시에 변경 페이지로 넘어갑니다.
          </Text>
        </View>
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
              outlineStyle: "none",
              outlineWidth: 0,
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
            <Text style={{ color: "white" }}>인증(필수)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
