import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import SideBackground from "../../../assets/img/login.webp";
import WhiteLogo from "../../../assets/logo/white_logo.png";

const FONT_BODY = "Manrope";
const DEFAULT_SIDE_NOTE =
  "본 서비스는 사내 서비스로, \n (주)에스티케이엔지니어링 직원에 한하여 사용 가능합니다.";

export default function AuthLayout({ children }) {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <ImageBackground
            source={SideBackground}
            style={styles.sidePanel}
            imageStyle={styles.sidePanelImage}
          >
            <Image
              source={SideBackground}
              style={styles.sidePanelContain}
              resizeMode="contain"
            />
            <View style={styles.sideOverlay}>
              <Text style={styles.sideNote}>{DEFAULT_SIDE_NOTE}</Text>
              <Image
                source={WhiteLogo}
                style={styles.sideLogo}
                resizeMode="contain"
              />
            </View>
          </ImageBackground>

          <View style={styles.formPanel}>{children}</View>
        </View>
      </View>
      <Text style={styles.copyright}>
        Copyright © STK Engineering All Rights Reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 800,
    minHeight: 450,
    padding: 0,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#121D6D",
    shadowColor: "#1F2933",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  sidePanel: {
    width: 280,
    minHeight: 450,
    borderRightWidth: 1,
    borderColor: "#121D6D",
    justifyContent: "space-between",
    overflow: "hidden",
    alignSelf: "stretch"
  },
  sidePanelImage: {
    resizeMode: "contain",
    objectPosition: "center bottom",
  },
  sidePanelContain: {
    position: "absolute",
    top: 0,
    bottom: 12,
    left: 0,
    right: 12,
    zIndex: 1,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 24,
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 2,
  },
  sideNote: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    fontFamily: FONT_BODY,
    textShadowColor: "rgba(15, 23, 42, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  sideLogo: {
    width: 180,
    height: 40,
  },
  formPanel: {
    flex: 1,
    padding: 36,
    gap: 16,
  },
  copyright: {
    marginTop: 40,
    fontSize: 14,
    color: "#6d7177ff",
    fontFamily: FONT_BODY,
    textAlign: "center",
  },
});
