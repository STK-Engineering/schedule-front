import {
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { useEffect, useContext, useState, useRef } from "react";
import Logo from "../../assets/logo/logo.png";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import api, { getTokenExpiryMs } from "../api/api";
import { navigate as navigateRoot } from "../navigation/RootNavigation";

export default function Header({ onToggleSidebar }) {
  const HEADER_HEIGHT = 70;
  const navigation = useNavigation();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setoldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [authorities, setAuthorities] = useState([]);
  const [tokenRemainingText, setTokenRemainingText] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setTokenRemainingText("");
      return;
    }

    const updateRemaining = () => {
      const token = localStorage.getItem("token");
      const expiryMs = getTokenExpiryMs(token);
      if (!expiryMs) {
        setTokenRemainingText("만료 정보 없음");
        return;
      }
      const remainingMs = expiryMs - Date.now();
      if (remainingMs <= 0) {
        setTokenRemainingText("만료됨");
        return;
      }
      const remainingSec = Math.floor(remainingMs / 1000);
      setTokenRemainingText(`만료까지 ${remainingSec}초`);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 30 * 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    let mounted = true;

    const fetchMe = async () => {
      if (!isLoggedIn) {
        setUserName("");
        setDeptName("");
        setAuthorities([]);
        return;
      }

      try {
        const res = await api.get("/employees/me");
        const data = res.data;
        if (!mounted) return;

        setUserName(String(data?.name ?? ""));
        setDeptName(
          String(
            data?.department?.name ??
              data?.employee?.department?.name ??
              data?.department ??
              "",
          ),
        );
        const rawAuthorities = data?.roles ?? data?.role ?? [];
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
      } catch (e) {
        if (!mounted) return;
        setUserName("");
        setDeptName("");
        setAuthorities([]);
      }
    };

    fetchMe();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.replace("/");
    setIsLoggedIn(false);
  };

  const goHome = () => {
    navigation.navigate("Home");
  };

  const goSchedule = () => {
    navigation.navigate("Schedule");
  }

  const goLogin = () => {
    navigateRoot("Login");
    navigation.navigate("Login");
  };

  const normalizeAuthority = (value) => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (raw === "관리자") return "admin";
    if (raw === "결재자") return "manager";
    if (raw === "일반") return "general";
    return raw.replace(/^role_/, "");
  };

  const hasAuthority = (target) => {
    const normalizedTarget = normalizeAuthority(target);
    return authorities.some(
      (auth) => normalizeAuthority(auth) === normalizedTarget,
    );
  };
  const canSeeManager = hasAuthority("manager");
  const canSeeAdmin = hasAuthority("admin");

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

  const handleTitlePress = (id) => {
    setOpenMenu(id);
    navigation.navigate("Form");
  };

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  const handleMenuPress = (item) => {
    setOpenMenu(null);
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const userMenuItems = [
    { label: "홈", route: "Home" },
    { label: "비밀번호 재설정", route: "PasswordChange" },
    { label: "로그아웃", action: handleLogout },
  ];

  useEffect(() => {
    if (!openMenu) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
      return;
    }
    dropdownAnim.setValue(0);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [openMenu, dropdownAnim]);

  const resetPasswordForm = () => {
    setoldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    resetPasswordForm();
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("알림", "현재 비밀번호와 새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");

    try {
      await api.put("/users/password", {
        oldPassword,
        newPassword,
      });
      Alert.alert("완료", "비밀번호가 변경되었습니다.");
      closePasswordModal();
    } catch (error) {
      Alert.alert(
        "비밀번호 변경 실패",
        error.response?.data?.message || "서버 오류",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <View
      style={{
        height: 70,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#E2E8F0",
        justifyContent: "space-between",
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
          <TouchableOpacity onPress={onToggleSidebar} style={{ padding: 3 }}>
            <Text style={{ fontSize: 24, color: "#0F172A" }}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goHome}>
            <Image
              source={Logo}
              style={{ width: 190, height: 70, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {menuSections.map((section) => (
            <View
              key={section.id}
              style={{ position: "relative" }}
              onMouseEnter={() => {
                cancelClose();
                setOpenMenu(section.id);
              }}
              onMouseLeave={scheduleClose}
            >
              <TouchableOpacity
                onPress={() => handleTitlePress(section.id)}
                style={{
                  height: HEADER_HEIGHT,
                  width: 160,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    openMenu === section.id ? "#121D6D" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: openMenu === section.id ? "white" : "#0F172A",
                  }}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
              {openMenu === section.id ? (
                <View
                  style={{
                    position: "absolute",
                    top: HEADER_HEIGHT,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                    zIndex: 9999,
                    elevation: 9999,
                  }}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <Animated.View
                    style={{
                      width: 160,
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderTopWidth: 0,
                      borderColor: "#E5E7EB",
                      paddingVertical: 15,
                      shadowColor: "#0F172A",
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      alignItems: "center",
                      shadowOffset: { width: 0, height: 6 },
                      transform: [
                        {
                          translateY: dropdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-6, 0],
                          }),
                        },
                        {
                          scaleY: dropdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.98, 1],
                          }),
                        },
                      ],
                      opacity: dropdownAnim,
                    }}
                  >
                    {section.items.map((item) => (
                      <TouchableOpacity
                        key={`${section.id}-${item.label}`}
                        onPress={() => handleMenuPress(item)}
                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                      >
                        <Text style={{ fontSize: 14, color: "#0F172A" }}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* {isLoggedIn && tokenRemainingText ? (
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: "#EEF2FF",
              borderWidth: 1,
              borderColor: "#CBD5F5",
            }}
          >
            <Text style={{ fontSize: 12, color: "#1E1B4B" }}>
              {tokenRemainingText}
            </Text>
          </View>
        ) : null} */}
        {isLoggedIn && (userName || deptName) ? (
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => setOpenUserMenu((prev) => !prev)}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "black",
                }}
              >
                {`${userName || ""}님`} 
              </Text>
            </TouchableOpacity>
            {openUserMenu ? (
              <>
                <View
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9998,
                  }}
                  onStartShouldSetResponder={() => {
                    setOpenUserMenu(false);
                    return true;
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: 30,
                    right: 0,
                    backgroundColor: "white",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingVertical: 6,
                    minWidth: 160,
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 6 },
                    zIndex: 9999,
                  }}
                >
                  {userMenuItems.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                      onPress={() => {
                        setOpenUserMenu(false);
                        if (item.action) {
                          item.action();
                          return;
                        }
                        if (item.route) {
                          navigation.navigate(item.route);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "#0F172A" }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={isLoggedIn ? goSchedule : goLogin}
          style={{
            backgroundColor: isLoggedIn ? "#ffffff" : "#121D6D",
            borderColor: isLoggedIn ? "#000000ff" : "#121D6D",
            borderWidth: 1,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "400",
              color: isLoggedIn ? "#0F172A" : "white",
            }}
          >
            {isLoggedIn ? "일정보러 가기" : "로그인"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={passwordModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePasswordModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                비밀번호 변경
              </Text>
              <TouchableOpacity onPress={closePasswordModal}>
                <Text style={{ fontSize: 16, color: "#64748B" }}>닫기</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ marginBottom: 6 }}>현재 비밀번호</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
              secureTextEntry
              value={oldPassword}
              onChangeText={setoldPassword}
              placeholder="현재 비밀번호"
            />
            <Text style={{ marginBottom: 6 }}>새 비밀번호</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (confirmPassword && text !== confirmPassword) {
                  setPasswordError("새 비밀번호가 일치하지 않습니다.");
                } else {
                  setPasswordError("");
                }
              }}
              placeholder="새 비밀번호"
            />

            <Text style={{ marginBottom: 6 }}>새 비밀번호 확인</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (newPassword && newPassword !== text) {
                  setPasswordError("새 비밀번호가 일치하지 않습니다.");
                } else {
                  setPasswordError("");
                }
              }}
              placeholder="새 비밀번호 확인"
            />

            {passwordError ? (
              <Text style={{ color: "#DC2626", marginBottom: 10 }}>
                {passwordError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={savingPassword}
              style={{
                backgroundColor: savingPassword ? "#94A3B8" : "#121D6D",
                paddingVertical: 12,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                변경하기
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
