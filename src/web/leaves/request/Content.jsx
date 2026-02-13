import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TextInput } from "react-native-gesture-handler";
import api from "../../../api/api";
import PageLayout from "../../../components/PageLayout";

const approvalApi = (id) => `/leaves/${id}/approval`;

function formatPeriod(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}

function displayLeaveType(type) {
  if (!type) return "-";
  if (["연차", "오전반차", "오후반차"].includes(type)) return type;
  if (["건강검진", "예비군", "특별보상휴가", "무급"].includes(type)) return "기타";
  return "경조사";
}

export default function RequestContent({ route }) {
  const navigation = useNavigation();
  const params = route?.params ?? {};

  const {
    id,
    depart = "", 
    department = "",
    name = "",
    position = "사원",
    type = "연차",
    startDate = "",
    endDate = "",
    usedDay = 0,
    days, 
    reason = "기타",
    extra = "없음.",
    createdAt = "",
  } = params;

  const deptName = department || depart || "-";
  const useDate = useMemo(() => formatPeriod(startDate, endDate), [startDate, endDate]);
  const remainDays = useMemo(() => (days ? days : `${usedDay}일`), [days, usedDay]);
  const displayType = useMemo(() => displayLeaveType(type), [type]);

  const [rejectReason, setRejectReason] = useState(""); 
  const [submitting, setSubmitting] = useState(false);

  const patchApproval = async ({ approvalStatus, rejectionReason }) => {
    const payload = {
      approvalStatus,
      ...(approvalStatus === "반려"
        ? { rejectionReason: rejectionReason || "" }
        : {}),
    };
    await api.patch(approvalApi(id), payload);
  };

  const onApprove = async () => {
    if (!id) {
      Alert.alert("오류", "요청 id가 없습니다.");
      return;
    }

    try {
      setSubmitting(true);
      await patchApproval({ approvalStatus: "승인" });
      Alert.alert("완료", "승인 처리되었습니다.");
      navigation.navigate("LeaveRequest");
    } catch (e) {
      console.log("approve error:", e?.message, e?.response?.status, e?.response?.data);
      Alert.alert("오류", "승인 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onReject = async () => {
    if (!id) {
      Alert.alert("오류", "요청 id가 없습니다.");
      return;
    }
    if (!rejectReason.trim()) {
      Alert.alert("필수", "반려 사유를 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await patchApproval({
        approvalStatus: "반려",
        rejectionReason: rejectReason.trim(),
      });
      Alert.alert("완료", "반려 처리되었습니다.");
      navigation.navigate("LeaveRequest");
    } catch (e) {
      console.log("reject error:", e?.message, e?.response?.status, e?.response?.data);
      Alert.alert("오류", "반려 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: "휴가 결재 요청", route: "LeaveRequest" },
        { label: "요청 상세" },
      ]}
      title="요청 상세"
      contentStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
    >
      {submitting && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>처리중...</Text>
        </View>
      )}

      <View style={styles.pageWrap}>
        <View style={styles.pageGrid}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>휴가 신청서</Text>
              <Text style={styles.sectionSub}>작성한 신청 내용을 확인하세요.</Text>
            </View>
            <View style={styles.sectionDivider} />

            <View style={styles.table}>
              <InfoRow label="소속" value={deptName} />
              <InfoRow label="성명" value={name || "-"} />
              <InfoRow label="직급" value={position || "-"} />
              <InfoRow label="휴가형태" value={displayType} />
              <InfoRow label="기간" value={useDate} />
              <InfoRow label="사용일" value={remainDays} />
              <InfoRow label="사유" value={reason || "기타"} />
              <InfoRow
                label="기타 사항"
                value={extra || "없음."}
                multiline
                isLast
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {createdAt ? String(createdAt) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>반려 사유</Text>
              <Text style={styles.sectionSub}>
                반려 시 필수로 입력해야 합니다.
              </Text>
            </View>
            <View style={styles.sectionDivider} />

            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              editable={!submitting}
              multiline
              style={styles.textArea}
              placeholder="사유를 입력해주세요."
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.approveBtn, submitting && styles.btnDisabled]}
                disabled={submitting}
                onPress={onApprove}
              >
                <Text style={styles.approveBtnText}>승인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rejectBtn, submitting && styles.btnDisabled]}
                disabled={submitting}
                onPress={onReject}
              >
                <Text style={styles.rejectBtnText}>반려</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.backBtnText}>뒤로</Text>
        </TouchableOpacity>
      </View>
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
          numberOfLines={multiline ? 4 : 1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  loadingText: { marginLeft: 8, color: "#64748B" },

  pageGrid: {
    flexDirection: "column",
    gap: 16,
    alignItems: "stretch",
  },
  pageWrap: {
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
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

  sectionHeader: { marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  sectionSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },

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
    width: 140,
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

  metaRow: { alignItems: "flex-end", marginTop: 6 },
  metaText: { fontSize: 12, color: "#94A3B8" },

  textArea: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "white",
    textAlignVertical: "top",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  approveBtn: {
    flex: 1,
    backgroundColor: "#121D6D",
    borderWidth: 1,
    borderColor: "#121D6D",
    paddingVertical: 12,
    borderRadius: 12,
  },
  approveBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FF2116",
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 12,
  },
  rejectBtnText: {
    color: "#FF2116",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  backBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backBtnText: { color: "#64748B", fontWeight: "600" },

  btnDisabled: {
    opacity: 0.6,
  },
});
