import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import api from "../../api/api";

const columns = [
  { key: "name", title: "이름", width: 120, sortable: true },
  { key: "department", title: "부서", width: 120, sortable: true },
  { key: "type", title: "유형", width: 130, sortable: true },
  { key: "date", title: "사용일자", width: 160, sortable: true },
  { key: "reason", title: "사유", width: 150, sortable: true },
  { key: "etc", title: "기타사항", width: 350, sortable: true },
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

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItem, setMenuItem] = useState(null);

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

  const downloadLeavePdf = async (item) => {
    const id = item?.id;
    if (!id) return Alert.alert("오류", "다운로드할 문서 ID가 없습니다.");

    setMenuVisible(false);
    setMenuItem(null);

    try {
      const res = await api.get(`/leaves/${id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `휴가신청_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log("download error:", e?.response?.status, e?.response?.data);
      Alert.alert("실패", "PDF 다운로드에 실패했습니다.");
    }
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

  const openRowMenu = (item) => {
    setMenuItem(item);
    setMenuVisible(true);
  };

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText} numberOfLines={1}>
              {item[col.key]}
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
        </ScrollView>
      )}
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
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => downloadLeavePdf(menuItem)}
            >
              <Text>다운로드</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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

  moreHeaderCell: { width: 50 },

  menuCell: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 18, color: "#555" },

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
});
