import { View, Image, Text, TouchableOpacity, Platform } from "react-native";
import Logo from "../../assets/logo/logo.png";

export default function Header() {
  return (
    <View
      style={{
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        height: Platform.OS === "ios" ? 110 : 90,
        backgroundColor: "#305685",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: "#ddd",
      }}
    >
      <Image
        source={Logo}
        style={{ height: 40, width: 160, resizeMode: "contain" }}
      />

      <TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "400", color: "white" }}>
          로그인
        </Text>
      </TouchableOpacity>
    </View>
  );
}
