import {
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useEffect, useContext, useState } from "react";
import Logo from "../../assets/logo/logo.png";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

export default function Header() {
  const navigation = useNavigation();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setoldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.replace("/");
    setIsLoggedIn(false);
  };

  const formatDateParam = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const goSchedule = () => {
    navigation.navigate("Schedule", {
      mode: "month",
      date: formatDateParam(new Date()),
    });
  };

  const openPasswordModal = () => {
    setPasswordModalOpen(true);
  };

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
        error.response?.data?.message || "서버 오류"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <View
      style={{
        height: 65,
        backgroundColor: "#305685",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
      }}
    >
      <TouchableOpacity onPress={goSchedule}>
        <Image
          source={Logo}
          style={{ height: 30, width: 160, resizeMode: "contain" }}
        />
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {isLoggedIn ? (
          <TouchableOpacity onPress={openPasswordModal}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "400",
                color: "white",
                marginRight: 30,
              }}
            >
              비밀번호 변경
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ fontSize: 18, fontWeight: "400", color: "white" }}>
            {isLoggedIn ? "로그아웃" : "로그인"}
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
