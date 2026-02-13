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
  useWindowDimensions,
} from "react-native";
import Checkbox from "expo-checkbox";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: 100, sortable: true },
  { key: "department", title: "부서", width: 155, sortable: true },
  { key: "engineeringPart", title: "ENGINEERING 구분", width: 200, sortable: true },
  { key: "position", title: "직급", width: 90, sortable: true },
  { key: "date", title: "입사일", width: 140, sortable: true },
  { key: "location", title: "근무지", width: 83, sortable: true },
  { key: "mail", title: "메일", width: 203, sortable: true },
  { key: "role", title: "권한", width: 120, sortable: true },
  { key: "status", title: "상태", width: 250, sortable: true },
  { key: "actions", title: "", width: 56, sortable: false },
];

const BASE_ROLE = "일반";
const ROLE_MAP = {
  GENERAL: "일반",
  ADMIN: "관리자",
  MANAGER: "결재자",
};
const ENGINEERING_DEPT_ID = 3;
const ENGINEERING_SUB_DEPTS = [
  { label: "AMS", value: 1 },
  { label: "BWMS", value: 2 },
  { label: "SWBD-1", value: 3 },
  { label: "SWBD-2", value: 4 },
  { label: "설계", value: 5 },
];
const DEFAULT_POSITIONS = [
  "사원",
  "주임",
  "대리",
  "과장",
  "차장",
  "부장",
  "이사",
  "전무",
  "대표"
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
  const shouldScroll = options.length > 5;
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
        <View
          style={[
            styles.dropdownMenu,
            shouldScroll && styles.dropdownMenuScroll,
          ]}
        >
          <ScrollView
            style={shouldScroll && styles.dropdownScroll}
            contentContainerStyle={styles.dropdownScrollContent}
          >
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={styles.dropdownItem2}
                onPress={() => onSelect(opt.value)}
              >
                <Text>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
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

function normalizeRoles(value) {
  if (!value) return [BASE_ROLE];
  if (Array.isArray(value)) {
    const cleaned = value
      .flatMap((v) => {
        if (!v) return [];
        if (typeof v === "string") return [v];
        return [v.name, v.role, v.authorityName].filter(Boolean);
      })
      .map((v) => String(v).trim())
      .map((v) => ROLE_MAP[v.toUpperCase()] ?? v);
    return Array.from(new Set([BASE_ROLE, ...cleaned]));
  }
  if (typeof value === "string") {
    const parts = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => ROLE_MAP[v.toUpperCase()] ?? v);
    return Array.from(new Set([BASE_ROLE, ...parts]));
  }
  return [BASE_ROLE];
}

function ensureGeneral(values) {
  const normalized = normalizeRoles(values);
  return normalized.includes(BASE_ROLE)
    ? normalized
    : [BASE_ROLE, ...normalized];
}

export default function Setting() {
  const { height: windowHeight } = useWindowDimensions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const [modalVisible, setModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [birthModalVisible, setBirthModalVisible] = useState(false);
  const [birthEmployeeId, setBirthEmployeeId] = useState(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuItem, setActionMenuItem] = useState(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState(null);
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [roles, setRoles] = useState([BASE_ROLE]);
  const [accountStatus, setAccountStatus] = useState("ACTIVE");
  const [originalStatus, setOriginalStatus] = useState("ACTIVE");
  const [subDepartment, setSubDepartment] = useState("");

  const [filterDepartments, setFilterDepartments] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterRoles, setFilterRoles] = useState([]);
  const [filterLocations, setFilterLocations] = useState([]);
  const [filterSubDepartments, setFilterSubDepartments] = useState([]);

  const activeCount = useMemo(
    () => data.filter((x) => x.status === "ACTIVE").length,
    [data],
  );

  const inactiveCount = useMemo(
    () => data.filter((x) => x.status === "INACTIVE").length,
    [data],
  );

  const notCreatedCount = useMemo(
    () => data.filter((x) => x.status === "NOT_CREATED").length,
    [data],
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
    [],
  );

  const getEngineeringLabel = (value) =>
    ENGINEERING_SUB_DEPTS.find((v) => v.value === value)?.label ?? "";

  const ROLES = useMemo(
    () => [
      { label: "일반", value: "일반" },
      { label: "관리자", value: "관리자" },
      { label: "결재자", value: "결재자" },
    ],
    [],
  );

  const LOCATIONS = useMemo(
    () => [
      { label: "송정", value: "송정" },
      { label: "반룡", value: "반룡" },
    ],
    [],
  );

  const resetForm = () => {
    setName("");
    setDepartment(null);
    setPosition("");
    setHireDate("");
    setBirthDate("");
    setEmail("");
    setRoles([BASE_ROLE]);
    setLocation("");
    setAccountStatus("ACTIVE");
    setOriginalStatus("ACTIVE");
    setSubDepartment("");
    setOpenDropdown(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    setOpenDropdown(null);
  };

  const closeBirthModal = () => {
    setBirthModalVisible(false);
    setBirthEmployeeId(null);
    setBirthDate("");
  };

  const openCreateModal = () => {
    setMode("create");
    setEditingId(null);
    setEditingEmployeeId(null);
    resetForm();
    setModalVisible(true);
  };

  const openBirthModal = (item) => {
    setBirthEmployeeId(item?.id ?? null);
    setBirthDate("");
    setBirthModalVisible(true);
  };

  const openActionMenu = (item) => {
    setActionMenuItem(item ?? null);
    setActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
    setActionMenuItem(null);
  };

  const validateForm = () => {
    const mustHaveRole = mode === "create";
    const mustHaveEmail = mode === "create";
    const normalizedRoles = ensureGeneral(roles);
    const mustHaveSubDepartment =
      department === ENGINEERING_DEPT_ID && !subDepartment;

    if (
      !name ||
      (mustHaveEmail && !email) ||
      !department ||
      !position ||
      !hireDate ||
      !location ||
      (mustHaveRole && normalizedRoles.length === 0) ||
      mustHaveSubDepartment
    ) {
      Alert.alert("확인", "모든 항목을 다 채워주세요.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const normalizedRoles = ensureGeneral(roles);
    const payload = {
      name,
      level: position,
      departmentId: department,
      hireDate,
      location,
      roles: normalizedRoles,
    };
    if (department === ENGINEERING_DEPT_ID && subDepartment) {
      payload.engineeringPartId = subDepartment;
    }

    if (mode === "create") {
      payload.email = email;
    }
    if (mode === "edit") {
      payload.employeeId = editingEmployeeId ?? editingId;
      payload.accountStatus = accountStatus;
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
          subDepartment: (() => {
            const raw =
              e.engineeringPart?.id ??
              e.engineeringPartId ??
              e.subDepartment ??
              e.sub_department ??
              e.team ??
              e.part ??
              "";
            if (typeof raw === "number") return raw;
            const label = String(raw || "").trim();
            const match = ENGINEERING_SUB_DEPTS.find((v) => v.label === label);
            return match ? match.value : "";
          })(),
          roles: normalizeRoles(e.roles ?? e.role),
          id: e.id,
          employeeId: e.employeeId ?? e.employee_id ?? e.empId ?? e.emp_id,
          name: e.name,
          department: e.department,
          departmentId: e.department?.id ?? null,
          position: e.level ?? "",
          date: e.hireDate ?? "",
          location: e.location ?? "",
          mail: e.email ?? "",
          role: normalizeRoles(e.roles ?? e.role).join(", "),
          status: e.accountStatus,
          userId: e.user?.id,
        })),
      );
    } catch (e) {
      console.log(
        "employee list error:",
        e?.response?.status,
        e?.response?.data,
      );
      setError("직원 목록을 불러오지 못 했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeList();
  }, []);

  useEffect(() => {
    if (!filterDepartments.includes(ENGINEERING_DEPT_ID)) {
      setFilterSubDepartments([]);
    }
  }, [filterDepartments]);

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
      setEditingUserId(null);
      setEditingEmployeeId(null);
    } catch (err) {
      console.error("계정 수정 실패", err);
      Alert.alert("실패", "계정 수정에 실패했습니다.");
    }
  };

  const registerBirthDate = async () => {
    if (!birthEmployeeId) {
      Alert.alert("오류", "직원을 찾지 못했습니다.");
      return;
    }
    if (!birthDate) {
      Alert.alert("확인", "출산일을 입력해주세요.");
      return;
    }

    try {
      await api.post("/spouse-maternity/birth", {
        employeeId: birthEmployeeId,
        birthDate,
      });
      await fetchEmployeeList();
      closeBirthModal();
    } catch (err) {
      console.error("출산일 등록 실패", err);
      Alert.alert("실패", "출산일 등록에 실패했습니다.");
    }
  };

  const statusUser = async (item) => {
    const userId = item?.userId;
    if (!userId) {
      Alert.alert("오류", "계정(User) ID가 없습니다.");
      return;
    }

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

  const startEdit = (item) => {
    setMode("edit");
    setEditingId(item.id);
    setEditingEmployeeId(item.employeeId ?? null);
    setEditingUserId(item.userId ?? null);

    setName(item.name ?? "");
    setPosition(item.position ?? "");
    setHireDate(item.date ?? "");
    setLocation(item.location ?? "");
    setEmail(item.mail ?? "");
    setDepartment(item.departmentId ?? item.department?.id ?? null);
    setRoles(ensureGeneral(item.roles ?? item.role));
    setSubDepartment(item.subDepartment ?? "");
    setAccountStatus(item.status ?? "ACTIVE");
    setOriginalStatus(item.status ?? "ACTIVE");

    setOpenDropdown(null);
    setModalVisible(true);
  };

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            {col.key === "department" ? (
              <Text style={styles.cellText}>
                {(() => {
                  const deptId = item?.departmentId ?? item?.department?.id;
                  const deptLabel = DEPARTMENTS.find(
                    (d) => d.value === deptId,
                  )?.label;
                  return deptLabel ?? item[col.key];
                })()}
              </Text>
            ) : col.key === "engineeringPart" ? (
              <Text style={styles.cellText}>
                {(() => {
                  const deptId = item?.departmentId ?? item?.department?.id;
                  if (deptId !== ENGINEERING_DEPT_ID) return "-";
                  return getEngineeringLabel(item?.subDepartment) || "-";
                })()}
              </Text>
            ) : col.key === "status" ? (
              <Text style={styles.cellText}>{statusLabel(item.status)}</Text>
            ) : col.key === "actions" ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => openActionMenu(item)}
              >
                <Text style={styles.moreButtonText}>⋮</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.cellText}>
                {typeof item[col.key] === "object"
                  ? item[col.key]?.name
                  : item[col.key]}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const departmentText = department
    ? DEPARTMENTS.find((d) => d.value === department)?.label
    : "";
  const subDepartmentText = subDepartment
    ? getEngineeringLabel(subDepartment) || String(subDepartment)
    : "";
  const locationText = location || "";

  const filteredData = data.filter((item) => {
    const deptId = item?.departmentId ?? item?.department?.id ?? null;
    if (filterDepartments.length > 0 && !filterDepartments.includes(deptId)) {
      return false;
    }
    if (
      filterSubDepartments.length > 0 &&
      (deptId !== ENGINEERING_DEPT_ID ||
        !filterSubDepartments.includes(item?.subDepartment))
    ) {
      return false;
    }
    if (filterStatuses.length > 0 && !filterStatuses.includes(item?.status)) {
      return false;
    }
    const itemRole = String(item?.role ?? "").trim();
    if (filterRoles.length > 0 && !filterRoles.includes(itemRole)) {
      return false;
    }
    if (
      filterLocations.length > 0 &&
      !filterLocations.includes(item?.location)
    ) {
      return false;
    }
    return true;
  });

  const TABLE_MAX_HEIGHT = 520;
  const tableHeight = Math.min(
    TABLE_MAX_HEIGHT,
    Math.max(320, windowHeight - 360),
  );

  return (
    <View style={styles.page}>
      <View style={styles.filterCard}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>
              직원 수 {filteredData.length}
              {loading ? " (로딩중...)" : ""}
            </Text>
            <Text style={styles.countText}>
              활성화 {activeCount} · 비활성화 {inactiveCount} · 생성되지 않음{" "}
              {notCreatedCount}
            </Text>
          </View>
        </View>

        {!!error && <Text style={{ color: "red", marginTop: 6 }}>{error}</Text>}

        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>부서</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={[
                    styles.checkboxItem,
                    filterDepartments.length === 0 && styles.checkboxItemActive,
                  ]}
                  onPress={() => setFilterDepartments([])}
                >
                  <Checkbox
                    value={filterDepartments.length === 0}
                    onValueChange={() => setFilterDepartments([])}
                    color="#121D6D"
                  />
                  <Text style={styles.checkboxText}>전체</Text>
                </TouchableOpacity>
                {DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={String(dept.value)}
                    style={[
                      styles.checkboxItem,
                      filterDepartments.includes(dept.value) &&
                        styles.checkboxItemActive,
                    ]}
                    onPress={() => {
                      setFilterDepartments((prev) =>
                        prev.includes(dept.value)
                          ? prev.filter((v) => v !== dept.value)
                          : [...prev, dept.value],
                      );
                    }}
                  >
                    <Checkbox
                      value={filterDepartments.includes(dept.value)}
                      onValueChange={() => {
                        setFilterDepartments((prev) =>
                          prev.includes(dept.value)
                            ? prev.filter((v) => v !== dept.value)
                            : [...prev, dept.value],
                        );
                      }}
                      color="#121D6D"
                    />
                    <Text style={styles.checkboxText}>{dept.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {filterDepartments.includes(ENGINEERING_DEPT_ID) && (
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>ENGINEERING 구분</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxItem,
                      filterSubDepartments.length === 0 &&
                        styles.checkboxItemActive,
                    ]}
                    onPress={() => setFilterSubDepartments([])}
                  >
                    <Checkbox
                      value={filterSubDepartments.length === 0}
                      onValueChange={() => setFilterSubDepartments([])}
                      color="#121D6D"
                    />
                    <Text style={styles.checkboxText}>전체</Text>
                  </TouchableOpacity>
                  {ENGINEERING_SUB_DEPTS.map((sub) => (
                    <TouchableOpacity
                      key={sub.value}
                      style={[
                        styles.checkboxItem,
                        filterSubDepartments.includes(sub.value) &&
                          styles.checkboxItemActive,
                      ]}
                      onPress={() =>
                        setFilterSubDepartments((prev) =>
                          prev.includes(sub.value)
                            ? prev.filter((v) => v !== sub.value)
                            : [...prev, sub.value],
                        )
                      }
                    >
                      <Checkbox
                        value={filterSubDepartments.includes(sub.value)}
                        onValueChange={() =>
                          setFilterSubDepartments((prev) =>
                            prev.includes(sub.value)
                              ? prev.filter((v) => v !== sub.value)
                              : [...prev, sub.value],
                          )
                        }
                        color="#121D6D"
                      />
                      <Text style={styles.checkboxText}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>직원 목록</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
            <Text style={styles.addBtnText}>계정 추가</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={[styles.tableWrap, { height: tableHeight }]}>
            <View style={{ flex: 1 }}>
              {renderHeader()}
              <FlatList
                data={filteredData}
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
      </View>

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
                  prev === "department" ? null : "department",
                )
              }
              options={DEPARTMENTS}
              onSelect={(v) => {
                setDepartment(v);
                if (v !== ENGINEERING_DEPT_ID) {
                  setSubDepartment("");
                }
                setOpenDropdown(null);
              }}
              zIndex={30}
            />

            {department === ENGINEERING_DEPT_ID && (
              <SelectField
                placeholder="ENGINEERING 구분 선택"
                valueText={subDepartmentText}
                open={openDropdown === "subDepartment"}
                onToggle={() =>
                  setOpenDropdown((prev) =>
                    prev === "subDepartment" ? null : "subDepartment",
                )
              }
                options={ENGINEERING_SUB_DEPTS}
                onSelect={(v) => {
                  setSubDepartment(v);
                  setOpenDropdown(null);
                }}
                zIndex={25}
              />
            )}

            <SelectField
              placeholder="직급 선택"
              valueText={position}
              open={openDropdown === "position"}
              onToggle={() =>
                setOpenDropdown((prev) =>
                  prev === "position" ? null : "position",
                )
              }
              options={DEFAULT_POSITIONS.map((v) => ({ label: v, value: v }))}
              onSelect={(v) => {
                setPosition(v);
                setOpenDropdown(null);
              }}
              zIndex={22}
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

            <View style={styles.roleGroup}>
              <Text style={styles.filterLabel}>권한</Text>
              <View style={styles.checkboxRow}>
                {ROLES.map((opt) => {
                  const checked = roles.includes(opt.value);
                  const isGeneral = opt.value === BASE_ROLE;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.checkboxItem,
                        checked && styles.checkboxItemActive,
                        isGeneral && styles.checkboxItemLocked,
                      ]}
                      onPress={() => {
                        if (isGeneral) return;
                        setRoles((prev) => {
                          const next = prev.includes(opt.value)
                            ? prev.filter((v) => v !== opt.value)
                            : [...prev, opt.value];
                          return ensureGeneral(next);
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Checkbox
                        value={checked}
                        onValueChange={() => {
                          if (isGeneral) return;
                          setRoles((prev) => {
                            const next = prev.includes(opt.value)
                              ? prev.filter((v) => v !== opt.value)
                              : [...prev, opt.value];
                            return ensureGeneral(next);
                          });
                        }}
                        color="#121D6D"
                        disabled={isGeneral}
                      />
                      <Text style={styles.checkboxText}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <SelectField
              placeholder="근무지 선택"
              valueText={locationText}
              open={openDropdown === "location"}
              onToggle={() =>
                setOpenDropdown((prev) =>
                  prev === "location" ? null : "location",
                )
              }
              options={LOCATIONS}
              onSelect={(v) => {
                setLocation(v);
                setOpenDropdown(null);
              }}
              zIndex={10}
            />

            {mode === "edit" && (
              <View style={styles.roleGroup}>
                <Text style={styles.filterLabel}>상태</Text>
                <View style={styles.checkboxRow}>
                  {[
                    { label: "활성화", value: "ACTIVE" },
                    { label: "비활성화", value: "INACTIVE" },
                  ].map((opt) => {
                    const checked = accountStatus === opt.value;
                    const locked = accountStatus === "NOT_CREATED";
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.checkboxItem,
                          checked && styles.checkboxItemActive,
                          locked && styles.checkboxItemLocked,
                        ]}
                        onPress={() => {
                          if (locked) return;
                          setAccountStatus(opt.value);
                        }}
                        activeOpacity={0.7}
                      >
                        <Checkbox
                          value={checked}
                          onValueChange={() => {
                            if (locked) return;
                            setAccountStatus(opt.value);
                          }}
                          color="#121D6D"
                          disabled={locked}
                        />
                        <Text style={styles.checkboxText}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {accountStatus === "NOT_CREATED" ? (
                    <View
                      style={[styles.checkboxItem, styles.checkboxItemLocked]}
                    >
                      <Checkbox value={false} color="#121D6D" disabled />
                      <Text style={styles.checkboxText}>생성되지 않음</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

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

      <Modal
        visible={birthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBirthModal}
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
            <Text style={styles.modalTitle}>출산일 등록</Text>

            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(t) => setBirthDate(formatYYYYMMDD(t))}
              placeholder="출산일 (YYYY-MM-DD)"
              keyboardType="number-pad"
              onFocus={() => setOpenDropdown(null)}
              maxLength={10}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={registerBirthDate}
              >
                <Text style={styles.confirmText}>등록</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  closeBirthModal();
                }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeActionMenu}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={closeActionMenu}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.actionMenuBox}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (!actionMenuItem) return;
                closeActionMenu();
                startEdit(actionMenuItem);
              }}
            >
              <Text style={styles.actionMenuText}>계정 수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (!actionMenuItem) return;
                closeActionMenu();
                openBirthModal(actionMenuItem);
              }}
            >
              <Text style={styles.actionMenuText}>출산일 등록</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#F3F4F6",
    flex: 1,
    gap: 16,
  },
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 14,
  },
  filterRow: {
    gap: 12,
  },
  filterRowLine: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 10,
    padding: 5,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  checkboxItemActive: {
    borderColor: "#94A3B8",
  },
  checkboxItemLocked: {
    opacity: 0.7,
  },
  checkboxText: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "600",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  countText: { fontSize: 12, color: "#64748B" },
  titleRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  addBtn: {
    backgroundColor: "#121D6D",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    minHeight: 240,
  },
  tableScrollContent: {
    minWidth: "100%",
  },
  tableWrap: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  moreButton: {
    width: 36,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  moreButtonText: {
    fontSize: 18,
    lineHeight: 18,
    color: "#0F172A",
    fontWeight: "700",
  },

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

  sortIcon: { fontSize: 12, marginLeft: 4, color: "#666", fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.42)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 380,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0F172A",
  },
  actionMenuBox: {
    width: 220,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 6,
  },
  actionMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  actionMenuItemLast: {
    borderBottomWidth: 0,
  },
  actionMenuText: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    outlineStyle: "none",
    outlineWidth: 0,
  },
  disabledInput: {
    backgroundColor: "#F8FAFC",
    color: "#94A3B8",
    borderColor: "#E2E8F0",
  },

  selectWrap: { position: "relative", marginBottom: 10 },

  dropdownMenu: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  dropdownMenuScroll: {
    maxHeight: 240,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownScrollContent: {
    paddingVertical: 2,
  },

  dropdownItem2: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  modalButton: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    width: "48%",
  },
  confirmButton: {
    backgroundColor: "#121D6D",
    borderWidth: 1,
    borderColor: "#121D6D",
    width: "48%",
  },

  cancelText: { color: "#334155", fontWeight: "600", textAlign: "center" },
  confirmText: { color: "#FFF", fontWeight: "600", textAlign: "center" },

  subCountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: -6,
    marginBottom: 12,
  },

  subCountText: {
    color: "#64748B",
    fontSize: 13,
  },
});
