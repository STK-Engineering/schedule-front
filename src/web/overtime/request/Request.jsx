import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../../api/api";
import PageLayout from "../../../components/PageLayout";

const approvalApi = (id) => `/overtime/${id}/approval`;

export default function Request() {
  const navigation = useNavigation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/overtime/pending-requests");
      const list = Array.isArray(res.data) ? res.data : [];

      const mapped = list.map((e) => ({
        id: e.id,
        depart: e.employee?.department?.name ?? "",
        name: e.employee?.name ?? "",
        position: e.employee?.level ?? "사원",
        jobNumber: e.jobNumber ?? "",
        vesselName: e.vesselName ?? "",
        hullNo: e.hullNo ?? "",
        jobDescription: e.jobDescription ?? "",
        requestDate: e.requestDate ?? "",
        startTime: e.startTime ?? "",
        endTime: e.endTime ?? "",
        createdAt: e.createdAt ?? "",
      }));

      setData(mapped);
    } catch (e) {
      console.log(
        "request list error:",
        e?.message,
        e?.response?.status,
        e?.response?.data
      );
      setError("요청 목록을 불러오지 못 했습니다.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const patchApproval = async ({ id, approvalStatus, rejectionReason }) => {
    const payload = {
      approvalStatus,
      ...(approvalStatus === "반려"
        ? { rejectionReason: rejectionReason || "" }
        : {}),
    };
    await api.patch(approvalApi(id), payload);
  };

  const onApprove = async (id) => {
    try {
      await patchApproval({ id, approvalStatus: "승인" });
      setData((prev) => prev.filter((x) => x.id !== id));
      Alert.alert("완료", "승인 처리되었습니다.");
    } catch (e) {
      console.log(
        "approve error:",
        e?.message,
        e?.response?.status,
        e?.response?.data
      );
      Alert.alert("오류", "승인 처리에 실패했습니다.");
    }
  };

  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    if (submittingReject) return;
    setRejectModalVisible(false);
    setRejectReason("");
    setRejectTargetId(null);
  };

  const submitReject = async () => {
    if (!rejectTargetId) return;

    try {
      setSubmittingReject(true);

      await patchApproval({
        id: rejectTargetId,
        approvalStatus: "반려",
        rejectionReason: rejectReason?.trim() ?? "",
      });

      setData((prev) => prev.filter((x) => x.id !== rejectTargetId));
      closeRejectModal();
      Alert.alert("완료", "반려 처리되었습니다.");
    } catch (e) {
      console.log(
        "reject error:",
        e?.message,
        e?.response?.status,
        e?.response?.data
      );
      Alert.alert("오류", "반려 처리에 실패했습니다.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const breadcrumb = [
    { label: "홈", route: "Home" },
    { label: "연장 근로 신청", route: "Form" },
    { label: "요청 사항" },
  ];

  if (loading) {
    return (
      <PageLayout breadcrumb={breadcrumb} title="요청 현황">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: "#64748B" }}>불러오는 중...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        breadcrumb={breadcrumb}
        title="요청 현황"
        contentStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>요청 목록</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{data.length}</Text>
            </View>
          </View>

          {data.length === 0 ? (
            <Text style={styles.emptyText}>요청 목록이 없습니다.</Text>
          ) : (
            data.map((item) => (
              <Item
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate("OverTimeRequestContent", { ...item })
                }
                onApprove={() => onApprove(item.id)}
                onReject={() => openRejectModal(item.id)}
              />
            ))
          )}
        </View>
      </PageLayout>

      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeRejectModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%", alignItems: "center" }}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>반려 사유 입력</Text>

              <Text style={styles.modalHelp}>
                반려 사유를 입력한 뒤 확인을 눌러주세요.
              </Text>

              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="예) 일정 조정 필요 / 증빙 자료 누락 등"
                multiline
                numberOfLines={4}
                style={styles.modalInput}
                autoFocus
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  onPress={closeRejectModal}
                  disabled={submittingReject}
                  style={[
                    styles.modalBtn,
                    styles.modalCancelBtn,
                    submittingReject && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.modalCancelText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitReject}
                  disabled={submittingReject}
                  style={[
                    styles.modalBtn,
                    styles.modalOkBtn,
                    submittingReject && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.modalOkText}>
                    {submittingReject ? "처리 중..." : "확인"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

function Item({ item, onPress, onApprove, onReject }) {
  const timeRange =
    item.startTime || item.endTime
      ? `${item.startTime || "-"} ~ ${item.endTime || "-"}`
      : "-";
  const title = `${item.jobNumber || "-"}(${item.name || "-"})`;
  const vesselParts = [];
  if (item.vesselName) vesselParts.push(`호선명 ${item.vesselName}`);
  if (item.hullNo) vesselParts.push(`호선번호 ${item.hullNo}`);
  const vesselLabel = vesselParts.join(" / ");

  return (
    <Pressable style={styles.itemCard} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemType}>{title}</Text>
        <Text style={styles.itemSub}>
          {item.requestDate || "-"} / {timeRange}
        </Text>
        {!!vesselLabel && (
          <Text style={styles.itemMeta}>{vesselLabel}</Text>
        )}
      </View>

      <View style={styles.itemRight}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={(e) => {
            e?.stopPropagation?.();
            onApprove();
          }}
        >
          <Text style={styles.approveText}>승인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={(e) => {
            e?.stopPropagation?.();
            onReject();
          }}
        >
          <Text style={styles.rejectText}>반려</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = {
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 18,
  },

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

  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 34,
  },
  approveBtn: {
    backgroundColor: "#121D6D",
  },
  approveText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
  },
  rejectText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalHelp: {
    color: "#64748B",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    textAlignVertical: "top",
    backgroundColor: "white",
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  modalCancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    color: "#0F172A",
    fontWeight: "600",
  },
  modalOkBtn: {
    backgroundColor: "#FF2116",
  },
  modalOkText: {
    color: "white",
    fontWeight: "700",
  },
};
