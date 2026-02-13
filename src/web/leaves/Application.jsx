import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import Checkbox from "expo-checkbox";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: "10%", sortable: true },
  { key: "department", title: "부서", width: "15%", sortable: true },
  { key: "type", title: "유형", width: "10%", sortable: true },
  { key: "date", title: "사용일자", width: "20%", sortable: true },
  { key: "reason", title: "사유", width: "15%", sortable: true },
  { key: "etc", title: "기타사항", width: "23%", sortable: true },
];

function formatPeriod(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}

function toLeaveCategory(type) {
  if (["연차", "오전반차", "오후반차"].includes(type)) return type;
  if (["건강검진", "예비군", "특별보상휴가", "무급"].includes(type)) {
    return "기타";
  }
  return "경조사";
}

export default function Application() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [nameQuery, setNameQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    let mounted = true;

    const fetchList = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/leaves");
        const list = Array.isArray(res.data) ? res.data : [];

        if (!mounted) return;

        const mapped = list.map((e) => ({
          id: e.id, 
          name: e.employee?.name ?? "-",
          department: e.employee?.department?.name ?? "-",
          type: e.leaveType ?? "-",
          category: toLeaveCategory(e.leaveType ?? "-"),
          date: formatPeriod(e.startDate, e.endDate),
          reason: e.reason ?? "-",
          etc: e.etc ?? "-",
        }));

        setData(mapped);
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
        setData([]);
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

    const sorted = [...data].sort((a, b) => {
      const av = a?.[key] ?? "";
      const bv = b?.[key] ?? "";
      if (String(av) > String(bv)) return direction === "asc" ? 1 : -1;
      if (String(av) < String(bv)) return direction === "asc" ? -1 : 1;
      return 0;
    });

    setSort({ key, direction });
    setData(sorted);
  };

  const downloadSelected = async () => {
    const targets = typeFilteredData.filter((item) =>
      selectedIds.has(item.id)
    );
    if (targets.length === 0) {
      Alert.alert("알림", "선택된 항목이 없습니다.");
      return;
    }

    for (const item of targets) {
      try {
        const res = await api.get(`/leaves/${item.id}/download`, {
          responseType: "blob",
        });

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `Leave_application_form_${item.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.log("bulk download error:", item?.id, e?.response?.status);
      }
    }
  };

  const toggleSelectAll = () => {
    if (typeFilteredData.length === 0) return;
    const next = new Set(selectedIds);
    const allSelected = typeFilteredData.every((item) => next.has(item.id));
    if (allSelected) {
      typeFilteredData.forEach((item) => next.delete(item.id));
    } else {
      typeFilteredData.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <View style={styles.checkCell}>
        <Checkbox
          value={
            typeFilteredData.length > 0 &&
            typeFilteredData.every((item) => selectedIds.has(item.id))
          }
          onValueChange={toggleSelectAll}
          color="#121D6D"
        />
      </View>
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
      <View style={styles.moreHeaderCell} />
    </View>
  );

  const filteredData = nameQuery.trim()
    ? data.filter((item) =>
        String(item?.name ?? "")
          .toLowerCase()
          .includes(nameQuery.trim().toLowerCase())
      )
    : data;

  const typeFilteredData =
    selectedTypes.length > 0
      ? filteredData.filter((item) => selectedTypes.includes(item.category))
      : filteredData;

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        <View style={styles.checkCell}>
          <Checkbox
            value={selectedIds.has(item.id)}
            onValueChange={() => toggleSelectOne(item.id)}
            color="#121D6D"
          />
        </View>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText} numberOfLines={1}>
              {item[col.key]}
            </Text>
          </View>
        ))}

      </View>
    );
  };

  return (
    <View style={styles.page}>
      <View style={styles.filterCard}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>휴가 신청 목록</Text>
          <Text style={styles.countText}>
            {typeFilteredData.length}/{data.length}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>유형 필터</Text>
            <View style={styles.checkboxRow}>
              <FilterCheckbox
                label="전체"
                checked={selectedTypes.length === 0}
                onChange={() => setSelectedTypes([])}
              />
              {["연차", "오전반차", "오후반차", "경조사", "기타"].map((type) => (
                <FilterCheckbox
                  key={type}
                  label={type}
                  checked={selectedTypes.includes(type)}
                  onChange={() => {
                    setSelectedTypes((prev) =>
                      prev.includes(type)
                        ? prev.filter((t) => t !== type)
                        : [...prev, type]
                    );
                  }}
                />
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
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>신청 내역</Text>
          <TouchableOpacity
            style={[
              styles.downloadBtn,
              selectedIds.size === 0 && styles.downloadBtnDisabled,
            ]}
            onPress={downloadSelected}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.downloadBtnText}>선택 다운로드</Text>
          </TouchableOpacity>
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
          <ScrollView horizontal contentContainerStyle={styles.tableScrollContent}>
            <View style={styles.tableWrap}>
              {renderHeader()}
              <View style={styles.tableBody}>
                <FlatList
                  data={typeFilteredData}
                  keyExtractor={(item) => String(item.id)}
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

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <TouchableOpacity
      style={[styles.checkboxItem, checked && styles.checkboxItemActive]}
      onPress={onChange}
      activeOpacity={0.7}
    >
      <Checkbox value={checked} onValueChange={onChange} color="#121D6D" />
      <Text style={styles.checkboxText}>{label}</Text>
    </TouchableOpacity>
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
  downloadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#121D6D",
  },
  downloadBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  downloadBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
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

  checkCell: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  cell: { padding: 12, justifyContent: "center" },
  headerText: { fontWeight: "600" },
  sortIcon: { color: "#64748B", fontWeight: "600" },
  cellText: { color: "#333" },

});
