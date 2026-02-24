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
import { useNavigation, useRoute } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";
import api from "../../api/api";
import Checkbox from "expo-checkbox";

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

const EXTERNAL_ENGINEER_OPTION = "__EXTERNAL_ENGINEER__";
const WORK_TYPE_DESCRIPTION_MAP = {
  서비스: "SERVICE",
  엔지니어: "ENGINEERING",
  커미셔닝: "COMMISSIONING",
};
const DESCRIPTION_WORK_TYPE_MAP = {
  SERVICE: "서비스",
  ENGINEERING: "엔지니어",
  ENGINEER: "엔지니어",
  COMMISSIONING: "커미셔닝",
};

const buildDateRange = (from, to) => {
  const start = String(from ?? "").trim();
  const end = String(to ?? "").trim();
  if (!start || !end) return [];
  if (start > end) return null;

  const result = [];
  let cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  while (cursor <= endDate) {
    result.push(toYMD(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export default function Form() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route?.params ?? {};
  const isEdit = params?.mode === "edit";
  const source = params?.source ?? null;
  const editId = isEdit ? source?.id ?? params?.id : null;
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;

  const [jobNumber, setJobNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [hullNo, setHullNo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [note1, setNote1] = useState("");
  const [note2, setNote2] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDate2, setStartDate2] = useState("");
  const [endDate2, setEndDate2] = useState("");
  const [showSecondRange, setShowSecondRange] = useState(false);
  const [region, setRegion] = useState("");
  const [workType, setWorkType] = useState("");
  const [systemType, setSystemType] = useState("");
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [customEngineerNames, setCustomEngineerNames] = useState([]);
  const [engineerInput, setEngineerInput] = useState("");
  const [engineerLoading, setEngineerLoading] = useState(false);
  const [showExternalEngineerInput, setShowExternalEngineerInput] =
    useState(false);
  const [isChecked, setChecked] = useState(false);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const [pendingInternalNames, setPendingInternalNames] = useState([]);
  const endTimeAlertTimerRef = useRef(null);
  const prefillDoneRef = useRef(false);

  const hasVesselOrHull =
    vesselName.trim().length > 0 || hullNo.trim().length > 0;
  const requestDates1 = buildDateRange(startDate, endDate);
  const requestDates2 = buildDateRange(startDate2, endDate2);
  const hasRequestDate =
    Array.isArray(requestDates1) && requestDates1.length > 0;

  const isFormValid =
    jobNumber.trim().length > 0 &&
    customer.trim().length > 0 &&
    hasVesselOrHull &&
    jobDescription.trim().length > 0 &&
    region.trim().length > 0 &&
    hasRequestDate &&
    workType &&
    systemType &&
    note1.trim().length > 0 &&
    (!showSecondRange || note2.trim().length > 0) &&
    (selectedEngineers.length > 0 || customEngineerNames.length > 0);

  useEffect(() => {
    if (!isFormValid && isChecked) {
      setChecked(false);
    }
  }, [isFormValid, isChecked, attemptedCheck]);

  useEffect(() => {
    if (isEdit) {
      prefillDoneRef.current = false;
    }
  }, [isEdit, editId]);

  useEffect(() => {
    if (!isEdit || !source || prefillDoneRef.current) return;

    setJobNumber(source.jobNumber ?? "");
    setCustomer(source.customer ?? "");
    setVesselName(source.vesselName ?? "");
    setHullNo(source.hullNo ?? "");
    setJobDescription(source.jobDescription ?? "");
    setRegion(source.region ?? "");
    const description = String(source.description ?? "").trim();
    setWorkType(DESCRIPTION_WORK_TYPE_MAP[description] ?? description);
    setSystemType(source.systemType ?? "");

    const schedules = Array.isArray(source.jobScheduleList)
      ? source.jobScheduleList
      : [];
    const firstSchedule = schedules[0] ?? {};
    const secondSchedule = schedules[1] ?? null;

    setStartDate(firstSchedule.startDate ?? "");
    setEndDate(firstSchedule.endDate ?? "");
    setNote1(firstSchedule.note ?? "");

    if (secondSchedule) {
      setShowSecondRange(true);
      setStartDate2(secondSchedule.startDate ?? "");
      setEndDate2(secondSchedule.endDate ?? "");
      setNote2(secondSchedule.note ?? "");
    } else {
      setShowSecondRange(false);
      setStartDate2("");
      setEndDate2("");
      setNote2("");
    }

    const engineerList = Array.isArray(firstSchedule.jobScheduleEngineerList)
      ? firstSchedule.jobScheduleEngineerList
      : [];
    const internalNames = engineerList
      .filter((engineer) => engineer.engineerType === "INTERNAL")
      .map((engineer) => engineer.engineerName)
      .filter(Boolean);
    const externalNames = engineerList
      .filter((engineer) => engineer.engineerType === "EXTERNAL")
      .map((engineer) => engineer.externalName ?? engineer.engineerName)
      .filter(Boolean);

    setSelectedEngineers([]);
    setCustomEngineerNames(externalNames);
    setPendingInternalNames(internalNames);

    prefillDoneRef.current = true;
  }, [isEdit, source]);

  useEffect(() => {
    if (!pendingInternalNames.length || engineers.length === 0) return;

    const matched = [];
    const unmatched = [];

    pendingInternalNames.forEach((name) => {
      const found = engineers.find(
        (engineer) => normalizeName(engineer.name) === normalizeName(name),
      );
      if (found) {
        matched.push(found);
      } else {
        unmatched.push(name);
      }
    });

    if (matched.length > 0) {
      setSelectedEngineers(matched);
    }
    if (unmatched.length > 0) {
      setCustomEngineerNames((prev) =>
        Array.from(new Set([...prev, ...unmatched])),
      );
    }
    setPendingInternalNames([]);
  }, [pendingInternalNames, engineers]);

  useEffect(() => {
    return () => {
      if (endTimeAlertTimerRef.current) {
        clearTimeout(endTimeAlertTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchEngineers = async () => {
      try {
        setEngineerLoading(true);
        const res = await api.get("/employees");
        const list = Array.isArray(res.data) ? res.data : [];
        if (!mounted) return;

        const mapped = list
          .map((e) => ({
            id: e.id,
            name: e.name ?? "",
            department: e.department?.name ?? e.department ?? "",
          }))
          .filter((e) => e.id != null)
          .filter((e) => {
            const dept = String(e.department ?? "")
              .trim()
              .toUpperCase();
            return dept === "ENGINEERING";
          })
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));

        setEngineers(mapped);
      } catch (e) {
        console.log(
          "employee list error:",
          e?.response?.status,
          e?.response?.data,
        );
        if (!mounted) return;
        setEngineers([]);
      } finally {
        if (mounted) setEngineerLoading(false);
      }
    };

    fetchEngineers();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizeName = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const addEngineerById = (id) => {
    const found = engineers.find((e) => String(e.id) === String(id));
    if (!found) return;
    const exists = selectedEngineers.some(
      (e) => String(e.id) === String(found.id),
    );
    if (exists) return;
    setSelectedEngineers((prev) => [...prev, found]);
  };

  const addCustomEngineerName = (name) => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return;
    const normalized = normalizeName(trimmed);
    const existsInSelected = selectedEngineers.some(
      (e) => normalizeName(e.name) === normalized,
    );
    const existsInCustom = customEngineerNames.some(
      (n) => normalizeName(n) === normalized,
    );
    if (existsInSelected || existsInCustom) return;
    setCustomEngineerNames((prev) => [...prev, trimmed]);
  };

  const removeSelectedEngineer = (id) => {
    setSelectedEngineers((prev) =>
      prev.filter((e) => String(e.id) !== String(id)),
    );
  };

  const removeCustomEngineer = (name) => {
    setCustomEngineerNames((prev) =>
      prev.filter((n) => normalizeName(n) !== normalizeName(name)),
    );
  };

  const sendDateForm = async () => {
    if (!isChecked) return;
    if (isEdit && !editId) {
      Alert.alert("오류", "수정할 일정 id가 없습니다.");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("입력 오류", "시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    if (!requestDates1) {
      Alert.alert("입력 오류", "1차 종료일은 1차 시작일보다 빠를 수 없습니다.");
      return;
    }
    if ((startDate2 && !endDate2) || (!startDate2 && endDate2)) {
      Alert.alert("입력 오류", "2차 기간은 시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    if ((startDate2 || endDate2) && !requestDates2) {
      Alert.alert("입력 오류", "2차 종료일은 2차 시작일보다 빠를 수 없습니다.");
      return;
    }
    if (!note1.trim()) {
      Alert.alert("입력 오류", "1차 비고를 입력해주세요.");
      return;
    }
    if (showSecondRange && !note2.trim()) {
      Alert.alert("입력 오류", "2차 비고를 입력해주세요.");
      return;
    }

    const description =
      WORK_TYPE_DESCRIPTION_MAP[workType] ?? String(workType ?? "").trim();

    const jobScheduleEngineers = [
      ...selectedEngineers.map((engineer) => ({
        engineerType: "INTERNAL",
        engineerId: engineer.id,
      })),
      ...customEngineerNames.map((name) => ({
        engineerType: "EXTERNAL",
        externalName: name,
      })),
    ];

    const jobScheduleRequests = [
      {
        startDate,
        endDate,
        note: note1,
        jobScheduleEngineers,
      },
    ];
    if (startDate2 && endDate2) {
      jobScheduleRequests.push({
        startDate: startDate2,
        endDate: endDate2,
        note: note2,
        jobScheduleEngineers,
      });
    }

    try {
      const payload = {
        description,
        systemType,
        jobNumber,
        customer,
        vesselName,
        hullNo,
        region,
        jobDescription,
        jobScheduleRequests,
      };

      if (isEdit && editId) {
        await api.put(`/engineer-schedule/${editId}`, payload);
        Alert.alert("완료", "일정이 수정되었습니다.");
      } else {
        await api.post("/engineer-schedule", payload);
        Alert.alert("완료", "일정이 등록되었습니다.");
      }
      navigation.navigate("SchedulingList");
    } catch (err) {
      console.error(isEdit ? "수정 실패" : "신청 실패", err);
      Alert.alert("실패", isEdit ? "일정 수정에 실패했습니다." : "등록에 실패했습니다.");
    }
  };

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: isEdit ? "일정 수정" : "일정 등록" },
      ]}
      title={isEdit ? "일정 수정" : "일정 등록"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.pageWrap,
          isNarrow && styles.pageWrapStack,
        ]}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {isEdit ? "일정 수정" : "일정 등록"}
          </Text>
          <Text style={styles.pageSub}>
            {isEdit ? "일정을 수정해 주세요." : "일정을 등록해 주세요."}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>신청 정보</Text>
            <Text style={styles.sectionSub}>
              * 표시는 필수 항목입니다.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 정보</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 작업 번호(Job Number)</Text>
                <TextInput
                  placeholder="예: STKP-26000203"
                  value={jobNumber}
                  onChangeText={setJobNumber}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 고객사명</Text>
                <TextInput
                  placeholder="예: STKP-26000203"
                  value={customer}
                  onChangeText={setCustomer}
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
            <View style={styles.fieldGroupHeader}>
              <Text style={styles.fieldGroupTitle}>작업 일정</Text>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 시작일</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 종료일</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </View>
            </View>
            <View style={[styles.fieldRow, styles.fieldRowSpaced]}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 작업</Text>
                <select
                  style={htmlInputStyle}
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="서비스">서비스</option>
                  <option value="엔지니어">엔지니어</option>
                  <option value="커미셔닝">커미셔닝</option>
                </select>
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 종류</Text>
                <select
                  style={htmlInputStyle}
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="AMS">AMS</option>
                  <option value="BMS">BMS</option>
                  <option value="PMS">PMS</option>
                </select>
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* 지역</Text>
                <TextInput
                  placeholder="예: 대한민국"
                  value={region}
                  onChangeText={setRegion}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>* 엔지니어 성함</Text>
              <View style={styles.engineerSelectWrap}>
                <select
                  style={htmlInputStyle}
                  value=""
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (nextId === EXTERNAL_ENGINEER_OPTION) {
                      setShowExternalEngineerInput(true);
                    } else if (nextId) {
                      setShowExternalEngineerInput(false);
                      addEngineerById(nextId);
                    }
                    e.target.value = "";
                  }}
                  disabled={engineerLoading}
                >
                  <option value="">
                    {engineerLoading ? "불러오는 중..." : "목록에서 선택"}
                  </option>
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </option>
                  ))}
                  <option value={EXTERNAL_ENGINEER_OPTION}>
                    외부 엔지니어
                  </option>
                </select>
                {showExternalEngineerInput && (
                  <TextInput
                    placeholder="외부 엔지니어 이름 입력 후 Enter"
                    value={engineerInput}
                    onChangeText={setEngineerInput}
                    onSubmitEditing={() => {
                      addCustomEngineerName(engineerInput);
                      setEngineerInput("");
                    }}
                    style={styles.input}
                  />
                )}
              </View>
              <View style={styles.engineerTagWrap}>
                {selectedEngineers.map((engineer) => (
                  <View key={engineer.id} style={styles.engineerTag}>
                    <Text style={styles.engineerTagText}>{engineer.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeSelectedEngineer(engineer.id)}
                      style={styles.engineerTagRemove}
                    >
                      <Text style={styles.engineerTagRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {customEngineerNames.map((name) => (
                  <View key={name} style={styles.engineerTag}>
                    <Text style={styles.engineerTagText}>{name}</Text>
                    <TouchableOpacity
                      onPress={() => removeCustomEngineer(name)}
                      style={styles.engineerTagRemove}
                    >
                      <Text style={styles.engineerTagRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>* 작업 내용</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
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

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>* 비고</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <Text style={styles.fieldLabel}>* 1차 비고</Text>
                <TextInput
                  placeholder="예: ETA: 11월 12일 / ETB: 11월 13일~11월 15일 / ETD: 11월 16일"
                  value={note1}
                  onChangeText={setNote1}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </View>
            </View>
          </View>
        </View>

        {!showSecondRange && (
          <View style={styles.addSecondRow}>
            <TouchableOpacity
              style={styles.addSecondIconButton}
              onPress={() => {
                setShowSecondRange(true);
              }}
              aria-label="2차 일정 추가"
            >
              <Text style={styles.addSecondIconText}>+ 추가</Text>
            </TouchableOpacity>
          </View>
        )}

        {showSecondRange && (
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldGroupHeader}>
                <Text style={styles.fieldGroupTitle}>2차 작업 일정</Text>
                <TouchableOpacity
                  style={styles.addSecondIconButton}
                  onPress={() => {
                    setShowSecondRange(false);
                    setStartDate2("");
                    setEndDate2("");
                    setNote2("");
                  }}
                  aria-label="2차 일정 제거"
                >
                  <Text style={styles.addSecondIconText}>- 제거</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>* 시작일</Text>
                  <input
                    type="date"
                    style={htmlInputStyle}
                    value={startDate2}
                    onChange={(e) => setStartDate2(e.target.value)}
                  />
                </View>
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>* 종료일</Text>
                  <input
                    type="date"
                    style={htmlInputStyle}
                    value={endDate2}
                    onChange={(e) => setEndDate2(e.target.value)}
                    min={startDate2 || undefined}
                  />
                </View>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldGroupTitle}>* 비고</Text>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldItem, styles.fieldItemFull]}>
                  <Text style={styles.fieldLabel}>* 2차 비고</Text>
                  <TextInput
                    placeholder="예: ETA: 11월 12일 / ETB: 11월 13일~11월 15일 / ETD: 11월 16일"
                    value={note2}
                    onChangeText={setNote2}
                    style={[styles.input, styles.textArea]}
                    multiline
                  />
                </View>
              </View>
            </View>
          </View>
        )}

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
              <Text style={styles.previewTitle}>일정표</Text>
              <Text style={styles.previewSub}>작성한 내용을 확인하세요.</Text>
            </View>
          </View>

          <View style={styles.previewTable}>
            <PreviewRow label="작업번호" value={jobNumber || "-"} />
            <PreviewRow label="선박명" value={vesselName || "-"} />
            <PreviewRow label="호선" value={hullNo || "-"} />
            <PreviewRow label="지역" value={region || "-"} />
            <PreviewRow
              label="요청일자"
              value={
                startDate
                  ? `${startDate} ~ ${endDate}${
                      startDate2 && endDate2 ? ` / ${startDate2} ~ ${endDate2}` : ""
                    }`
                  : "-"
              }
            />
            <PreviewRow label="작업" value={workType || "-"} />
            <PreviewRow label="종류" value={systemType || "-"} />
            <PreviewRow
              label="엔지니어"
              value={
                [...selectedEngineers, ...customEngineerNames].length
                  ? [
                      ...selectedEngineers.map((e) => e.name),
                      ...customEngineerNames,
                    ].join(", ")
                  : "-"
              }
            />
            <PreviewRow
              label={showSecondRange ? "비고(1차)" : "비고"}
              value={note1 || "-"}
              multiline
            />
            {showSecondRange && (
              <PreviewRow label="비고(2차)" value={note2 || "-"} multiline />
            )}
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
                {isEdit ? "수정" : "확인"}
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
  fieldGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  fieldRowSpaced: {
    marginTop: 12,
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
  addSecondRow: {
    display: "flex",
    alignItems: "flex-end",
    marginBottom: 16,
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
  addSecondIconButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addSecondIconText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 16,
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
  engineerSelectWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  engineerTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  engineerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  engineerTagText: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  engineerTagRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
  },
  engineerTagRemoveText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "700",
    lineHeight: 14,
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
