import React, { useState, useEffect } from "react";
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
  { key: "department", title: "부서", width: 140, sortable: true },
  { key: "type", title: "유형", width: 90, sortable: true },
  { key: "date", title: "사용일자", width: 200, sortable: true },
  { key: "reason", title: "사유", width: 200, sortable: true },
  { key: "etc", title: "기타사항", width: 232, sortable: true }
];

function formatPeriod(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}

export default function Application() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [openMenuId, setOpenMenuId] = useState(null);

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
          name: e.employee?.name ?? "-",
          department: e.employee?.department?.name ?? "-",
          type: e.leaveType ?? "-",
          date: formatPeriod(e.startDate, e.endDate),
          reason: e.reason ?? "-",
          etc: e.etc ?? "-"
        }));

        setData(mapped);
      } catch (e) {
        console.log("ERR message:", e?.message);
        console.log("ERR status:", e?.response?.status);
        console.log("ERR data:", e?.response?.data);
        console.log("REQ full url:", `${e?.config?.baseURL ?? ""}${e?.config?.url ?? ""}`);
        console.log("REQ headers:", e?.config?.headers);

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
      <View style={styles.moreHeaderCell} />
    </View>
  );

  const renderRow = ({ item, index }) => {
    const isOpen = openMenuId === index;

    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText} numberOfLines={1}>
              {item[col.key]}
            </Text>
          </View>
        ))}

        <View style={styles.moreWrapper}>
          <TouchableOpacity onPress={() => setOpenMenuId(isOpen ? null : index)}>
            <Text style={styles.moreText}>⋮</Text>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setOpenMenuId(null);
                  console.log("다운로드", item.id);
                }}
              >
                <Text>다운로드</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.title}>휴가 신청 목록 ({data.length})</Text>

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
        <ScrollView horizontal>
          <View>
            {renderHeader()}
            <FlatList
              data={data}
              keyExtractor={(item) => String(item.id ?? Math.random())}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
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
  headerText: {
    fontWeight: "600",
  },
  sortIcon: {
    color: "#64748B",
    fontWeight: "600",
  },
  cellText: {
    color: "#333",
  },
  moreHeaderCell: {
    width: 50,
  },
  moreWrapper: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  moreText: {
    fontSize: 18,
    color: "#555",
    zIndex: 1000,
    cursor: "pointer",
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
});
