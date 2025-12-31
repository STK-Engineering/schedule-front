import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import pdf from "../../../assets/img/pdf.png";
import api from "../../api/api";

const BASE_URL = api?.defaults?.baseURL || "";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
};

function formatPeriod(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}

export default function Status() {
  const [data, setData] = useState({ waiting: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/leaves/me");
        const waiting = res.data?.["요청 대기 건"] ?? [];
        const done = res.data?.["요청 처리 건"] ?? [];

        if (!mounted) return;

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
          extra: e.etc ?? "",
          status: e.approvalStatus ?? "대기",

          rejectReason: e.rejectReason ?? "—",

          file: pdf,
        });

        setData({
          waiting: waiting.map(mapItem),
          done: done.map(mapItem),
        });
      } catch (e) {
        console.log("leaves error message:", e?.message);
        console.log("leaves error url:", e?.config?.baseURL, e?.config?.url);
        console.log(
          "leaves error status/data:",
          e?.response?.status,
          e?.response?.data
        );

        if (!mounted) return;
        setError("요청 목록을 불러오지 못 했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaves();
    return () => {
      mounted = false;
    };
  }, []);

  const waitingCount = data.waiting.length;
  const doneCount = data.done.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>휴가 신청 현황</Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Section
        title="승인 대기"
        count={waitingCount}
        emptyText="승인 대기 요청이 없습니다."
      >
        {data.waiting.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </Section>

      <Section
        title="진행 완료"
        count={doneCount}
        emptyText="처리된 요청이 없습니다."
      >
        {data.done.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </Section>
    </ScrollView>
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

function Item({ item }) {
  const navigation = useNavigation();

  const fileUrl = `${BASE_URL}/leaves/${item.id}/download`;
  const statusTheme = STATUS_STYLE[item.state] || STATUS_STYLE["대기"];

  const openPdf = async () => {
    try {
      if (!fileUrl) {
        Alert.alert("오류", "파일 URL이 없습니다.");
        return;
      }
      const supported = await Linking.canOpenURL(fileUrl);
      if (!supported) {
        Alert.alert("오류", "PDF를 열 수 없습니다.");
        return;
      }
      await Linking.openURL(fileUrl);
    } catch {
      Alert.alert("오류", "파일을 여는 중 문제가 발생했습니다.");
    }
  };

  return (
    <Pressable
      style={styles.itemCard}
      onPress={() => navigation.navigate("StatusContent", { ...item })}

    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemType}>{item.type}</Text>

        <Text style={styles.itemSub}>
          {formatPeriod(item.startDate, item.endDate)}
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

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={openPdf}
          activeOpacity={0.7}
        >
          <Image source={item.file} style={styles.pdfIcon} />
          <Text style={styles.pdfText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: "#F6F8FB" },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

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
