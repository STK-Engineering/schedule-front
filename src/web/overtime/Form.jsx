import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";
import api from "../../api/api";
import Checkbox from "expo-checkbox";
const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
  반려: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
};

const htmlInputStyle = {
  padding: "11px 12px",
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  backgroundColor: "#FFFFFF",
  minWidth: 180,
  flexGrow: 1,
  fontSize: 14,
  color: "#0F172A",
  outline: "none",
};

const normalizeTimeValue = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{2}):(\d{2})/);
  if (!match) return text;
  return `${match[1]}:${match[2]}`;
};

const parseTimeToMinutes = (value) => {
  const normalized = normalizeTimeValue(value);
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
};

const MIN_OVERTIME_MINUTES = 30;
const MAX_OVERTIME_MINUTES = 12 * 60;

const getOvertimeDiffMinutes = (start, end) => {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes == null || endMinutes == null) return null;
  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const isValidOvertimeInterval = (start, end) => {
  const diff = getOvertimeDiffMinutes(start, end);
  if (diff == null) return false;
  return (
    diff >= MIN_OVERTIME_MINUTES &&
    diff <= MAX_OVERTIME_MINUTES &&
    diff % 30 === 0
  );
};

const showIntervalAlert = () => {
  const message =
    "종료시간은 시작시간 기준 30분 단위로, 최소 30분~최대 12시간 내에서 입력해주세요.";
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
    return;
  }
  Alert.alert("입력 오류", message);
};

export default function Form() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;

  const [jobNumber, setJobNumber] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [hullNo, setHullNo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const endTimeAlertTimerRef = useRef(null);

  const hasVesselOrHull =
    vesselName.trim().length > 0 || hullNo.trim().length > 0;
  const isFormValid =
    jobNumber.trim().length > 0 &&
    hasVesselOrHull &&
    jobDescription.trim().length > 0 &&
    requestDate &&
    startTime &&
    endTime &&
    isValidOvertimeInterval(startTime, endTime);

  const timeRange =
    startTime || endTime ? `${startTime || "-"} ~ ${endTime || "-"}` : "-";

  useEffect(() => {
    if (!isFormValid && isChecked) {
      setChecked(false);
    }
  }, [isFormValid, isChecked, attemptedCheck]);

  useEffect(() => {
    return () => {
      if (endTimeAlertTimerRef.current) {
        clearTimeout(endTimeAlertTimerRef.current);
      }
    };
  }, []);

  const handleEndTimeChange = (value) => {
    const nextEndTime = normalizeTimeValue(value);
    setEndTime(nextEndTime);

    if (endTimeAlertTimerRef.current) {
      clearTimeout(endTimeAlertTimerRef.current);
    }

    endTimeAlertTimerRef.current = setTimeout(() => {
      if (!startTime || !nextEndTime) return;
      if (!isValidOvertimeInterval(startTime, nextEndTime)) {
        showIntervalAlert();
      }
    }, 250);
  };

  const sendDateForm = async () => {
    if (!isChecked) return;
    if (!isValidOvertimeInterval(startTime, endTime)) {
      showIntervalAlert();
      return;
    }

    const withSeconds = (value) => {
      if (!value) return value;
      if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
      if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
      return value;
    };

    const payload = {
      jobNumber,
      vesselName,
      hullNo,
      jobDescription,
      requestDate,
      startTime: withSeconds(normalizeTimeValue(startTime)),
      endTime: withSeconds(normalizeTimeValue(endTime)),
    };

    try {
      await api.post("/overtime", payload);
      navigation.navigate("OverTimeStatus");
    } catch (err) {
      console.error("신청 실패", err);
    }
  };

  return (
    <PageLayout
      breadcrumb={[{ label: "홈", route: "Home" }, { label: "연장 근로 신청" }]}
      title="연장 근로 신청"
    >
      <ScrollView
        contentContainerStyle={[
          styles.pageWrap,
          isNarrow && styles.pageWrapStack,
        ]}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>연장 근로 신청</Text>
          <Text style={styles.pageSub}>
            연장 근로 신청서를 작성하고 제출해 주세요.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>신청 정보</Text>
            <Text style={styles.sectionSub}>
              필수 항목을 빠짐없이 입력해 주세요.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 정보</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>작업 번호(Job Number)</Text>
                <TextInput
                  placeholder="예: STKP-26000203"
                  value={jobNumber}
                  onChangeText={setJobNumber}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>호선명</Text>
                <TextInput
                  placeholder="예: HANJIN OCEAN 102"
                  value={vesselName}
                  onChangeText={setVesselName}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>호선 번호</Text>
                <TextInput
                  placeholder="예: HO-102"
                  value={hullNo}
                  onChangeText={setHullNo}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 일정</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>요청일자</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>시작시간</Text>
                <input
                  type="time"
                  style={htmlInputStyle}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>종료시간</Text>
                <input
                  type="time"
                  style={htmlInputStyle}
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 내용</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <Text style={styles.fieldLabel}>내용</Text>
                <TextInput
                  placeholder="작업 내용을 입력하세요"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>미리보기</Text>
            <Text style={styles.sectionSub}>
              작성한 신청 내용을 요약해 보여줍니다.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>연장 근로 신청서</Text>
              <Text style={styles.previewSub}>작성한 내용을 확인하세요.</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: STATUS_STYLE["대기"].bg },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_STYLE["대기"].dot },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: STATUS_STYLE["대기"].text },
                ]}
              >
                대기
              </Text>
            </View>
          </View>

          <View style={styles.previewTable}>
            <PreviewRow label="작업번호" value={jobNumber || "-"} />
            <PreviewRow label="선박명" value={vesselName || "-"} />
            <PreviewRow label="호선" value={hullNo || "-"} />
            <PreviewRow label="요청일자" value={requestDate || "-"} />
            <PreviewRow label="작업시간" value={timeRange} />
            <PreviewRow
              label="작업내용"
              value={jobDescription || "-"}
              multiline
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최종 확인</Text>
            <Text style={styles.sectionSub}>
              입력 내용 확인 후 제출해 주세요.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={[styles.check, isNarrow && styles.checkCompact]}>
            <Checkbox
              style={styles.checkbox}
              value={isChecked}
              onValueChange={(val) => {
                setAttemptedCheck(true);

                if (isFormValid) {
                  setChecked(val);
                }
              }}
              color={isFormValid ? "#121D6D" : "#b7b7b7"}
            />
            <View style={styles.checkTextWrap}>
              <Text style={styles.checkText}>
                위의 내용에 오탈자, 틀린 내용이 없는 지 최종적으로 확인 후,
                체크란을 클릭해주세요.
              </Text>
            </View>
          </View>

          <View style={[styles.alert, isNarrow && styles.alertCompact]}>
            {attemptedCheck && !isFormValid && (
              <Text style={{ color: "red", fontSize: 12 }}>
                필수 항목을 모두 입력해주세요.
              </Text>
            )}
          </View>

          <View style={[styles.actionRow, isNarrow && styles.actionRowStack]}>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                backgroundColor:
                  isChecked && isFormValid ? "#121D6D" : "#b7b7b7ff",
                width: "100%",
                borderWidth: 1,
                borderColor: isChecked && isFormValid ? "#121D6D" : "#b7b7b7ff",
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={sendDateForm}
              disabled={!isChecked || !isFormValid}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      </ScrollView>
    </PageLayout>
  );
}

function PreviewRow({ label, value, multiline = false }) {
  return (
    <View style={styles.tableRow}>
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
    padding: 20,
    paddingBottom: 40,
    gap: 18,
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
  },
  pageWrapStack: {
    padding: 16,
    gap: 16,
  },
  pageHeader: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 18,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  pageSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionHeader: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    flexWrap: "wrap",
  },
  inlineRowTop: {
    alignItems: "flex-start",
  },
  fieldGroup: {
    paddingVertical: 6,
  },
  fieldGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  fieldItem: {
    flexGrow: 1,
    minWidth: 200,
  },
  fieldItemFull: {
    minWidth: "100%",
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  actionRowStack: {
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  backButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backButtonText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  input: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: 180,
    flexGrow: 1,
  },
  textArea: {
    height: 140,
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  check: {
    marginTop: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    backgroundColor: "white",
    cursor: "pointer",
    alignItems: "center",
    fontSize: 12.5,
    gap: 10,
    flexDirection: "row",
  },
  checkCompact: {
    marginLeft: 0,
  },
  alert: {
    marginTop: 8,
    backgroundColor: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    flexDirection: "row",
    justifyContent: "start",
  },
  alertCompact: {
    marginLeft: 0,
  },
  checkbox: { margin: 0, marginRight: 8 },
  checkTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  checkText: {
    fontSize: 12.5,
    color: "#0F172A",
    flexShrink: 1,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  previewSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
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
  previewTable: {
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
});
