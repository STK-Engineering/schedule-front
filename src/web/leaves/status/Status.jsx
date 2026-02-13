import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import pdf from "../../../../assets/img/pdf.png";
import api from "../../../api/api";
import { LeaveBalanceContext } from "../../../context/LeaveBalanceContext";
import PageLayout from "../../../components/PageLayout";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
  반려: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
};

function toDateOnly(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = String(dateStr).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeHolidayDate(value) {
  if (!value) return null;
  if (value instanceof Date) return toDateKey(value);
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return null;
}

function normalizeHolidayItems(payload) {
  const items =
    payload?.response?.body?.items?.item ??
    payload?.items?.item ??
    payload?.items ??
    payload?.data ??
    payload ??
    [];

  const list = Array.isArray(items) ? items : [items];
  return list
    .map((item) =>
      normalizeHolidayDate(
        item?.date ?? item?.locdate ?? item?.holidayDate ?? item?.localDate ?? item?.day ?? item,
      ),
    )
    .filter(Boolean);
}

function collectYearMonthKeys(items) {
  const keys = new Set();

  for (const item of items) {
    const start = toDateOnly(item?.startDate);
    const end = toDateOnly(item?.endDate || item?.startDate);
    if (!start || !end) continue;

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= lastMonth) {
      keys.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return Array.from(keys);
}

async function fetchHolidayDateSetForLeaves(items, signal) {
  const yearMonthKeys = collectYearMonthKeys(items);
  if (!yearMonthKeys.length) return new Set();

  const responses = await Promise.all(
    yearMonthKeys.map(async (key) => {
      const [year, month] = key.split("-").map(Number);
      const res = await api.get("/holiday", { params: { year, month }, signal });
      return normalizeHolidayItems(res.data);
    }),
  );

  return new Set(responses.flat());
}

function formatPeriodByUsedDays(startDate, endDate, holidayDateSet = new Set()) {
  if (!startDate) return "-";
  if (!endDate || endDate === startDate) return startDate;

  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate || startDate);
  if (!start || !end || start > end) return `${startDate} ~ ${endDate || startDate}`;

  const includedDates = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    const dateKey = toDateKey(cursor);
    const isHoliday = holidayDateSet.has(dateKey);
    if (!isWeekend && !isHoliday) includedDates.push(dateKey);
  }

  if (!includedDates.length) return `${startDate} ~ ${endDate || startDate}`;
  const ranges = [];
  let rangeStart = includedDates[0];
  let rangeEnd = includedDates[0];

  for (let i = 1; i < includedDates.length; i += 1) {
    const current = toDateOnly(includedDates[i]);
    const previous = toDateOnly(rangeEnd);
    const isConsecutive =
      current &&
      previous &&
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24) === 1;

    if (isConsecutive) {
      rangeEnd = includedDates[i];
      continue;
    }

    ranges.push(rangeStart === rangeEnd ? rangeStart : `${rangeStart}~${rangeEnd}`);
    rangeStart = includedDates[i];
    rangeEnd = includedDates[i];
  }

  ranges.push(rangeStart === rangeEnd ? rangeStart : `${rangeStart}~${rangeEnd}`);
  return ranges.join("/");
}

function displayLeaveType(type) {
  if (!type) return "-";
  if (["연차", "오전반차", "오후반차"].includes(type)) return type;
  if (["건강검진", "예비군", "특별보상휴가", "무급"].includes(type)) return "기타";
  return "경조사";
}

function getYearFromDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getFullYear();
  }
  const match = String(value).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

export default function Status() {
  const [data, setData] = useState({ waiting: [], done: [] });
  const [holidayDateSet, setHolidayDateSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaves = async (signal, { silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const res = await api.get("/leaves/me", { signal });

      const waiting = res.data?.["요청 대기 건"] ?? [];
      const done = res.data?.["요청 처리 건"] ?? [];

      const mapItem = (e) => ({
        id: e.id,
        department: e.employee?.department?.name ?? "",
        name: e.employee?.name ?? "",
        position: e.employee?.level ?? "사원",

        type: e.leaveType,
        startDate: e.startDate,
        endDate: e.endDate,
        usedDay: e.usedDay,

        reason: e.reason ?? "",
        etc: e.etc ?? "",
        status: e.approvalStatusDisplay ?? "",

        rejectionReason: e.rejectionReason ?? "—",
        file: pdf,
      });

      setData({
        waiting: waiting.map(mapItem),
        done: done.map(mapItem),
      });

      const allItems = [...waiting, ...done].map(mapItem);
      fetchHolidayDateSetForLeaves(allItems, signal)
        .then((holidays) => setHolidayDateSet(holidays))
        .catch((holidayError) => {
          if (holidayError?.name === "CanceledError" || holidayError?.code === "ERR_CANCELED") return;
          console.log("holiday fetch error:", holidayError);
          setHolidayDateSet(new Set());
        });
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;

      console.log("leaves error message:", e?.message);
      console.log("leaves error url:", e?.config?.baseURL, e?.config?.url);
      console.log(
        "leaves error status/data:",
        e?.response?.status,
        e?.response?.data,
      );

      setError("요청 목록을 불러오지 못 했습니다.");
      setHolidayDateSet(new Set());
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaves(controller.signal);
    return () => controller.abort();
  }, []);

  const waitingCount = data.waiting.length;
  const doneCount = data.done.length;

  const breadcrumb = [
    { label: "홈", route: "Home" },
    { label: "내 휴가 신청 내역"},
  ];

  if (loading) {
    return (
      <PageLayout
        breadcrumb={breadcrumb}
        title="휴가 신청 현황"
        contentStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      breadcrumb={breadcrumb}
      title="휴가 신청 현황"
      contentStyle={{ paddingBottom: 40 }}
    >
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Section
        title="승인 대기"
        count={waitingCount}
        emptyText="승인 대기 요청이 없습니다."
      >
        {data.waiting.map((item) => (
          <Item
            key={item.id}
            item={item}
            holidayDateSet={holidayDateSet}
            onDeleted={() => fetchLeaves(undefined, { silent: true })}
          />
        ))}
      </Section>

      <Section
        title="진행 완료"
        count={doneCount}
        emptyText="처리된 요청이 없습니다."
      >
        {data.done.map((item) => (
          <Item
            key={item.id}
            item={item}
            holidayDateSet={holidayDateSet}
            onDeleted={() => fetchLeaves(undefined, { silent: true })}
          />
        ))}
      </Section>
    </PageLayout>
  );
}

function Section({ title, count, emptyText, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>

      {count === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function Item({ item, onDeleted, holidayDateSet }) {
  const navigation = useNavigation();
  const { bump } = useContext(LeaveBalanceContext);

  const statusTheme = STATUS_STYLE[item.status] || STATUS_STYLE["대기"];

  const hidePdf = item.status !== "승인";
  const hideEdit = item.type === "경조사" || item.status === "취소";
  const hideCancel = item.status === "취소" ||item.status === "반려";

  const downloadPdf = async () => {
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
      console.log(
        "pdf download error:",
        e?.response?.status,
        e?.response?.data,
      );
      Alert.alert("오류", "PDF 다운로드에 실패했습니다.");
    }
  };

  const cancelLeave = async () => {
    try {
      const endpoint =
        item.type === "경조사" && item.reason?.startsWith("출산")
          ? `/spouse-maternity/${item.id}`
          : `/leaves/${item.id}`;
      await api.delete(endpoint);
      Alert.alert("완료", "휴가 신청이 취소되었습니다.");
      bump();
      onDeleted?.();
    } catch (e) {
      console.log("delete error:", e?.response?.status, e?.response?.data);
      Alert.alert("실패", "휴가 신청 취소에 실패했습니다.");
    }
  };

  const goEdit = () => {
    navigation.navigate("LeaveEdit", {
      id: item.id,
      leaveType: item.type,
      startDate: item.startDate,
      endDate: item.endDate,
      reason: item.reason,
      etc: item.etc,
      status: item.approvalStatusDisplay,
    });
  };

  return (
    <Pressable
      style={styles.itemCard}
      onPress={() => navigation.navigate("LeaveStatusContent", { ...item })}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemType}>{displayLeaveType(item.type)}</Text>
        <Text style={styles.itemSub}>
          {formatPeriodByUsedDays(item.startDate, item.endDate, holidayDateSet)}
        </Text>
        <Text style={styles.itemMeta}>
          사용일수 <Text style={styles.itemMetaStrong}>{item.usedDay}</Text>
        </Text>
      </View>

      <View style={styles.itemRight}>
        <View style={[styles.badge, { backgroundColor: statusTheme.bg }]}>
          <View
            style={[styles.badgeDot, { backgroundColor: statusTheme.dot }]}
          />
          <Text style={[styles.badgeText, { color: statusTheme.text }]}>
            {item.status}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* 수정 */}
          {!hideEdit && (
            <TouchableOpacity
              style={[styles.pdfBtn, { paddingHorizontal: 12 }]}
              onPress={goEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.pdfText}>수정</Text>
            </TouchableOpacity>
          )}

          {/* 취소 */}
          {!hideCancel && (
            <TouchableOpacity
              style={[
                styles.pdfBtn,
                { paddingHorizontal: 12, backgroundColor: "#FEE2E2" },
              ]}
              onPress={cancelLeave}
              activeOpacity={0.7}
            >
              <Text style={[styles.pdfText, { color: "#DC2626" }]}>취소</Text>
            </TouchableOpacity>
          )}
          
          {/* PDF */}
          {!hidePdf && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={downloadPdf}
              activeOpacity={0.7}
            >
              <Image source={item.file} style={styles.pdfIcon} />
              <Text style={styles.pdfText}>PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = {
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B" },

  errorText: {
    textAlign: "center",
    color: "#EF4444",
    backgroundColor: "#FFF1F2",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  countPill: {
    minWidth: 34,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  countText: { fontWeight: "700", color: "#334155" },

  emptyText: { textAlign: "center", color: "#94A3B8", paddingVertical: 18 },

  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  itemLeft: { flex: 1, paddingRight: 10 },
  itemType: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  itemSub: { fontSize: 13, color: "#475569", marginBottom: 6 },
  itemMeta: { fontSize: 13, color: "#64748B" },
  itemMetaStrong: { fontWeight: "800", color: "#0F172A" },

  itemRight: { alignItems: "flex-end", gap: 10 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: "800" },

  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 34,
    backgroundColor: "#F1F5F9",
  },
  pdfIcon: { width: 18, height: 18, resizeMode: "contain", marginRight: 6 },
  pdfText: { fontSize: 13, fontWeight: "700", color: "#334155" },
};
