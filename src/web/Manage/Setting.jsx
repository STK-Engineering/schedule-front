import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: 90, sortable: true },
  { key: "department", title: "부서", width: 150, sortable: true },
  { key: "position", title: "직급", width: 80, sortable: true },
  { key: "date", title: "입사일", width: 130, sortable: true },
  { key: "location", title: "근무지", width: 80, sortable: true },
  { key: "mail", title: "메일", width: 200, sortable: true },
  { key: "role", title: "권한", width: 120, sortable: true },
  { key: "status", title: "상태", width: 140, sortable: true },
];

const formatYYYYMMDD = (text) => {
  const digits = String(text).replace(/\D/g, "").slice(0, 8);
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);

  if (digits.length <= 4) return y;
  if (digits.length <= 6) return `${y}-${m}`;
  return `${y}-${m}-${d}`;
};

function SelectField({
  placeholder,
  valueText,
  open,
  onToggle,
  options,
  onSelect,
  zIndex,
}) {
  return (
    <View style={[styles.selectWrap, { zIndex }]}>
      <TouchableOpacity
        style={styles.input}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={{ color: valueText ? "#000" : "#999" }}>
          {valueText || placeholder}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={styles.dropdownItem2}
              onPress={() => onSelect(opt.value)}
            >
              <Text>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function statusText(accountStatus) {
  switch (accountStatus) {
    case "INACTIVE":
      return "계정 활성화";
    case "ACTIVE":
      return "계정 비활성화";
    default:
      return null;
  }
}

function statusLabel(accountStatus) {
  switch (accountStatus) {
    case "ACTIVE":
      return "활성화";
    case "INACTIVE":
      return "비활성화";
    case "NOT_CREATED":
      return "생성되지 않음";
    default:
      return accountStatus ?? "";
  }
}

export default function Setting() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const [modalVisible, setModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItem, setMenuItem] = useState(null);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState(null);
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");

  const activeCount = useMemo(
    () => data.filter((x) => x.status === "ACTIVE").length,
    [data]
  );

  const DEPARTMENTS = useMemo(
    () => [
      { label: "Sales&Marketing", value: 1 },
      { label: "MANAGEMENT", value: 2 },
      { label: "ENGINEERING", value: 3 },
      { label: "Logistic&warehouse", value: 4 },
      { label: "IT/ISO", value: 5 },
      { label: "Coordinator", value: 6 },
    ],
    []
  );

  const ROLES = useMemo(
    () => [
      { label: "ADMIN", value: "ADMIN" },
      { label: "GENERAL", value: "GENERAL" },
      { label: "MANAGER", value: "MANAGER" },
    ],
    []
  );

  const LOCATIONS = useMemo(
    () => [
      { label: "송정", value: "송정" },
      { label: "반룡", value: "반룡" },
    ],
    []
  );

  const resetForm = () => {
    setName("");
    setDepartment(null);
    setPosition("");
    setHireDate("");
    setEmail("");
    setRole("");
    setLocation("");
    setOpenDropdown(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    setOpenDropdown(null);
  };

  const openCreateModal = () => {
    setMode("create");
    setEditingId(null);
    resetForm();
    setModalVisible(true);
  };

  const validateForm = () => {
    const mustHaveRole = mode === "create";

    if (
      !name ||
      !email ||
      !department ||
      !position ||
      !hireDate ||
      !location ||
      (mustHaveRole && !role)
    ) {
      Alert.alert("확인", "모든 항목을 다 채워주세요.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = {
      name,
      level: position,
      departmentId: department,
      hireDate,
      location,
    };

    if (mode === "create") {
      payload.email = email;
      payload.role = role;
    }

    return payload;
  };

  const fetchEmployeeList = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/employees");
      const list = res.data;

      setData(
        list.map((e) => ({
          id: e.id,
          name: e.name,
          department: e.department,
          departmentId: e.department?.id ?? null,
          position: e.level ?? "",
          date: e.hireDate ?? "",
          location: e.location ?? "",
          mail: e.email ?? "",
          role: e.role?.name ?? e.role ?? "",
          status: e.accountStatus,
          userId: e.user?.id,
        }))
      );
    } catch (e) {
      console.log(
        "employee list error:",
        e?.response?.status,
        e?.response?.data
      );
      setError("직원 목록을 불러오지 못 했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeList();
  }, []);

  const createEmployee = async () => {
    if (!validateForm()) return;

    try {
      await api.post("/employees", buildPayload());
      await fetchEmployeeList();
      resetForm();
      closeModal();
    } catch (err) {
      console.error("계정 추가 실패", err);
      Alert.alert("실패", "계정 추가에 실패했습니다.");
    }
  };

  const updateEmployee = async () => {
    if (!editingId)
      return Alert.alert("오류", "수정할 계정을 찾지 못했습니다.");
    if (!validateForm()) return;

    try {
      await api.put(`/employees/${editingId}`, buildPayload());
      await fetchEmployeeList();

      resetForm();
      closeModal();
      setMode("create");
      setEditingId(null);
    } catch (err) {
      console.error("계정 수정 실패", err);
      Alert.alert("실패", "계정 수정에 실패했습니다.");
    }
  };

  const statusUser = async (item) => {
    const userId = item?.userId;
    if (!userId) {
      Alert.alert("오류", "계정(User) ID가 없습니다.");
      return;
    }

    setMenuVisible(false);
    setMenuItem(null);

    try {
      await api.put(`/users/${userId}/status`);
      await fetchEmployeeList();
    } catch (err) {
      console.log("status error:", err?.response?.status, err?.response?.data);
      Alert.alert("실패", "계정 상태 변경에 실패했습니다.");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") direction = "desc";

    const sorted = [...data].sort((a, b) => {
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      return 0;
    });

    setSort({ key, direction });
    setData(sorted);
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <View style={[styles.checkboxCell, styles.headerCell]} />
      {columns.map((col) => (
        <TouchableOpacity
          key={col.key}
          style={[styles.cell, { width: col.width }]}
          activeOpacity={0.7}
          onPress={() => col.sortable && handleSort(col.key)}
        >
          <Text style={styles.headerText}>
            {col.title}
            {sort.key === col.key && (
              <Text style={styles.sortIcon}>
                {sort.direction === "asc" ? " ↑" : " ↓"}
              </Text>
            )}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={{ width: 40 }} />
    </View>
  );

  const startEdit = (item) => {
    setMode("edit");
    setEditingId(item.id);

    setName(item.name ?? "");
    setPosition(item.position ?? "");
    setHireDate(item.date ?? "");
    setLocation(item.location ?? "");
    setEmail(item.mail ?? "");
    setDepartment(item.departmentId ?? item.department?.id ?? null);

    setOpenDropdown(null);
    setModalVisible(true);
  };

  const openRowMenu = (item) => {
    setMenuItem(item);
    setMenuVisible(true);
  };

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText}>
              {col.key === "status"
                ? statusLabel(item.status)
                : typeof item[col.key] === "object"
                ? item[col.key]?.name
                : item[col.key]}
            </Text>
          </View>
        ))}

        <View style={styles.menuCell}>
          <TouchableOpacity onPress={() => openRowMenu(item)}>
            <Text style={styles.moreText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const departmentText = department
    ? DEPARTMENTS.find((d) => d.value === department)?.label
    : "";
  const roleText = role || "";
  const locationText = location || "";

  return (
    <View>
      <View style={styles.topBar}>
        <Text style={styles.title}>
          직원 수({activeCount}){loading ? " (로딩중...)" : ""}
        </Text>

        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Text style={styles.addBtnText}>계정 추가</Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ height: 520 }}>
          <View style={{ flex: 1 }}>
            {renderHeader()}
            <FlatList
              data={data}
              keyExtractor={(item, index) => String(item.id ?? index)}
              renderItem={renderRow}
              style={{ flex: 1 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              removeClippedSubviews={false}
              initialNumToRender={10}
              windowSize={7}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => {
            setMenuVisible(false);
            setMenuItem(null);
          }}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onStartShouldSetResponder={() => true}
              onPress={() => {
                if (!menuItem) return;
                setMenuVisible(false);
                startEdit(menuItem);
              }}
            >
              <Text>계정 수정</Text>
            </TouchableOpacity>
            {(() => {
              const label = statusText(menuItem?.status);
              if (!label) return null;

              return (
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomWidth: 0 }]}
                  onPress={() => statusUser(menuItem)}
                >
                  <Text>{label}</Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setOpenDropdown(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBox}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>
              {mode === "edit" ? "계정 수정" : "계정 추가"}
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="이름"
              onFocus={() => setOpenDropdown(null)}
              placeholderTextColor="#999"
            />

            <SelectField
              placeholder="부서 선택"
              valueText={departmentText}
              open={openDropdown === "department"}
              onToggle={() =>
                setOpenDropdown((prev) =>
                  prev === "department" ? null : "department"
                )
              }
              options={DEPARTMENTS}
              onSelect={(v) => {
                setDepartment(v);
                setOpenDropdown(null);
              }}
              zIndex={30}
            />

            <TextInput
              style={styles.input}
              value={position}
              onChangeText={setPosition}
              placeholder="직급"
              onFocus={() => setOpenDropdown(null)}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={hireDate}
              onChangeText={(t) => setHireDate(formatYYYYMMDD(t))}
              placeholder="입사일 (YYYY-MM-DD)"
              keyboardType="number-pad"
              onFocus={() => setOpenDropdown(null)}
              maxLength={10}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, mode === "edit" && styles.disabledInput]}
              value={email}
              onChangeText={setEmail}
              placeholder="메일"
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setOpenDropdown(null)}
              placeholderTextColor="#999"
              editable={mode !== "edit"}
            />

            {mode === "create" && (
              <SelectField
                placeholder="권한 선택"
                valueText={roleText}
                open={openDropdown === "role"}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === "role" ? null : "role"))
                }
                options={ROLES}
                onSelect={(v) => {
                  setRole(v);
                  setOpenDropdown(null);
                }}
                zIndex={20}
              />
            )}

            <SelectField
              placeholder="근무지 선택"
              valueText={locationText}
              open={openDropdown === "location"}
              onToggle={() =>
                setOpenDropdown((prev) =>
                  prev === "location" ? null : "location"
                )
              }
              options={LOCATIONS}
              onSelect={(v) => {
                setLocation(v);
                setOpenDropdown(null);
              }}
              zIndex={10}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={mode === "edit" ? updateEmployee : createEmployee}
              >
                <Text style={styles.confirmText}>
                  {mode === "edit" ? "수정" : "추가"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  closeModal();
                  setMode("create");
                  setEditingId(null);
                }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  addBtn: {
    backgroundColor: "#305685",
    borderWidth: 1,
    borderColor: "#305685",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 45,
  },
  addBtnText: { color: "white", textAlign: "center", fontWeight: "500" },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#EEE" },

  cell: { padding: 12, justifyContent: "center" },
  headerCell: { backgroundColor: "#F4F6F8" },
  headerText: { fontWeight: "600" },
  cellText: { color: "#333" },

  checkboxCell: { width: 50, alignItems: "center", justifyContent: "center" },

  menuCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 18, color: "#555" },
  sortIcon: { fontSize: 12, marginLeft: 4, color: "#666", fontWeight: "500" },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBox: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 340,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#F2F2F2",
    color: "#666",
  },

  selectWrap: { position: "relative", marginBottom: 10 },

  dropdownMenu: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },

  dropdownItem2: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },

  cancelButton: { borderWidth: 1, borderColor: "#305685", width: "48%" },
  confirmButton: { backgroundColor: "#305685", width: "48%" },

  cancelText: { color: "#305685", fontWeight: "600", textAlign: "center" },
  confirmText: { color: "#FFF", fontWeight: "600", textAlign: "center" },
});
