import React, { useContext, useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";
import { LeaveBalanceContext } from "../../context/LeaveBalanceContext";

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

export default function Form() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bump } = useContext(LeaveBalanceContext);
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;

  const [leaveType, setLeaveType] = useState("연차");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [etc, setEtc] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const [balances, setBalances] = useState({ totalDays: 0, remainingDays: 0 });
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [spouseMaternityEligible, setSpouseMaternityEligible] = useState(false);
  const [employee, setEmployee] = useState({ name: "", department: "" });
  const preselectLeaveType = route?.params?.preselectLeaveType;

  useEffect(() => {
    if (!preselectLeaveType) return;
    setLeaveType(preselectLeaveType);
    setStartDate("");
    setEndDate("");
    setReason("");
    setEtc("");
    setChecked(false);
    setAttemptedCheck(false);
  }, [preselectLeaveType]);
  const condolenceReasons = useMemo(() => {
    const base = [
      "본인결혼(5일)",
      "부모, 배우자 사망(5일)",
      "조부모, 외조부모 사망(3일)",
      "자녀, 자녀의 배우자 사망(3일)",
      "본인, 배우자의 형제 자매 사망(3일)",
    ];

    if (spouseMaternityEligible) {
      base.push("배우자 출산(20일)");
    }

    return base;
  }, [spouseMaternityEligible]);
  const etcReasons = ["건강검진(1일)", "예비군", "특별보상휴가", "무급"];
  const condolenceMaxDays = (() => {
    const match = String(reason || "").match(/(\d+)일/);
    return match ? Number(match[1]) : null;
  })();
  const isSpouseMaternity =
    leaveType === "경조사" && reason === "배우자 출산(20일)";
  const maxEndDate =
    leaveType === "경조사" &&
    startDate &&
    condolenceMaxDays &&
    !isSpouseMaternity
      ? (() => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + condolenceMaxDays - 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        })()
      : undefined;

  const leaveTypeToCategory = (type) => {
    if (type === "경조사") return "FAMILY_EVENTS";
    if (type === "기타") return "ETC";
    return "ANNUAL";
  };

  const normalizeLeaveTypeForApi = (type, reasonText) => {
    if (type === "경조사") {
      const map = {
        "본인결혼(5일)": "본인의 결혼",
        "부모, 배우자 사망(5일)":
          "본인•배우자의 부모 또는 배우자의 사망",
        "조부모, 외조부모 사망(3일)":
          "본인•배우자의 조부모 또는 외조부모의 사망",
        "자녀, 자녀의 배우자 사망(3일)": "자녀 또는 자녀의 배우자 사망",
        "본인, 배우자의 형제 자매 사망(3일)":
          "본인•배우자의 형제•자매 사망",
        "배우자 출산(20일)": "배우자 출산",
      };
      return map[reasonText] ?? reasonText ?? "경조사";
    }

    if (type === "기타") {
      const map = {
        "건강검진(1일)": "건강검진",
        예비군: "예비군",
        특별보상휴가: "특별보상휴가",
        무급: "무급",
      };
      return map[reasonText] ?? reasonText ?? "기타";
    }

    return type;
  };

  const sendDateForm = async () => {
    if (!isChecked) return;

    const payload = {
      startDate: startDate,
      endDate: endDate,
      ...(isSpouseMaternity
        ? {}
        : {
            leaveCategory: leaveTypeToCategory(leaveType),
            leaveType: normalizeLeaveTypeForApi(leaveType, reason),
          }),
      reason,
      etc,
    };

    try {
      const endpoint = isSpouseMaternity ? "/spouse-maternity" : "/leaves";
      const response = await api.post(endpoint, payload);
      console.log("신청 성공", response.data);
      bump();
      navigation.navigate("LeaveStatus");
    } catch (err) {
      console.error("신청 실패", err);
    }
  };

  const isHalfDay = leaveType === "오전반차" || leaveType === "오후반차";
  const isHealthCheck =
    leaveType === "기타" && reason.startsWith("건강검진");
  const currentYear = new Date().getFullYear();
  const selectedYears = [startDate, endDate]
    .filter(Boolean)
    .map((value) => Number(String(value).slice(0, 4)))
    .filter(Boolean);
  const isCurrentYear = selectedYears.length
    ? selectedYears.every((year) => year === currentYear)
    : true;

  const isFormValid =
    leaveType &&
    startDate &&
    endDate &&
    reason.trim().length > 0;

  useEffect(() => {
    if (!isFormValid && isChecked) {
      setChecked(false);
    }

    if (!isFormValid && attemptedCheck) {
      setAttemptedCheck(false);
    }
  }, [isFormValid, isChecked, attemptedCheck]);

  useEffect(() => {
    if (leaveType === "경조사" && !condolenceReasons.includes(reason)) {
      setReason("");
    }
    if (leaveType === "기타" && !etcReasons.includes(reason)) {
      setReason("");
    }
  }, [leaveType, reason, condolenceReasons, etcReasons]);

  useEffect(() => {
    if (leaveType !== "경조사" || !startDate || !maxEndDate) return;
    if (endDate !== maxEndDate) {
      setEndDate(maxEndDate);
    }
  }, [leaveType, startDate, maxEndDate, endDate]);

  useEffect(() => {
    if (!maxEndDate || !endDate) return;
    if (endDate > maxEndDate) {
      setEndDate(maxEndDate);
    }
  }, [endDate, maxEndDate]);

  useEffect(() => {
    let mounted = true;

    const fetchBalances = async () => {
      try {
        setBalancesLoading(true);

        const res = await api.get("/balances");
        const data = res.data ?? {};

        if (!mounted) return;

        setEmployee({
          name: data.name ?? data.employee?.name ?? "",
          department: data.department ?? data.employee?.department?.name ?? "",
        });

        setBalances({
          totalDays: Number(data.totalDays ?? 0),
          remainingDays: Number(data.remainingDays ?? 0),
        });
      } catch (e) {
        console.log("balances fetch error:", e);
        if (!mounted) return;

        setEmployee({ name: "", department: "" });
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

  useEffect(() => {
    let mounted = true;

    const fetchSpouseMaternity = async () => {
      try {
        const res = await api.get("/spouse-maternity");
        const data = res.data ?? {};
        const list = Array.isArray(data) ? data : [data];
        const eligible = list.some(
          (item) => Number(item?.totalDays ?? 0) === 20
        );
        if (mounted) setSpouseMaternityEligible(eligible);
      } catch (e) {
        console.log("spouse maternity fetch error:", e);
        if (mounted) setSpouseMaternityEligible(false);
      }
    };

    fetchSpouseMaternity();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageLayout
      breadcrumb={[{ label: "홈", route: "Home" }, { label: "휴가 신청" }]}
      title="휴가 신청"
    >
      <ScrollView
        contentContainerStyle={[
          styles.pageWrap,
          isNarrow && styles.pageWrapStack,
        ]}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>휴가 신청</Text>
          <Text style={styles.pageSub}>
            휴가 신청서를 작성하고 제출해 주세요.
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
            <Text style={styles.fieldGroupTitle}>휴가 유형</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <View style={styles.leaveTypeRow}>
                  {["연차", "오전반차", "오후반차", "경조사", "기타"].map(
                    (item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.leaveTypeButton,
                          leaveType === item && styles.leaveTypeButtonActive,
                        ]}
                        onPress={() => {
                          setLeaveType(item);
                          setStartDate("");
                          setEndDate("");
                        }}
                      >
                        <Text
                          style={[
                            styles.leaveTypeText,
                            leaveType === item && styles.leaveTypeTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>기간</Text>
            <View style={styles.fieldRow}>
              {isHalfDay || isHealthCheck ? (
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>요청일자</Text>
                  <input
                    type="date"
                    style={htmlInputStyle}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>시작일</Text>
                    <input
                      type="date"
                      style={htmlInputStyle}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </View>
                  <View style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>종료일</Text>
                    <input
                      type="date"
                      style={htmlInputStyle}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      max={maxEndDate}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>사유</Text>
            {leaveType === "경조사" || leaveType === "기타" ? (
              <View style={styles.reasonOptionsRow}>
                {(leaveType === "경조사" ? condolenceReasons : etcReasons).map(
                  (option) => (
                    <React.Fragment key={option}>
                      <TouchableOpacity
                        style={[
                          styles.reasonOptionButton,
                          reason === option && styles.reasonOptionButtonActive,
                        ]}
                        onPress={() => setReason(option)}
                      >
                        <Text
                          style={[
                            styles.reasonOptionText,
                            reason === option && styles.reasonOptionTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                      {leaveType === "경조사" &&
                        option === "조부모, 외조부모 사망(3일)" && (
                          <View style={styles.reasonLineBreak} />
                        )}
                      {leaveType === "경조사" &&
                        option === "본인, 배우자의 형제 자매 사망(3일)" && (
                          <View style={styles.reasonLineBreak} />
                        )}
                    </React.Fragment>
                  )
                )}
                <View style={styles.reasonHintRow}>
                  <Text style={styles.reasonHint}>
                    *사유(최대 사용가능 일자) / 출산(20일)을 제외한 모든
                    경조사는 주말, 공휴일이 포함되어 계산됩니다.
                  </Text>
                </View>
              </View>
            ) : (
              <TextInput
                placeholder="사유를 입력하세요"
                value={reason}
                onChangeText={setReason}
                style={[styles.input, styles.textAreaShort]}
                multiline
              />
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>기타 사항</Text>
            <TextInput
              placeholder="기타 사항을 입력하세요"
              value={etc}
              onChangeText={setEtc}
              style={[styles.input, styles.textArea]}
              multiline
            />
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
              <Text style={styles.previewTitle}>휴가 사용 신청서</Text>
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
            <PreviewRow label="소속" value={employee.department || "-"} />
            <PreviewRow label="성명" value={employee.name || "-"} />
            <PreviewRow label="휴가형태" value={leaveType || "-"} />
            <PreviewRow
              label="기 간"
              value={`${startDate || "-"} ~ ${endDate || "-"}`}
            />
            <PreviewRow label="사유" value={reason || "-"} />
            <PreviewRow label="기타 사항" value={etc || "-"} multiline />
            <PreviewRow
              label="총 휴가 일수"
              value={
                isCurrentYear
                  ? balancesLoading
                    ? "-"
                    : `${balances.totalDays}일`
                  : "당해연도건만 확인할 수 있습니다."
              }
              valueStyle={!isCurrentYear ? styles.balanceNotice : undefined}
              multiline={!isCurrentYear}
            />
            <PreviewRow
              label="잔여 일수"
              value={
                isCurrentYear
                  ? balancesLoading
                    ? "-"
                    : `${balances.remainingDays}일`
                  : "당해연도건만 확인할 수 있습니다."
              }
              valueStyle={!isCurrentYear ? styles.balanceNotice : undefined}
              multiline={!isCurrentYear}
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
              <Text style={styles.checkWarn}>
                *휴가 사용 계획서는 사용 일자로부터 하루 전까지 취소와 수정이
                가능합니다.
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

function PreviewRow({ label, value, multiline = false, valueStyle }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.tableLabelCell}>
        <Text style={styles.tableLabel}>{label}</Text>
      </View>
      <View style={styles.tableValueCell}>
        <Text
          style={[
            styles.tableValue,
            multiline && styles.tableValueMultiline,
            valueStyle,
          ]}
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
  textAreaShort: {
    height: 90,
    width: "100%",
    minWidth: 0,
  },
  textArea: {
    height: 140,
    width: "100%",
    minWidth: 0,
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
  },
  leaveTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  leaveTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 10,
  },
  leaveTypeButtonActive: {
    backgroundColor: "#121D6D",
    borderColor: "#121D6D",
  },
  leaveTypeText: {
    fontSize: 14,
    color: "#475569",
  },
  leaveTypeTextActive: {
    color: "white",
  },
  reasonOptionsRow: {
    flexDirection: "row",
    columnGap: 10,
    rowGap: 6,
    flexWrap: "wrap",
  },
  reasonOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "white",
  },
  reasonOptionButtonActive: {
    backgroundColor: "#121D6D",
    borderColor: "#121D6D",
  },
  reasonOptionText: {
    fontSize: 14,
    color: "#475569",
  },
  reasonOptionTextActive: {
    color: "white",
  },
  reasonLineBreak: {
    flexBasis: "100%",
    height: 0,
  },
  reasonHintRow: {
    flexBasis: "100%",
    marginTop: 2,
  },
  reasonHint: {
    color: "#94A3B8",
    fontSize: 12,
  },
  check: {
    marginTop: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    backgroundColor: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-start",
    fontSize: 12.5,
    gap: 5,
    flexDirection: "row",
    justifyContent: "start",
    flexWrap: "wrap",
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
  checkbox: {
    margin: 8,
  },
  checkTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  checkText: {
    fontSize: 12.5,
    color: "#0F172A",
    flexShrink: 1,
  },
  checkWarn: {
    color: "red",
    fontSize: 12,
    flexShrink: 1,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  previewSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
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
  balanceNotice: { color: "#64748B" },
});
