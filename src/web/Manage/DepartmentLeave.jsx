import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: 120, sortable: true },
  { key: "level", title: "직급", width: 120, sortable: true },
  { key: "totalDays", title: "총 연차", width: 120, sortable: true },
  { key: "usedDays", title: "사용 연차", width: 120, sortable: true },
  { key: "remainingDays", title: "잔여 연차", width: 120, sortable: true },
  { key: "hireDate", title: "입사일", width: 140, sortable: true },
];

function formatDays(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

export default function DepartmentLeave() {
  const [deptMap, setDeptMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    let mounted = true;

    const fetchList = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/balances/department");
        const payload = res.data ?? {};
        const deptEntries = Array.isArray(payload)
          ? payload.reduce((acc, item) => {
              const dept = item?.employee?.department?.name ?? "-";
              if (!acc[dept]) acc[dept] = [];
              acc[dept].push(item);
              return acc;
            }, {})
          : payload;

        if (!mounted) return;

        const deptList = Object.keys(deptEntries);
        setDeptMap(deptEntries);
        setDepartments(deptList);
        const firstDept = deptList[0] ?? "";
        setSelectedDept(firstDept);
        setRows(
          Array.isArray(deptEntries[firstDept]) ? deptEntries[firstDept] : []
        );
      } catch (e) {
        console.log("ERR message:", e?.message);
        console.log("ERR status:", e?.response?.status);
        console.log("ERR data:", e?.response?.data);
        console.log(
          "REQ full url:",
          `${e?.config?.baseURL ?? ""}${e?.config?.url ?? ""}`
        );

        if (!mounted) return;
        setError("목록을 불러오지 못 했습니다.");
        setDeptMap({});
        setDepartments([]);
        setSelectedDept("");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchList();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") direction = "desc";

    const sorted = [...rows].sort((a, b) => {
      const fromEmployee = key === "name" || key === "level" || key === "hireDate";
      const av = fromEmployee ? a?.employee?.[key] ?? "" : a?.[key];
      const bv = fromEmployee ? b?.employee?.[key] ?? "" : b?.[key];
      if (typeof av === "number" && typeof bv === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      if (as > bs) return direction === "asc" ? 1 : -1;
      if (as < bs) return direction === "asc" ? -1 : 1;
      return 0;
    });

    setSort({ key, direction });
    setRows(sorted);
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

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        <View style={[styles.cell, { width: columns[0].width }]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {item?.employee?.name ?? "-"}
          </Text>
        </View>
        <View style={[styles.cell, { width: columns[1].width }]}>
          <Text style={styles.cellText}>{item?.employee?.level ?? "-"}</Text>
        </View>
        <View style={[styles.cell, { width: columns[2].width }]}>
          <Text style={styles.cellText}>
            {formatDays(item?.totalDays)}일
          </Text>
        </View>
        <View style={[styles.cell, { width: columns[3].width }]}>
          <Text style={styles.cellText}>
            {formatDays(item?.usedDays)}일
          </Text>
        </View>
        <View style={[styles.cell, { width: columns[4].width }]}>
          <Text style={styles.cellText}>
            {formatDays(item?.remainingDays)}일
          </Text>
        </View>
        <View style={[styles.cell, { width: columns[5].width }]}>
          <Text style={styles.cellText}>{item?.employee?.hireDate ?? "-"}</Text>
        </View>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.title}>
        부서별 연차 일수 조회 ({departments.length})
      </Text>

      {loading && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#64748B" }}>불러오는 중...</Text>
        </View>
      )}

      {!!error && !loading && (
        <Text style={{ color: "#EF4444", marginBottom: 10 }}>{error}</Text>
      )}

      {!loading && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.deptTabs}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.deptTab,
                    selectedDept === dept && styles.deptTabActive,
                  ]}
                  onPress={() => {
                    setSelectedDept(dept);
                    setRows(Array.isArray(deptMap[dept]) ? deptMap[dept] : []);
                  }}
                >
                  <Text
                    style={[
                      styles.deptTabText,
                      selectedDept === dept && styles.deptTabTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal>
            <View>
              {renderHeader()}
              <FlatList
                key={selectedDept}
                data={rows}
                keyExtractor={(item, index) =>
                  `${selectedDept}-${item?.employee?.email ?? index}`
                }
                renderItem={renderRow}
                style={{ flex: 1 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                removeClippedSubviews={false}
                initialNumToRender={10}
                windowSize={7}
              />
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#EEE" },

  cell: { padding: 12, justifyContent: "center" },
  headerText: { fontWeight: "600" },
  sortIcon: { color: "#64748B", fontWeight: "600" },
  cellText: { color: "#333" },
  deptTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  deptTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  deptTabActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  deptTabText: {
    color: "#334155",
    fontWeight: "600",
  },
  deptTabTextActive: {
    color: "#FFFFFF",
  },
});
