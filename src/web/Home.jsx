import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api/api";
import { LeaveBalanceContext } from "../context/LeaveBalanceContext";
import PageLayout from "../components/PageLayout";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569" },
  반려: { bg: "#FFE9E7", text: "#FF2116" },
};

const LEAVE_TYPE_STYLES = {
  연차: "#2c7a57ff",
  오전반차: "#2d82d7ff",
  오후반차: "#515ed7ff",
  "본인의 결혼": "#6f6e6bff",
  "배우자 출산": "#6f6e6bff",
  "본인•배우자의 부모 또는 배우자의 사망": "#6f6e6bff",
  "본인•배우자의 조부모 또는 외조부모의 사망": "#6f6e6bff",
  "자녀 또는 자녀의 배우자 사망": "#d01313ff",
  "본인•배우자의 형제•자매 사망": "#d01313ff",
  건강검진: "#6f6e6bff",
  예비군: "#6f6e6bff",
  특별보상휴가: "#6f6e6bff",
  무급: "#6f6e6bff",
  출산: "#6f6e6bff",
};

const toDateKey = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return null;
};

const getDateKeysInRange = (start, end) => {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end ?? start);
  if (!startKey || !endKey) return [];
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const startDate = new Date(sy, sm - 1, sd, 0, 0, 0);
  const endDate = new Date(ey, em - 1, ed, 0, 0, 0);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }
  const result = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    result.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
};

export default function Home() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;
  const { version } = useContext(LeaveBalanceContext);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarLeaves, setCalendarLeaves] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [dayEventsDateKey, setDayEventsDateKey] = useState("");

  const [balances, setBalances] = useState({ totalDays: 0, remainingDays: 0 });
  const [employee, setEmployee] = useState({ name: "", department: "" });
  const [leaveSummary, setLeaveSummary] = useState({
    waiting: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [balanceRes, leaveRes] = await Promise.all([
          api.get("/balances", { signal: controller.signal }),
          api.get("/leaves/me", { signal: controller.signal }),
        ]);

        if (!mounted) return;

        const balanceData = balanceRes.data ?? {};
        setEmployee({
          name: balanceData.name ?? balanceData.employee?.name ?? "",
          department:
            balanceData.department ??
            balanceData.employee?.department?.name ??
            "",
        });
        setBalances({
          totalDays: Number(balanceData.totalDays ?? 0),
          remainingDays: Number(balanceData.remainingDays ?? 0),
        });

        const waiting = leaveRes.data?.["요청 대기 건"] ?? [];
        const done = leaveRes.data?.["요청 처리 건"] ?? [];
        const mapItem = (e) => ({
          id: e.id,
          type: e.leaveType ?? "",
          startDate: e.startDate,
          endDate: e.endDate,
          usedDay: e.usedDay,
          status: e.approvalStatusDisplay ?? "",
        });
        setLeaveSummary({
          waiting: waiting.map(mapItem),
          done: done.map(mapItem),
        });
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        if (!mounted) return;
        setError("대시보드 정보를 불러오지 못 했습니다.");
        setEmployee({ name: "", department: "" });
        setBalances({ totalDays: 0, remainingDays: 0 });
        setLeaveSummary({ waiting: [], done: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [version]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchCalendarLeaves = async () => {
      try {
        setCalendarLoading(true);
        const res = await api.get("/leaves", { signal: controller.signal });
        const list = Array.isArray(res.data) ? res.data : [];
        const approvedOnly = list.filter(
          (item) => item?.approvalStatusDisplay === "승인"
        );
        if (mounted) setCalendarLeaves(approvedOnly);
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        if (mounted) setCalendarLeaves([]);
      } finally {
        if (mounted) setCalendarLoading(false);
      }
    };

    fetchCalendarLeaves();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [version]);

  const totalDays = balances.totalDays;
  const remainingDays = balances.remainingDays;
  const usedDays = Math.max(totalDays - remainingDays, 0);
  const progressPct = totalDays > 0 ? Math.min((usedDays / totalDays) * 100, 100) : 0;
  const leaveTypeUsageDays = (type) => {
    if (type === "연차") return 1;
    if (type === "오전반차" || type === "오후반차") return 0.5;
    return 0;
  };

  const recentRequests = useMemo(() => {
    const merged = [...leaveSummary.waiting, ...leaveSummary.done];
    return merged
      .filter((item) => item.startDate)
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
      .slice(0, 5);
  }, [leaveSummary]);

  const calendarMarks = useMemo(() => {
    const map = new Map();
    for (const item of calendarLeaves) {
      const keys = getDateKeysInRange(item.startDate, item.endDate);
      const color = LEAVE_TYPE_STYLES[item.leaveType] ?? "#94A3B8";
      for (const key of keys) {
        const prev = map.get(key) ?? [];
        prev.push(color);
        map.set(key, prev);
      }
    }
    return map;
  }, [calendarLeaves]);

  const openDayEvents = (dateKey) => {
    if (!dateKey) return;
    const list = calendarLeaves.filter((item) => {
      const keys = getDateKeysInRange(item.startDate, item.endDate);
      return keys.includes(dateKey);
    });
    setDayEventsDateKey(dateKey);
    setDayEvents(list);
    setDayEventsOpen(true);
  };

  const closeDayEvents = () => {
    setDayEventsOpen(false);
    setDayEvents([]);
    setDayEventsDateKey("");
  };

  const calendar = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const weeks = [];
    let day = 1;
    let nextDay = 1;
    for (let w = 0; w < 6; w += 1) {
      const week = [];
      for (let d = 0; d < 7; d += 1) {
        if (w === 0 && d < firstDay) {
          const value = prevLastDate - (firstDay - d - 1);
          const dateKey = toDateKey(new Date(year, month - 1, value));
          week.push({
            key: `p-${w}-${d}`,
            value,
            muted: true,
            isToday: false,
            dateKey,
          });
        } else if (day > lastDate) {
          const value = nextDay;
          const dateKey = toDateKey(new Date(year, month + 1, value));
          week.push({
            key: `n-${w}-${d}`,
            value,
            muted: true,
            isToday: false,
            dateKey,
          });
          nextDay += 1;
        } else {
          const today = new Date();
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const dateKey = toDateKey(new Date(year, month, day));
          week.push({
            key: `c-${w}-${d}`,
            value: day,
            muted: false,
            isToday,
            dateKey,
          });
          day += 1;
        }
      }
      weeks.push(week);
      if (day > lastDate && nextDay > 7) break;
    }
    return { year, month, weeks };
  }, [calendarDate]);

  return (
    <PageLayout
      breadcrumb={[{ label: "홈" }]}
      contentStyle={styles.pageContent}
      pageStyle={styles.pageBackground}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>메인 대시보드</Text>
          <Text style={styles.pageSubTitle}>
            {employee.department ? `${employee.department} · ` : ""}
            {employee.name ? `${employee.name}님` : "사용자"}
          </Text>
        </View>
      </View>
      
           <View style={[styles.gridRow, isNarrow && styles.gridRowStack]}>
        <View style={[styles.card, styles.balanceCard]}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.cardTitle}>연차 현황</Text>
              <Text style={styles.cardCaption}>이번 연도 기준</Text>
            </View>
          </View>

          <View style={styles.balanceNumbers}>
            <View>
              <Text style={styles.balanceLabel}>총 연차</Text>
              <Text style={styles.balanceValue}>
                {loading ? "-" : `${totalDays}일`}
              </Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>잔여 연차</Text>
              <Text style={styles.balanceValue}>
                {loading ? "-" : `${remainingDays}일`}
              </Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>사용 연차</Text>
              <Text style={styles.balanceValue}>
                {loading ? "-" : `${usedDays}일`}
              </Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {loading ? "-" : `${Math.round(progressPct)}% 사용`}
            </Text>
          </View>

          <View style={styles.quickCard}>
            <Text style={styles.quickCardTitle}>바로가기</Text>
            <Text style={styles.quickCardSubtitle}>
              자주 쓰는 신청서로 빠르게 이동하세요.
            </Text>
            <View style={styles.quickCardButtons}>
              <TouchableOpacity
                style={styles.quickCardButtonPrimary}
                onPress={() => navigation.navigate("LeaveForm")}
              >
                <Text style={styles.quickCardButtonTextPrimary}>
                  휴가 신청서 쓰러가기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCardButtonSecondary}
                onPress={() => navigation.navigate("OverTimeForm")}
              >
                <Text style={styles.quickCardButtonTextSecondary}>
                  연장 근로 쓰러가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.categoryButtons}>
            {[
              ["연차", "오전반차", "오후반차"],
              ["경조사", "기타", null],
            ].map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.categoryRow}>
                {row.map((type, index) =>
                  type ? (
                    <View key={type} style={styles.categoryButtonWrap}>
                      <TouchableOpacity
                        style={styles.categoryButton}
                        onPress={() =>
                          navigation.navigate("LeaveForm", {
                            preselectLeaveType: type,
                          })
                        }
                      >
                        <Text style={styles.categoryButtonText}>{type}</Text>
                        <Text style={styles.categoryButtonSubText}>
                          사용일수 {leaveTypeUsageDays(type)}일
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View key={`placeholder-${rowIndex}-${index}`} style={styles.categoryButtonWrap}>
                      <View style={styles.categoryButtonPlaceholder} />
                    </View>
                  ),
                )}
              </View>
            ))}
          </View>
        </View>

        

        <View style={[styles.card, styles.statusCard]}>
          <Text style={styles.cardTitle}>연차 진행 상황</Text>
          <Text style={styles.cardCaption}>요청 현황 요약</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusLabel}>승인 대기</Text>
              <Text style={styles.statusValue}>
                {loading ? "-" : leaveSummary.waiting.length}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusLabel}>처리 완료</Text>
              <Text style={styles.statusValue}>
                {loading ? "-" : leaveSummary.done.length}
              </Text>
            </View>
          </View>

          <View style={styles.recentBlock}>
            <Text style={styles.recentTitle}>최근 신청</Text>
            {loading ? (
              <Text style={styles.mutedText}>불러오는 중...</Text>
            ) : recentRequests.length === 0 ? (
              <Text style={styles.mutedText}>최근 신청 내역이 없습니다.</Text>
            ) : (
              recentRequests.map((item) => {
                const theme = STATUS_STYLE[item.status] || STATUS_STYLE["대기"];
                return (
                  <View key={item.id} style={styles.recentRow}>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentType}>{item.type || "-"}</Text>
                      <Text style={styles.recentDate}>
                        {formatDate(item.startDate)}
                        {item.endDate && item.endDate !== item.startDate
                          ? ` ~ ${formatDate(item.endDate)}`
                          : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: theme.bg },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                        {item.status || "-"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={dayEventsOpen}
        transparent
        animationType="fade"
        onRequestClose={closeDayEvents}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeDayEvents}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dayEventsDateKey ? `${dayEventsDateKey} 일정` : "일정"}
              </Text>
              <Text style={styles.modalSubtitle}>{dayEvents.length}건</Text>
            </View>

            {dayEvents.length === 0 ? (
              <Text style={styles.modalEmpty}>해당 날짜에 일정이 없습니다.</Text>
            ) : (
              dayEvents.map((item) => (
                <View key={item.id} style={styles.modalItem}>
                  <View style={styles.modalItemLeft}>
                    <Text style={styles.modalItemTitle}>
                      {item.employee?.name ?? "이름없음"}
                    </Text>
                    <Text style={styles.modalItemSub}>
                      {item.employee?.department?.name ?? "-"} ·{" "}
                      {item.leaveType ?? "-"}
                    </Text>
                    <Text style={styles.modalItemDate}>
                      {formatDate(item.startDate)}
                      {item.endDate && item.endDate !== item.startDate
                        ? ` ~ ${formatDate(item.endDate)}`
                        : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modalItemDot,
                      {
                        backgroundColor:
                          LEAVE_TYPE_STYLES[item.leaveType] ?? "#94A3B8",
                      },
                    ]}
                  />
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={closeDayEvents}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    backgroundColor: "#F3F6FB",
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  pageSubTitle: {
    marginTop: 4,
    color: "#64748B",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  quickButton: {
    backgroundColor: "#121D6D",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickButtonText: {
    color: "white",
    fontWeight: "600",
  },
  quickButtonSecondary: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickButtonTextSecondary: {
    color: "#0F172A",
    fontWeight: "600",
  },
  gridRow: {
    flexDirection: "row",
    gap: 16,
  },
  gridRowStack: {
    flexDirection: "column",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    gap: 12,
  },
  balanceCard: {
    minWidth: 320,
  },
  statusCard: {
    minWidth: 320,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    paddingBottom: 7,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  cardCaption: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: -6,
  },
  categoryButtons: {
    gap: 8,
    width: "100%",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  categoryButtonWrap: {
    flex: 1,
    alignItems: "center",
  },
  categoryButton: {
    flex: 1,
    width: "100%",
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "600",
  },
  categoryButtonSubText: {
    fontSize: 14,
    color: "#64748B",
  },
  categoryButtonPlaceholder: {
    flex: 1,
    minHeight: 72,
    width: "100%",
  },
  balanceNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  balanceLabel: {
    color: "#64748B",
    fontSize: 12,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: "#0F172A",
  },
  progressWrap: {
    marginTop: 4,
    gap: 6,
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#121D6D",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#64748B",
  },
  quickCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    gap: 8,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  quickCardSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  quickCardButtons: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  quickCardButtonPrimary: {
    backgroundColor: "#121D6D",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  quickCardButtonTextPrimary: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  quickCardButtonSecondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  quickCardButtonTextSecondary: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusLabel: {
    color: "#64748B",
    fontSize: 12,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 6,
  },
  recentBlock: {
    marginTop: 6,
    gap: 10,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
  recentType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  recentDate: {
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mutedText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
  }
});
