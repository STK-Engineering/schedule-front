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
  Image,
} from "react-native";
import api from "../../api/api";
import showIcon from "../../../assets/icon/show.png";
import { useNavigation } from "@react-navigation/native";

const columns = [
  { key: "jobNumber", title: "작업번호", width: "8%", sortable: true },
  { key: "vesselName", title: "선박명", width: "8%", sortable: true },
  { key: "hullNo", title: "호선", width: "6%", sortable: true },
  { key: "region", title: "지역", width: "10%", sortable: true },
  { key: "dateRange", title: "기간", width: "12%", sortable: true },
  { key: "workType", title: "작업", width: "8%", sortable: true },
  { key: "systemType", title: "종류", width: "6%", sortable: true },
  { key: "engineers", title: "엔지니어", width: "14%", sortable: true },
  { key: "note", title: "비고", width: "12%", sortable: true },
  { key: "jobDescription", title: "작업내용", width: "8%", sortable: true },
  { key: "action", title: "", width: "8%", sortable: false },
];

export default function Application() {
  const navigation = useNavigation();
  const now = new Date();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [nameQuery, setNameQuery] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  useEffect(() => {
    let mounted = true;

    const fetchList = async () => {
      try {
        setLoading(true);
        setError("");

        const yearValue = Number(year) || now.getFullYear();
        const monthValue = Number(month) || now.getMonth() + 1;
        const normalizedMonth = Math.min(12, Math.max(1, monthValue));

        const res = await api.get("/engineer-schedule", {
          params: {
            year: yearValue,
            month: normalizedMonth,
          },
        });
        const list = Array.isArray(res.data) ? res.data : [];

        if (!mounted) return;

        const rows = [];

        list.forEach((item) => {
          const schedules = Array.isArray(item.jobScheduleList)
            ? item.jobScheduleList
            : [];

          if (schedules.length === 0) {
            rows.push({
              id: `${item.id}-empty`,
              source: item,
              jobNumber: item.jobNumber ?? "-",
              vesselName: item.vesselName ?? "-",
              hullNo: item.hullNo ?? "-",
              region: item.region ?? "-",
              dateRange: "-",
              workType: item.description ?? "-",
              systemType: item.systemType ?? "-",
              engineers: "-",
              note: "-",
              jobDescription: item.jobDescription ?? "-",
              customer: item.customer ?? "-",
            });
            return;
          }

          schedules.forEach((schedule, index) => {
            const engineerList = Array.isArray(schedule.jobScheduleEngineerList)
              ? schedule.jobScheduleEngineerList
              : [];
            const engineerNames = engineerList
              .map((engineer) => engineer.engineerName)
              .filter(Boolean)
              .join(", ");

            rows.push({
              id: schedule.id ?? `${item.id}-${index}`,
              source: item,
              scheduleIndex: index,
              jobNumber: item.jobNumber ?? "-",
              vesselName: item.vesselName ?? "-",
              hullNo: item.hullNo ?? "-",
              region: item.region ?? "-",
              dateRange:
                schedule.startDate && schedule.endDate
                  ? `${schedule.startDate} ~ ${schedule.endDate}`
                  : schedule.startDate ?? schedule.endDate ?? "-",
              workType: item.description ?? "-",
              systemType: item.systemType ?? "-",
              engineers: engineerNames || "-",
              note: schedule.note ?? "-",
              jobDescription: item.jobDescription ?? "-",
              customer: item.customer ?? "-",
            });
          });
        });

        setData(rows);
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
  }, [year, month]);

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
    </View>
  );

  const searchValue = nameQuery.trim().toLowerCase();
  const filteredData = searchValue
    ? data.filter((item) =>
        [
          item?.engineers,
          item?.jobNumber,
          item?.vesselName,
          item?.hullNo,
          item?.region,
        ].some((field) =>
          String(field ?? "").toLowerCase().includes(searchValue)
        )
      )
    : data;

  const typeFilteredData = filteredData;

  const renderRow = ({ item }) => {
    return (
      <View style={styles.row}>
        {columns.map((col) => {
          if (col.key === "action") {
            return (
              <View key={col.key} style={[styles.cell, { width: col.width }]}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    navigation.navigate("SchedulingContent", item);
                  }}
                >
                  <Text style={styles.detailButtonText}>보기</Text>
                  <Image source={showIcon} style={styles.detailButtonIcon} />
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View key={col.key} style={[styles.cell, { width: col.width }]}>
              <Text style={styles.cellText} numberOfLines={1}>
                {item[col.key]}
              </Text>
            </View>
          );
        })}

      </View>
    );
  };

  return (
    <View style={styles.page}>
      <View style={styles.filterCard}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>일정 등록 목록</Text>
          <Text style={styles.countText}>
            {typeFilteredData.length}/{data.length}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.searchGroup}>
            <Text style={styles.filterLabel}>검색</Text>
            <TextInput
              value={nameQuery}
              onChangeText={setNameQuery}
              placeholder="엔지니어/작업번호 검색"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.monthGroup}>
            <Text style={styles.filterLabel}>조회 월</Text>
            <View style={styles.monthInputs}>
              <TextInput
                value={year}
                onChangeText={(value) =>
                  setYear(value.replace(/[^0-9]/g, ""))
                }
                placeholder="YYYY"
                style={styles.monthInput}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.monthDivider}>년</Text>
              <TextInput
                value={month}
                onChangeText={(value) =>
                  setMonth(value.replace(/[^0-9]/g, ""))
                }
                placeholder="MM"
                style={styles.monthInput}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.monthDivider}>월</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>일정 등록 내역</Text>
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
  monthGroup: {
    minWidth: 220,
  },
  monthInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthInput: {
    height: 40,
    width: 70,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  monthDivider: {
    fontSize: 12,
    color: "#64748B",
  },
  filterLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
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

  cell: { padding: 12, justifyContent: "center" },
  headerText: { fontWeight: "600" },
  sortIcon: { color: "#64748B", fontWeight: "600" },
  cellText: { color: "#333" },
  detailButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "space-between",
  },
  detailButtonText: { fontSize: 12, color: "#0F172A" },
  detailButtonIcon: { width: 14, height: 14, resizeMode: "contain" },

});
