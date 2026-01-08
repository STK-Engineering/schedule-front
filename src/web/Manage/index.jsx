import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Application from "./Application";
import Setting from "./Setting";
import DepartmentLeave from "./DepartmentLeave";

export default function index() {
  const [view, setView] = useState("application");

  return (
    <View style={styles.container}>
      <View style={styles.toggleGroup}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            view === "application" && styles.toggleActive,
          ]}
          onPress={() => setView("application")}
        >
          <Text
            style={[
              styles.toggleText,
              view === "application" && styles.toggleTextActive,
            ]}
          >
            휴가 관리
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            view === "department" && styles.toggleActive,
          ]}
          onPress={() => setView("department")}
        >
          <Text
            style={[
              styles.toggleText,
              view === "department" && styles.toggleTextActive,
            ]}
          >
            부서별 연차
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            view === "setting" && styles.toggleActive,
          ]}
          onPress={() => setView("setting")}
        >
          <Text
            style={[
              styles.toggleText,
              view === "setting" && styles.toggleTextActive,
            ]}
          >
            계정 관리
          </Text>
        </TouchableOpacity>
      </View>

      {view === "application" && <Application />}
      {view === "department" && <DepartmentLeave />}
      {view === "setting" && <Setting />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 40,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  toggleGroup: {
    flexDirection: "row",
    alignSelf: "flex-end",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },

  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  toggleActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  toggleText: {
    color: "#475569",
    fontWeight: "600",
  },

  toggleTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
});
