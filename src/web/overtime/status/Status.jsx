import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
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

function normalizeApproverName(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    return (
      value?.name ??
      value?.employeeName ??
      value?.employee?.name ??
      ""
    ).toString().trim();
  }
  return String(value).trim();
}

function normalizeApproverNames(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeApproverName(item))
      .filter((name) => name.length > 0);
  }
  const str = String(value).trim();
  if (!str) return [];
  return str
    .split(/[>,]/)
    .map((name) => name.trim())
    .filter(Boolean);
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
        imageUrl: e.imageUrl ?? "",

        status: e.approvalStatusDisplay ?? "",
        approvalStatus: e.approvalStatus ?? e.approvalStatusDisplay ?? "",
        approverNames: e.approverNames ?? [],
        currentApprover: e.currentApprover ?? "",

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
            listType="waiting"
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
            listType="done"
            onDeleted={() => fetchLeaves(undefined, { silent: true })}
          />
        ))}
      </Section>
    </PageLayout>
  );
}

function Section({ title, count, emptyText, children }) {
  const shouldScroll = count > 3;
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
      ) : shouldScroll ? (
        <ScrollView style={styles.sectionScroll} showsVerticalScrollIndicator>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}

function Item({ item, onDeleted, listType }) {
  const navigation = useNavigation();

  const isWaiting = listType === "waiting";
  const isDone = listType === "done";
  const statusThemeKey = item.status || item.approvalStatus || "대기";
  const statusTheme = STATUS_STYLE[statusThemeKey] || STATUS_STYLE["대기"];
  const statusLabel = isDone
    ? item.approvalStatus || item.status || "-"
    : item.status || "-";
  const approverNames = normalizeApproverNames(item.approverNames);
  const currentApprover = normalizeApproverName(item.currentApprover);

  const hidePdf = item.status !== "승인";
  const hideEdit = item.type === "경조사" || item.status === "취소";
  const hideCancel = item.status === "취소" ||item.status === "반려";

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/overtime/${item.id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `OverTime_application_form_${item.name}.pdf`;
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
      imageUrl: item.imageUrl,
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
          {isWaiting ? (
            <Text style={[styles.badgeText, { color: statusTheme.text }]}>
              {approverNames.length === 0
                ? "-"
                : approverNames.map((name, index) => {
                    const isCurrent = name === currentApprover;
                    return (
                      <Text
                        key={`${name}-${index}`}
                        style={isCurrent ? styles.badgeTextCurrent : styles.badgeText}
                      >
                        {name}
                        {null}
                        {index < approverNames.length - 1 ? (
                          <Text style={styles.badgeTextSeparator}> &gt; </Text>
                        ) : null}
                      </Text>
                    );
                  })}
            </Text>
          ) : (
            <Text style={[styles.badgeText, { color: statusTheme.text }]}>
              {statusLabel}
            </Text>
          )}
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
  sectionScroll: {
    maxHeight: 360,
  },

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
    paddingVertical: 6,
    borderRadius: 14,
    flexWrap: "wrap",
    maxWidth: 260,
    alignSelf: "flex-end",
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextCurrent: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  badgeTextSeparator: { fontSize: 12, fontWeight: "700", color: "#475569" },

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
