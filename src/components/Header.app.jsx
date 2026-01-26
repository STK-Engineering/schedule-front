import React, { useEffect, useContext, useCallback } from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "../../assets/logo/logo.png";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const auth = useContext(AuthContext);
  if (!auth) return null;

  const { isLoggedIn, setIsLoggedIn } = auth;

  const checkLogin = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [setIsLoggedIn]);

  useEffect(() => {
    checkLogin();
  }, [checkLogin]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return (
    <View
      style={{
        padding: 20,
        height: 90,
        paddingTop: 40,
        backgroundColor: "#305685",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <Image
        source={Logo}
        style={{ height: 30, width: 160, resizeMode: "contain" }}
      />

      <TouchableOpacity onPress={handleLogout}>
        <Text style={{ fontSize: 18, fontWeight: "400", color: "white" }}>
          {isLoggedIn ? "로그아웃" : "로그인"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
