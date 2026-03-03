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
  useWindowDimensions,
  Modal,
} from "react-native";
import api from "../../api/api";
import showIcon from "../../../assets/icon/show.png";
import { useNavigation } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";

const columns = [
  { key: "jobNumber", title: "작업번호", width: "8%", sortable: true },
  { key: "vesselName", title: "선박명", width: "8%", sortable: true },
  { key: "hullNo", title: "호선번호", width: "6%", sortable: true },
  { key: "imoNumber", title: "고유번호", width: "8%", sortable: true },
  { key: "region", title: "지역", width: "5%", sortable: true },
  { key: "dateRange", title: "기간", width: "12%", sortable: true },
  { key: "workType", title: "작업", width: "5%", sortable: true },
  { key: "systemType", title: "종류", width: "6%", sortable: true },
  { key: "engineers", title: "엔지니어", width: "12%", sortable: true },
  { key: "note", title: "비고", width: "12%", sortable: true },
  { key: "jobDescription", title: "작업내용", width: "8%", sortable: true },
  { key: "action", title: "", width: "10%", sortable: false },
];

export default function Application() {
  const navigation = useNavigation();
  const now = new Date();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 800;
  const tableMinWidth = isMobile ? 1200 : "100%";
  const tableBodyHeight = Math.max(
    240,
    Math.min(isMobile ? 360 : 460, height - (isMobile ? 380 : 320))
  );
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [nameQuery, setNameQuery] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [xmlPreviewLoading, setXmlPreviewLoading] = useState(false);
  const [xmlPreviewError, setXmlPreviewError] = useState("");
  const [xmlPreviewText, setXmlPreviewText] = useState("");

  const confirmDelete = () => {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      return window.confirm("일정을 삭제하시겠습니까?");
    }
    return true;
  };

  const handleDelete = async (item) => {
    const targetId = item?.source?.id ?? null;
    if (!targetId) {
      setError("삭제할 일정 ID를 찾지 못했습니다.");
      return;
    }
    if (!confirmDelete()) return;

    try {
      setError("");
      await api.delete(`/engineer-schedule/${targetId}`);
      setData((prev) => prev.filter((row) => row?.source?.id !== targetId));
    } catch (e) {
      console.log("delete schedule error:", e?.response?.status, e?.response?.data);
      setError("일정 삭제에 실패했습니다.");
    }
  };

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
              imoNumber: item.imoNumber ?? "-",
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
              imoNumber: item.imoNumber ?? "-",
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

  const openXmlPreview = async () => {
    const yearValue = Number(year) || now.getFullYear();
    const monthValue = Number(month) || now.getMonth() + 1;
    const normalizedMonth = Math.min(12, Math.max(1, monthValue));
    const monthParam = String(normalizedMonth).padStart(2, "0");

    setXmlPreviewOpen(true);
    setXmlPreviewLoading(true);
    setXmlPreviewError("");
    setXmlPreviewText("");

    try {
      const res = await api.get("/engineer-schedule/download", {
        params: { year: yearValue, month: monthParam },
        responseType: "text",
      });
      const text = typeof res.data === "string" ? res.data : String(res.data ?? "");
      setXmlPreviewText(text);
    } catch (e) {
      console.log("xml preview error:", e?.response?.status, e?.response?.data);
      setXmlPreviewError("엑셀(XML) 미리보기를 불러오지 못 했습니다.");
    } finally {
      setXmlPreviewLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((col) => (
        <TouchableOpacity
          key={col.key}
          style={[styles.cell, isMobile && styles.cellMobile, { width: col.width }]}
          activeOpacity={0.7}
          onPress={() => col.sortable && handleSort(col.key)}
        >
          <Text style={[styles.headerText, isMobile && styles.headerTextMobile]}>
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
          item?.imoNumber,
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
              <View
                key={col.key}
                style={[
                  styles.cell,
                  styles.actionCell,
                  isMobile && styles.cellMobile,
                  { width: col.width },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.detailButton,
                    isMobile && styles.detailButtonMobile,
                  ]}
                  onPress={() => {
                    navigation.navigate("SchedulingContent", item);
                  }}
                >
                  <Text
                    style={[
                      styles.detailButtonText,
                      isMobile && styles.detailButtonTextMobile,
                    ]}
                  >
                    보기
                  </Text>
                  <Image
                    source={showIcon}
                    style={[
                      styles.detailButtonIcon,
                      isMobile && styles.detailButtonIconMobile,
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    isMobile && styles.deleteButtonMobile,
                  ]}
                  onPress={() => handleDelete(item)}
                >
                  <Text
                    style={[
                      styles.deleteButtonText,
                      isMobile && styles.deleteButtonTextMobile,
                    ]}
                  >
                    삭제
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View
              key={col.key}
              style={[styles.cell, isMobile && styles.cellMobile, { width: col.width }]}
            >
              <Text
                style={[styles.cellText, isMobile && styles.cellTextMobile]}
                numberOfLines={1}
              >
                {item[col.key]}
              </Text>
            </View>
          );
        })}

      </View>
    );
  };

  const breadcrumb = [
    { label: "홈", route: "Home" },
    { label: "일정 관리", route: "SchedulingList" },
    { label: "일정 관리 목록" },
  ];

  return (
    <PageLayout
      breadcrumb={breadcrumb}
      scroll={false}
      contentStyle={[
        styles.pageContent,
        isMobile && styles.pageContentMobile,
      ]}
    >
      <View style={[styles.page, isMobile && styles.pageMobile]}>
        <View style={[styles.filterCard, isMobile && styles.filterCardMobile]}>
          <View style={[styles.titleRow, isMobile && styles.titleRowMobile]}>
            <Text style={styles.title}>일정 등록 목록</Text>
            <Text style={styles.countText}>
              {typeFilteredData.length}/{data.length}
            </Text>
          </View>

          <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
            <View
              style={[styles.searchGroup, isMobile && styles.searchGroupMobile]}
            >
              <Text style={styles.filterLabel}>검색</Text>
              <TextInput
                value={nameQuery}
                onChangeText={setNameQuery}
                placeholder="엔지니어/작업번호 검색"
                style={[styles.searchInput, isMobile && styles.searchInputMobile]}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <View
              style={[styles.monthGroup, isMobile && styles.monthGroupMobile]}
            >
              <Text style={styles.filterLabel}>조회 월</Text>
              <View style={[styles.monthInputs, isMobile && styles.monthInputsMobile]}>
                <TextInput
                  value={year}
                  onChangeText={(value) =>
                    setYear(value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="YYYY"
                  style={[styles.monthInput, isMobile && styles.monthInputMobile]}
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
                  style={[styles.monthInput, isMobile && styles.monthInputMobile]}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.monthDivider}>월</Text>
              </View>
            </View>
          </View>
        </View>

      <View style={[styles.tableCard, isMobile && styles.tableCardMobile]}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>일정 등록 내역</Text>
          <TouchableOpacity onPress={openXmlPreview} activeOpacity={0.7}>
            <Text style={styles.excelLink}>일정 엑셀 보기</Text>
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
            <View style={[styles.tableWrap, { minWidth: tableMinWidth }]}>
              {renderHeader()}
              <View style={[styles.tableBody, { height: tableBodyHeight }]}>
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

      <Modal
        visible={xmlPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setXmlPreviewOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setXmlPreviewOpen(false)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>일정 엑셀(XML) 미리보기</Text>
              <TouchableOpacity onPress={() => setXmlPreviewOpen(false)}>
                <Text style={styles.modalClose}>닫기</Text>
              </TouchableOpacity>
            </View>
            {xmlPreviewLoading ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator />
                <Text style={styles.modalHint}>불러오는 중...</Text>
              </View>
            ) : xmlPreviewError ? (
              <Text style={styles.modalError}>{xmlPreviewError}</Text>
            ) : (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.xmlText}>{xmlPreviewText || "-"}</Text>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F3F4F6",
    flex: 1,
    gap: 16,
  },
  pageMobile: {
    gap: 12,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageContentMobile: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 14,
  },
  filterCardMobile: {
    padding: 12,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  titleRowMobile: {
    flexWrap: "wrap",
    gap: 6,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  countText: { fontSize: 12, color: "#64748B" },
  filterRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  filterRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  filterGroup: {
    flex: 1,
    minWidth: 280,
  },
  searchGroup: {
    width: 300,
  },
  searchGroupMobile: {
    width: "100%",
  },
  monthGroup: {
    minWidth: 220,
  },
  monthGroupMobile: {
    minWidth: "100%",
  },
  monthInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthInputsMobile: {
    flexWrap: "wrap",
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
  monthInputMobile: {
    width: 72,
    height: 38,
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
  searchInputMobile: {
    height: 38,
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    minHeight: 240,
  },
  tableCardMobile: {
    padding: 10,
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
  excelLink: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
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
  cellMobile: { paddingVertical: 8, paddingHorizontal: 8 },
  headerText: { fontWeight: "600" },
  headerTextMobile: { fontSize: 12 },
  sortIcon: { color: "#64748B", fontWeight: "600" },
  cellText: { color: "#333" },
  cellTextMobile: { fontSize: 12 },
  actionCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  detailButtonMobile: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  detailButtonText: { fontSize: 12, color: "#0F172A" },
  detailButtonTextMobile: { fontSize: 11 },
  detailButtonIcon: { width: 14, height: 14, resizeMode: "contain" },
  detailButtonIconMobile: { width: 12, height: 12 },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  deleteButtonMobile: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteButtonText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  deleteButtonTextMobile: { fontSize: 11 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalClose: {
    fontSize: 12,
    color: "#64748B",
  },
  modalCenter: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  modalHint: {
    fontSize: 12,
    color: "#64748B",
  },
  modalError: {
    fontSize: 12,
    color: "#EF4444",
  },
  modalBody: {
    maxHeight: 420,
  },
  xmlText: {
    fontSize: 12,
    color: "#0F172A",
  },
});
