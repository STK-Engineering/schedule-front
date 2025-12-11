import { View, Image, Text } from "react-native";
import Logo from "../../assets/logo/logo.png";

export default function Header() {
  return (
    <View
      style={{
        height: 70,
        backgroundColor: "#305685",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 60,
        borderBottomWidth: 1,
        borderColor: "#ddd",
      }}
    >
        <Image
          source={Logo}
          style={{ height: 50, width: 200, resizeMode: "contain" }}
        />
        <Text style={{ fontSize: 18, fontWeight: "400", color: "white" }}>로그인</Text>
    </View>
  );
}
