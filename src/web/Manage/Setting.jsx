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
  { key: "name", title: "이름", width: 130, sortable: true },
  { key: "department", title: "부서", width: 180, sortable: true },
  { key: "position", title: "직급", width: 110, sortable: true },
  { key: "date", title: "입사일", width: 180, sortable: true },
  { key: "mail", title: "메일", width: 220, sortable: true },
  { key: "auth", title: "권한", width: 140, sortable: true },
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
  label,
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

export default function Setting() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const [modalVisible, setModalVisible] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState(null);
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");

  const DEPARTMENTS = useMemo(
    () => [
      { label: "MANAGEMENT", value: 1 },
      { label: "Sales&Marketing", value: 2 },
      { label: "ENGINEERING", value: 3 },
      { label: "IT/ISO", value: 4 },
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

  const sendData = async () => {
    if (
      !name ||
      !email ||
      !department ||
      !position ||
      !hireDate ||
      !location ||
      !role
    ) {
      alert("모든 항목을 다 채워주세요.");
      return;
    }

    const payload = {
      name,
      email,
      level: position,
      role,
      departmentId: department,
      hireDate,
      location,
    };

    try {
      const response = await api.post("/employees", payload);
      console.log("계정 추가 성공", response.data);

      resetForm();
      closeModal();
    } catch (err) {
      console.error("계정 추가 실패", err);
      Alert.alert("실패", "계정 추가에 실패했습니다.");
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchEmployeeList = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/employees");
        const list = res.data;

        if (!mounted) return;

        setData(
          list.map((e) => ({
            name: e.name,
            department: e.department,
            position: e.level,
            date: e.hireDate,
            mail: e.email,
            auth: e.role?.name ?? e.role ?? "",
          }))
        );
      } catch (e) {
        console.log(
          "employee list error:",
          e?.response?.status,
          e?.response?.data
        );
        if (!mounted) return;
        setError("직원 목록을 불러오지 못 했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEmployeeList();
    return () => {
      mounted = false;
    };
  }, []);

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
    </View>
  );

  const renderRow = ({ item, index }) => {
    const isOpen = openMenuId === index;

    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText}>
              {typeof item[col.key] === "object"
                ? item[col.key]?.name
                : item[col.key]}
            </Text>
          </View>
        ))}

        <View style={styles.moreWrapper}>
          <TouchableOpacity
            onPress={() => setOpenMenuId(isOpen ? null : index)}
          >
            <Text style={styles.moreText}>⋮</Text>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setOpenMenuId(null);
                  console.log("계정 수정", item);
                }}
              >
                <Text>계정 수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setOpenMenuId(null);
                  console.log("계정 삭제", item);
                }}
              >
                <Text style={{ color: "red" }}>계정 삭제</Text>
              </TouchableOpacity>
            </View>
          )}
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
        <Text style={styles.title}>직원 수({data.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>계정 추가</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ height: 520 }}>
          <View style={{ flex: 1 }}>
            {renderHeader()}
            <FlatList
              data={data}
              keyExtractor={(_, index) => String(index)}
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
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => {
            setOpenDropdown(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBox}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>계정 추가</Text>

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
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="메일"
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setOpenDropdown(null)}
              placeholderTextColor="#999"
            />

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
                onPress={sendData}
              >
                <Text style={styles.confirmText}>추가</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  closeModal();
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

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
  addBtnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },

  cell: {
    padding: 12,
    justifyContent: "center",
  },
  headerCell: {
    backgroundColor: "#F4F6F8",
  },
  headerText: {
    fontWeight: "600",
  },
  cellText: {
    color: "#333",
  },

  checkboxCell: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  moreText: {
    fontSize: 18,
    color: "#555",
  },
  sortIcon: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
    fontWeight: "500",
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

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  selectWrap: {
    position: "relative",
    marginBottom: 10,
  },

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

  dropdown: {
    position: "absolute",
    top: 24,
    right: 0,
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 8,
    zIndex: 999,

    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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

  cancelButton: {
    borderWidth: 1,
    borderColor: "#305685",
    width: "48%",
  },

  confirmButton: {
    backgroundColor: "#305685",
    width: "48%",
  },

  cancelText: {
    color: "#305685",
    fontWeight: "600",
    textAlign: "center",
  },

  confirmText: {
    color: "#FFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
