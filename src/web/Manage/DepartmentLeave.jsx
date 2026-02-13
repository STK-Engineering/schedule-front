import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: 200, sortable: true },
  { key: "level", title: "직급", width: 200, sortable: true },
  { key: "totalDays", title: "총 연차", width: 200, sortable: true },
  { key: "usedDays", title: "사용 연차", width: 200, sortable: true },
  { key: "remainingDays", title: "잔여 연차", width: 200, sortable: true },
  { key: "hireDate", title: "입사일", width: 140, sortable: true },
];

function formatDays(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

export default function DepartmentLeave() {
  const currentYear = new Date().getFullYear();
  const minYear = 2026;
  const maxYear = currentYear + 1;
  const [year, setYear] = useState(Math.max(currentYear, minYear));
  const [deptMap, setDeptMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [rows, setRows] = useState([]);
  const [nameQuery, setNameQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    let mounted = true;

    const fetchList = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/balances/department", {
          params: { year },
        });

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
        setSelectedDept([]);
        setSort({ key: null, direction: "asc" });
        const allRows = deptList.map((d) => deptEntries[d] ?? []).flat();
        setRows(allRows);
      } catch (e) {
        console.log("ERR message:", e?.message);
        console.log("ERR status:", e?.response?.status);
        console.log("ERR data:", e?.response?.data);
        console.log(
          "REQ full url:",
          `${e?.config?.baseURL ?? ""}${e?.config?.url ?? ""}`,
        );

        if (!mounted) return;
        setError("목록을 불러오지 못 했습니다.");
        setDeptMap({});
        setDepartments([]);
        setSelectedDept([]);
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchList();

    return () => {
      mounted = false;
    };
  }, [year]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") direction = "desc";

    const sorted = [...rows].sort((a, b) => {
      const fromEmployee =
        key === "name" || key === "level" || key === "hireDate";
      const av = fromEmployee ? (a?.employee?.[key] ?? "") : a?.[key];
      const bv = fromEmployee ? (b?.employee?.[key] ?? "") : b?.[key];
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
          <Text style={styles.cellText}>{formatDays(item?.totalDays)}일</Text>
        </View>
        <View style={[styles.cell, { width: columns[3].width }]}>
          <Text style={styles.cellText}>{formatDays(item?.usedDays)}일</Text>
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
    <View style={styles.page}>
      <View style={styles.filterCard}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>부서별 연차 일수 조회</Text>
            <Text style={styles.countText}>총 {departments.length}개 부서</Text>
          </View>
          <View style={styles.yearControl}>
            {year > minYear && (
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setYear((prev) => Math.max(minYear, prev - 1))}
              >
                <Text style={styles.yearButtonText}>{"<"}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.yearText}>{year}년</Text>
            {year < maxYear && (
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setYear((prev) => Math.min(maxYear, prev + 1))}
              >
                <Text style={styles.yearButtonText}>{">"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!loading && (
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>부서 필터</Text>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={[
                    styles.checkboxItem,
                    selectedDept.length === 0 && styles.checkboxItemActive,
                  ]}
                  onPress={() => {
                    const allRows = departments
                      .map((d) => deptMap[d] ?? [])
                      .flat();
                    setSelectedDept([]);
                    setRows(allRows);
                  }}
                >
                  <Checkbox
                    value={selectedDept.length === 0}
                    onValueChange={() => {
                      const allRows = departments
                        .map((d) => deptMap[d] ?? [])
                        .flat();
                      setSelectedDept([]);
                      setRows(allRows);
                    }}
                    color="#121D6D"
                  />
                  <Text style={styles.checkboxText}>전체</Text>
                </TouchableOpacity>

                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[
                      styles.checkboxItem,
                      selectedDept.includes(dept) && styles.checkboxItemActive,
                    ]}
                    onPress={() => {
                      setSelectedDept((prev) => {
                        const next = prev.includes(dept)
                          ? prev.filter((d) => d !== dept)
                          : [...prev, dept];
                        const nextRows = next.length
                          ? next.map((d) => deptMap[d] ?? []).flat()
                          : departments.map((d) => deptMap[d] ?? []).flat();
                        setRows(nextRows);
                        return next;
                      });
                    }}
                  >
                    <Checkbox
                      value={selectedDept.includes(dept)}
                      onValueChange={() => {
                        setSelectedDept((prev) => {
                          const next = prev.includes(dept)
                            ? prev.filter((d) => d !== dept)
                            : [...prev, dept];
                          const nextRows = next.length
                            ? next.map((d) => deptMap[d] ?? []).flat()
                            : departments.map((d) => deptMap[d] ?? []).flat();
                          setRows(nextRows);
                          return next;
                        });
                      }}
                      color="#121D6D"
                    />
                    <Text style={styles.checkboxText}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.searchGroup}>
              <Text style={styles.filterLabel}>검색</Text>
              <TextInput
                value={nameQuery}
                onChangeText={setNameQuery}
                placeholder="이름 검색"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>조회 결과</Text>
        </View>
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#64748B" }}>
              불러오는 중...
            </Text>
          </View>
        )}

        {!!error && !loading && (
          <Text style={{ color: "#EF4444", marginBottom: 10 }}>{error}</Text>
        )}

        {!loading && (
          <ScrollView
            horizontal
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={styles.tableWrap}>
              {renderHeader()}
              <View style={styles.tableBody}>
                <FlatList
                  key={`${selectedDept.join(",")}-${nameQuery}`}
                  data={
                    nameQuery.trim()
                      ? rows.filter((item) =>
                          String(item?.employee?.name ?? "")
                            .toLowerCase()
                            .includes(nameQuery.trim().toLowerCase()),
                        )
                      : rows
                  }
                  keyExtractor={(item, index) =>
                    `${selectedDept.join(",")}-${item?.employee?.email ?? index}`
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
            </View>
          </ScrollView>
        )}
      </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  countText: { fontSize: 12, color: "#64748B" },
  filterRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  filterGroup: {
    flex: 1,
    minWidth: 280,
  },
  searchGroup: {
    width: 300,
  },
  filterLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  checkboxItemActive: {
    borderColor: "#94A3B8",
  },
  checkboxText: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "600",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  yearControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  yearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  yearButtonText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  yearText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    minHeight: 240,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  tableHint: {
    fontSize: 12,
    color: "#64748B",
  },
  tableScrollContent: {
    minWidth: "100%",
  },
  tableWrap: {
    width: "100%",
  },
  tableBody: {
    height: 520,
  },
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
});
