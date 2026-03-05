import React, { useContext, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ collapsed = false, onRequestClose }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 800;
  const panelWidth = Math.min(260, Math.max(200, Math.floor(width * 0.72)));
  const { isLoggedIn } = useContext(AuthContext) ?? {};
  const [authorities, setAuthorities] = useState([]);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [openSections, setOpenSections] = useState({
    mypage: false,
    leave: false,
  });
  const panelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const fetchMe = async () => {
      if (!isLoggedIn) {
        if (!mounted) return;
        setAuthorities([]);
        setIsLoggedOut(true);
        return;
      }

      try {
        const res = await api.get("/employees/me");
        const data = res.data;

        if (!mounted) return;

        const rawAuthorities = data?.roles ?? [];
        const normalized = Array.isArray(rawAuthorities)
          ? rawAuthorities
              .flatMap((item) => {
                if (!item) return [];
                if (typeof item === "string") return [item];
                return [item.authorityName, item.name, item.authority].filter(
                  Boolean,
                );
              })
              .map((v) => String(v).toLowerCase())
          : [rawAuthorities].flatMap((v) => {
              if (!v) return [];
              return String(v)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.toLowerCase());
            });

        setAuthorities(normalized);
        setIsLoggedOut(false);
      } catch (e) {
        console.log("me fetch error:", e?.response?.status, e?.response?.data);
        if (!mounted) return;

        setAuthorities([]);
        setIsLoggedOut(true);
      }
    };

    fetchMe();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (collapsed) {
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      return;
    }
    panelAnim.setValue(0);
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [collapsed, panelAnim]);

  const hasAuthority = (target) =>
    authorities.some((auth) => auth === target || auth === `role_${target}`);
  const canSeeManager = hasAuthority("manager");
  const canSeeAdmin = hasAuthority("admin");
  const canSeeSchedule =
    hasAuthority("schdule_admin") ||
    hasAuthority("schedule_admin") ||
    hasAuthority("schedule_general");

  const menuSections = [
    {
      id: "leave",
      title: "휴가",
      items: [
        { label: "휴가 신청", route: "LeaveForm", visible: true },
        { label: "내 휴가 신청 내역", route: "LeaveStatus", visible: true },
        {
          label: "휴가 결재 요청",
          route: "LeaveRequest",
          visible: canSeeManager,
        },
        {
          label: "승인된 휴가",
          route: "LeaveApplication",
          visible: canSeeAdmin,
        },
      ].filter((item) => item.visible),
    },
    {
      id: "overtime",
      title: "연장 근로",
      items: [
        { label: "연장 근로 신청", route: "OverTimeForm", visible: true },
        {
          label: "내 연장 근로 신청 내역",
          route: "OverTimeStatus",
          visible: true,
        },
        {
          label: "연장 근로 결재 요청",
          route: "OverTimeRequest",
          visible: canSeeManager,
        },
        {
          label: "승인된 연장 근로",
          route: "OverTimeApplication",
          visible: canSeeAdmin,
        },
      ].filter((item) => item.visible),
    },
    {
      id: "scheduling",
      title: "일정 관리",
      visible: canSeeSchedule,
      items: [
        { label: "일정 등록", route: "SchedulingForm", visible: canSeeSchedule },
        {
          label: "일정 관리",
          route: "SchedulingList",
          visible: canSeeSchedule,
        },
      ].filter((item) => item.visible),
    },
    {
      id: "admin",
      title: "어드민",
      visible: canSeeAdmin,
      items: [
        {
          label: "사용자 관리",
          route: "Setting",
        },
        {
          label: "연차 현황 관리",
          route: "DepartmentLeave",
        },
        {
          label: "결재 라인 관리",
          route: "ApprovalLine",
        },
      ],
    },
  ].filter((section) => section.visible !== false);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMenuPress = (item) => {
    if (item.action) {
      item.action();
      return;
    }
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  return (
    <View
      pointerEvents={collapsed ? "none" : "auto"}
      style={[
        styles.overlayRoot,
        isMobile ? styles.overlayRootMobile : styles.overlayRootDesktop,
      ]}
    >
      {isMobile && !collapsed ? (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => onRequestClose?.()}
        />
      ) : null}
      <Animated.View
        style={[
          styles.overlayPanel,
          isMobile && styles.overlayPanelMobile,
          {
            width: isMobile ? panelWidth : 240,
            opacity: panelAnim,
            transform: [
              {
                translateX: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          },
        ]}
        onMouseLeave={() => {
          if (!collapsed && !isMobile) onRequestClose?.();
        }}
      >
        <View style={styles.menuList}>
          {menuSections.map((section) => (
            <View key={section.id} style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuSectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text
                  style={[
                    styles.menuSectionTitle,
                    isMobile && styles.menuSectionTitleMobile,
                  ]}
                >
                  {section.title}
                </Text>
                <Text
                  style={[
                    styles.menuSectionArrow,
                    isMobile && styles.menuSectionArrowMobile,
                  ]}
                >
                  {openSections[section.id] ? "▾" : "▸"}
                </Text>
              </TouchableOpacity>
              {openSections[section.id] &&
                section.items.map((item) => (
                  <TouchableOpacity
                    key={item.route ?? item.label}
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item)}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        isMobile && styles.menuItemTextMobile,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
  },
  overlayRootDesktop: {
    width: 240,
  },
  overlayRootMobile: {
    right: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
  },
  menuList: {
    gap: 6,
  },
  menuSection: {
    gap: 6,
    marginBottom: 10,
  },
  menuSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  menuSectionTitle: {
    fontSize: 16,
    color: "#9ca3af",
  },
  menuSectionTitleMobile: {
    fontSize: 15,
  },
  menuSectionArrow: {
    fontSize: 16,
    color: "#9ca3af",
  },
  menuSectionArrowMobile: {
    fontSize: 15,
  },
  menuItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingLeft: 8,
  },
  menuItemText: {
    fontSize: 15,
    color: "#000000ff",
  },
  menuItemTextMobile: {
    fontSize: 14,
  },
  overlayPanel: {
    position: "absolute",
    top: 0,
    width: 240,
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 6, height: 0 },
    zIndex: 999,
  },
  overlayPanelMobile: {
    shadowOpacity: 0.12,
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.83)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  lockText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000ff",
  },
});
