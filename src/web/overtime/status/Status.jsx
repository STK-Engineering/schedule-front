import React, { useEffect, useState } from "react";
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
import PageLayout from "../../../components/PageLayout";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
  반려: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
};

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return "-";
  if (!endTime) return startTime;
  return `${startTime} ~ ${endTime}`;
}

export default function Status() {
  const [data, setData] = useState({ waiting: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaves = async (signal, { silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const res = await api.get("/overtime/me", { signal });

      const waiting = res.data?.["요청 대기 건"] ?? [];
      const done = res.data?.["요청 처리 건"] ?? [];

      const mapItem = (e) => ({
        id: e.id,
        department: e.employee?.department?.name ?? "",
        name: e.employee?.name ?? "",
        position: e.employee?.level ?? "사원",

        jobNumber: e.jobNumber ?? "",
        vesselName: e.vesselName ?? "",
        hullNo: e.hullNo ?? "",
        jobDescription: e.jobDescription ?? "",
        requestDate: e.requestDate ?? "",
        startTime: e.startTime ?? "",
        endTime: e.endTime ?? "",

        status: e.approvalStatusDisplay ?? "",

        rejectionReason: e.rejectionReason ?? "—",
        file: pdf,
      });

      setData({
        waiting: waiting.map(mapItem),
        done: done.map(mapItem),
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
    { label: "연장 근로 신청", route: "Form" },
    { label: "신청 현황" },
  ];

  if (loading) {
    return (
      <PageLayout
        breadcrumb={breadcrumb}
        title="연장 근로 신청 현황"
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
      title="연장 근로 신청 현황"
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

function Item({ item, onDeleted }) {
  const navigation = useNavigation();

  const statusTheme = STATUS_STYLE[item.status] || STATUS_STYLE["대기"];

  const hideEdit = item.type === "경조사" || item.status === "취소";
  const hideCancel = item.status === "취소";

  const cancelForm = async () => {
    try {
      await api.delete(`/overtime/${item.id}`);
      Alert.alert("완료", "연장 근로 신청이 취소되었습니다.");
      onDeleted?.();
    } catch (e) {
      console.log("delete error:", e?.response?.status, e?.response?.data);
      Alert.alert("실패", "연장 근로 신청 취소에 실패했습니다.");
    }
  };

  const goEdit = () => {
    navigation.navigate("OverTimeEdit", {
      id: item.id,
      jobNumber: item.jobNumber,
      vesselName: item.vesselName,
      hullNo: item.hullNo,
      jobDescription: item.jobDescription,
      requestDate: item.requestDate,
      startTime: item.startTime,
      endTime: item.endTime,
    });
  };

  return (
    <Pressable
      style={styles.itemCard}
      onPress={() => navigation.navigate("OverTimeStatusContent", { ...item })}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemType}>{item.jobNumber || "-"}</Text>
        <Text style={styles.itemSub}>
          {item.requestDate || "-"} /{" "}
          {formatTimeRange(item.startTime, item.endTime)}
        </Text>
        <Text style={styles.itemMeta}>
          호선번호{" "}
          <Text style={styles.itemMetaStrong}>{item.hullNo || "-"}</Text>
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
              onPress={cancelForm}
              activeOpacity={0.7}
            >
              <Text style={[styles.pdfText, { color: "#DC2626" }]}>취소</Text>
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
