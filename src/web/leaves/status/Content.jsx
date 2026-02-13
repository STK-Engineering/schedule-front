import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageLayout from "../../../components/PageLayout";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
  반려: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
};

function getYearFromDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getFullYear();
  }
  const match = String(value).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

export default function StatusDetail({ route }) {
  const navigation = useNavigation();
  const params = route?.params ?? {};
  const [balances, setBalances] = useState({ totalDays: 0, remainingDays: 0 });
  const [balancesLoading, setBalancesLoading] = useState(true);

  const {
    name = "",
    department = "",
    type = "",
    startDate = "",
    endDate = "",
    usedDay = 0,

    reason = "",
    etc = "",
    status = "",
    rejectionReason = "—",
  } = params;

  const useDate =
    endDate && endDate !== startDate ? `${startDate} ~ ${endDate}` : startDate;

  const remainDays = `${usedDay}일`;
  const isPending = status === "대기";
  const displayType = type
    ? ["연차", "오전반차", "오후반차"].includes(type)
      ? type
      : ["건강검진", "예비군", "특별보상휴가", "무급"].includes(type)
        ? "기타"
        : "경조사"
    : "-";

  useEffect(() => {
    let mounted = true;

    const fetchBalances = async () => {
      try {
        setBalancesLoading(true);

        const res = await api.get("/balances");
        const data = res.data ?? {};

        if (!mounted) return;

        setBalances({
          totalDays: Number(data.totalDays ?? 0),
          remainingDays: Number(data.remainingDays ?? 0),
        });
      } catch (e) {
        console.log("balances fetch error:", e);
        if (!mounted) return;

        setBalances({ totalDays: 0, remainingDays: 0 });
      } finally {
        if (mounted) setBalancesLoading(false);
      }
    };

    fetchBalances();

    return () => {
      mounted = false;
    };
  }, []);

  const statusTheme = STATUS_STYLE[status] || STATUS_STYLE["대기"];
  const currentYear = new Date().getFullYear();
  const requestYear = getYearFromDate(startDate) ?? currentYear;
  const isCurrentYear = requestYear === currentYear;

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: "내 휴가 신청 내역", route: "LeaveStatus" },
        { label: "신청 상세" },
      ]}
      title="휴가 신청 상세"
      contentStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
    >
      <View style={styles.pageWrap}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sectionTitle}>휴가 신청 정보</Text>
              <Text style={styles.sectionSub}>신청 내용을 확인하세요.</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusTheme.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusTheme.dot }]} />
              <Text style={[styles.statusText, { color: statusTheme.text }]}>
                {status || "대기"}
              </Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.table}>
            <InfoRow label="상태" value={status || "대기"} />
            <InfoRow label="휴가 형태" value={displayType} />
            <InfoRow label="기간" value={useDate || "-"} />
            <InfoRow label="사용일수" value={remainDays} />
            <InfoRow label="소속" value={department || "-"} />
            <InfoRow label="성명" value={name || "-"} />
            <InfoRow label="사유" value={reason || "기타"} multiline />
            <InfoRow label="기타 사항" value={etc || "없음."} multiline />
            <View style={[styles.tableRow, styles.tableRowLast]}>
              <View style={styles.tableLabelCell}>
                <Text style={styles.tableLabel}>휴가 일수 현황</Text>
              </View>
              <View style={styles.tableValueCell}>
                {isCurrentYear ? (
                  <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                      <Text style={styles.balanceLabel}>총 휴가</Text>
                      <Text style={styles.balanceValue}>
                        {balancesLoading ? "-" : `${balances.totalDays}일`}
                      </Text>
                    </View>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceItem}>
                      <Text style={styles.balanceLabel}>잔여</Text>
                      <Text style={styles.balanceValue}>
                        {balancesLoading ? "-" : `${balances.remainingDays}일`}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.balanceNotice}>
                    당해연도건만 확인할 수 있습니다.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.messageHeader}>
            <View>
              <Text style={styles.sectionTitle}>거절 사유</Text>
              <Text style={styles.sectionSub}>반려 시 사유가 표시됩니다.</Text>
            </View>
            {isPending && (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingText}>대기중</Text>
              </View>
            )}
          </View>
          <View style={styles.sectionDivider} />
          <Text style={styles.messageText}>
            {rejectionReason || "거절 사유가 없습니다."}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>뒤로</Text>
      </TouchableOpacity>
    </PageLayout>
  );
}

function InfoRow({ label, value, multiline = false, isLast = false }) {
  return (
    <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
      <View style={styles.tableLabelCell}>
        <Text style={styles.tableLabel}>{label}</Text>
      </View>
      <View style={styles.tableValueCell}>
        <Text
          style={[styles.tableValue, multiline && styles.tableValueMultiline]}
          numberOfLines={multiline ? 3 : 1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  sectionSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F172A",
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
  table: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabelCell: {
    width: 160,
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    justifyContent: "center",
  },
  tableValueCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  tableLabel: { fontSize: 12, fontWeight: "600", color: "#475569" },
  tableValue: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  tableValueMultiline: { lineHeight: 20 },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceItem: { flex: 1 },
  balanceLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 6 },
  balanceValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  balanceDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },
  balanceNotice: { fontSize: 13, color: "#94A3B8" },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingPill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: { fontSize: 12, fontWeight: "600", color: "#B45309" },
  messageText: { fontSize: 14, color: "#DC2626", lineHeight: 20 },
  backButton: {
    alignSelf: "center",
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  backButtonText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
});
