import { View, Image, Text, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Logo from "../../assets/logo/logo.png";

export default function Header() {
  const navigation = useNavigation();

  return (
    <View
      style={{
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        height: Platform.OS === "ios" ? 100 : 60,
        backgroundColor: "#305685",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 20
      }}
    >
      <Image
        source={Logo}
        style={{ height: 30, width: 160, resizeMode: "contain" }}
      />

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={{ fontSize: 18, fontWeight: "400", color: "white" }}>
          로그인
        </Text>
      </TouchableOpacity>
    </View>
  );
}
