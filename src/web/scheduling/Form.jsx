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
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";
import api from "../../api/api";
import Checkbox from "expo-checkbox";

const FIELD_LABEL_COLOR = "#0F172A";
const PLACEHOLDER_COLOR = "#94A3B8";

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
const EXTERNAL_ENGINEER_PRESET_PREFIX = "__EXTERNAL_ENGINEER_PRESET__:";
const EXTERNAL_ENGINEER_PRESETS = [
  "건우파워텍",
  "KEJIMARIN (ALLEN)",
  "STUCKE (Tingjie)",
  "한나엔지니어링",
  "마린코리아",
  "YJ TECH",
  "삼영오토메이션",
  "한라시스템",
  "제타",
];
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
  const editId = isEdit ? (source?.id ?? params?.id) : null;
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;

  const [jobNumber, setJobNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [imoNumber, setImoNumber] = useState("");
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
  const [selectedEngineers1, setSelectedEngineers1] = useState([]);
  const [selectedEngineers2, setSelectedEngineers2] = useState([]);
  const [customEngineerNames1, setCustomEngineerNames1] = useState([]);
  const [customEngineerNames2, setCustomEngineerNames2] = useState([]);
  const [engineerInput1, setEngineerInput1] = useState("");
  const [engineerInput2, setEngineerInput2] = useState("");
  const [engineerLoading, setEngineerLoading] = useState(false);
  const [showExternalEngineerInput1, setShowExternalEngineerInput1] =
    useState(false);
  const [showExternalEngineerInput2, setShowExternalEngineerInput2] =
    useState(false);
  const [isChecked, setChecked] = useState(false);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const [pendingInternalNames1, setPendingInternalNames1] = useState([]);
  const [pendingInternalNames2, setPendingInternalNames2] = useState([]);
  const endTimeAlertTimerRef = useRef(null);
  const prefillDoneRef = useRef(false);
  const [jobSearchOpen, setJobSearchOpen] = useState(false);
  const [jobSearchKeyword, setJobSearchKeyword] = useState("");
  const [jobSearchResults, setJobSearchResults] = useState([]);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [jobSearchError, setJobSearchError] = useState("");

  const hasVesselOrHull =
    vesselName.trim().length > 0 || hullNo.trim().length > 0;
  const requestDates1 = buildDateRange(startDate, endDate);
  const requestDates2 = buildDateRange(startDate2, endDate2);
  const hasRequestDate =
    Array.isArray(requestDates1) && requestDates1.length > 0;

  const hasEngineers1 =
    selectedEngineers1.length > 0 || customEngineerNames1.length > 0;
  const hasEngineers2 =
    selectedEngineers2.length > 0 || customEngineerNames2.length > 0;

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
    hasEngineers1 &&
    (!showSecondRange || hasEngineers2);

  const normalizeKeyword = (value) => String(value ?? "").trim();

  const applyQuotation = (item, { force = false } = {}) => {
    if (!item) return;
    const nextJobNumber = item.jobNumber ?? "";
    const nextCustomer = item.customer ?? "";
    const nextVesselName = item.vesselName ?? "";
    const nextImoNumber = item.imoNumber ?? "";
    const nextHullNo = item.hullNo ?? "";
    const nextDescription =
      item.serviceDescription ?? item.jobDescription ?? item.sysName ?? "";
    const nextWorkType = item.divisionType ?? "";
    const nextSystemType = item.sysName ?? "";

    if (force || !jobNumber) setJobNumber(nextJobNumber);
    if (force || !customer) setCustomer(nextCustomer);
    if (force || !vesselName) setVesselName(nextVesselName);
    if (force || !imoNumber) setImoNumber(nextImoNumber);
    if (force || !hullNo) setHullNo(nextHullNo);
    if (force || !jobDescription) setJobDescription(nextDescription);
    if (force || !workType) setWorkType(nextWorkType);
    if (force || !systemType) setSystemType(nextSystemType);
  };

  const openJobSearch = () => {
    setJobSearchKeyword(jobNumber || "");
    setJobSearchResults([]);
    setJobSearchError("");
    setJobSearchOpen(true);
  };

  const closeJobSearch = () => {
    setJobSearchOpen(false);
  };

  const runJobSearch = async () => {
    const keyword = normalizeKeyword(jobSearchKeyword);
    if (!keyword) {
      setJobSearchResults([]);
      setJobSearchError("검색어를 입력해 주세요.");
      return;
    }
    try {
      setJobSearchLoading(true);
      setJobSearchError("");
      const res = await api.get("/engineer-schedule/quotation", {
        params: { keyword, page: 0, size: 50 },
      });
      const list = Array.isArray(res.data?.content) ? res.data.content : [];
      setJobSearchResults(list);
      if (list.length === 0) {
        setJobSearchError("검색 결과가 없습니다.");
      }
    } catch (e) {
      console.log("job search error:", e?.response?.data ?? e);
      setJobSearchResults([]);
      setJobSearchError("검색에 실패했습니다.");
    } finally {
      setJobSearchLoading(false);
    }
  };

  const handleSelectJob = (item) => {
    applyQuotation(item, { force: true });
    setJobSearchOpen(false);
    setJobSearchResults([]);
  };

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
    setImoNumber(source.imoNumber ?? "");
    setHullNo(source.hullNo ?? "");
    setJobDescription(
      source.serviceDescription ??
        source.jobDescription ??
        source.sysName ??
        "",
    );
    setRegion(source.region ?? "");
    const description = String(source.description ?? "").trim();
    setWorkType(
      source.divisionType ??
        DESCRIPTION_WORK_TYPE_MAP[description] ??
        description,
    );
    setSystemType(source.sysName ?? source.systemType ?? "");

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

    const engineerList1 = Array.isArray(firstSchedule.jobScheduleEngineerList)
      ? firstSchedule.jobScheduleEngineerList
      : [];
    const internalNames1 = engineerList1
      .filter((engineer) => engineer.engineerType === "INTERNAL")
      .map((engineer) => engineer.engineerName)
      .filter(Boolean);
    const externalNames1 = engineerList1
      .filter((engineer) => engineer.engineerType === "EXTERNAL")
      .map((engineer) => engineer.externalName ?? engineer.engineerName)
      .filter(Boolean);

    setSelectedEngineers1([]);
    setCustomEngineerNames1(externalNames1);
    setPendingInternalNames1(internalNames1);

    if (secondSchedule) {
      const engineerList2 = Array.isArray(
        secondSchedule.jobScheduleEngineerList,
      )
        ? secondSchedule.jobScheduleEngineerList
        : [];
      const internalNames2 = engineerList2
        .filter((engineer) => engineer.engineerType === "INTERNAL")
        .map((engineer) => engineer.engineerName)
        .filter(Boolean);
      const externalNames2 = engineerList2
        .filter((engineer) => engineer.engineerType === "EXTERNAL")
        .map((engineer) => engineer.externalName ?? engineer.engineerName)
        .filter(Boolean);
      setSelectedEngineers2([]);
      setCustomEngineerNames2(externalNames2);
      setPendingInternalNames2(internalNames2);
    } else {
      setSelectedEngineers2([]);
      setCustomEngineerNames2([]);
      setPendingInternalNames2([]);
    }

    prefillDoneRef.current = true;
  }, [isEdit, source]);

  useEffect(() => {
    if (!pendingInternalNames1.length || engineers.length === 0) return;

    const matched = [];
    const unmatched = [];

    pendingInternalNames1.forEach((name) => {
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
      setSelectedEngineers1(matched);
    }
    if (unmatched.length > 0) {
      setCustomEngineerNames1((prev) =>
        Array.from(new Set([...prev, ...unmatched])),
      );
    }
    setPendingInternalNames1([]);
  }, [pendingInternalNames1, engineers]);

  useEffect(() => {
    if (!pendingInternalNames2.length || engineers.length === 0) return;

    const matched = [];
    const unmatched = [];

    pendingInternalNames2.forEach((name) => {
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
      setSelectedEngineers2(matched);
    }
    if (unmatched.length > 0) {
      setCustomEngineerNames2((prev) =>
        Array.from(new Set([...prev, ...unmatched])),
      );
    }
    setPendingInternalNames2([]);
  }, [pendingInternalNames2, engineers]);

  useEffect(() => {
    return () => {
      if (endTimeAlertTimerRef.current) {
        clearTimeout(endTimeAlertTimerRef.current);
      }
    };
  }, []);

  const removeFirstSchedule = () => {
    if (!showSecondRange) return;
    setStartDate(startDate2);
    setEndDate(endDate2);
    setNote1(note2);
    setSelectedEngineers1(selectedEngineers2);
    setCustomEngineerNames1(customEngineerNames2);
    setStartDate2("");
    setEndDate2("");
    setNote2("");
    setShowSecondRange(false);
    setSelectedEngineers2([]);
    setCustomEngineerNames2([]);
    setPendingInternalNames2([]);
    setEngineerInput2("");
    setShowExternalEngineerInput2(false);
  };

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

  const addEngineerById = (id, index) => {
    const found = engineers.find((e) => String(e.id) === String(id));
    if (!found) return;
    const selected = index === 1 ? selectedEngineers1 : selectedEngineers2;
    const setSelected =
      index === 1 ? setSelectedEngineers1 : setSelectedEngineers2;
    const exists = selected.some((e) => String(e.id) === String(found.id));
    if (exists) return;
    setSelected((prev) => [...prev, found]);
  };

  const addCustomEngineerName = (name, index) => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return;
    const normalized = normalizeName(trimmed);
    const selected = index === 1 ? selectedEngineers1 : selectedEngineers2;
    const customNames =
      index === 1 ? customEngineerNames1 : customEngineerNames2;
    const setCustomNames =
      index === 1 ? setCustomEngineerNames1 : setCustomEngineerNames2;
    const existsInSelected = selected.some(
      (e) => normalizeName(e.name) === normalized,
    );
    const existsInCustom = customNames.some(
      (n) => normalizeName(n) === normalized,
    );
    if (existsInSelected || existsInCustom) return;
    setCustomNames((prev) => [...prev, trimmed]);
  };

  const removeSelectedEngineer = (id, index) => {
    const setSelected =
      index === 1 ? setSelectedEngineers1 : setSelectedEngineers2;
    setSelected((prev) => prev.filter((e) => String(e.id) !== String(id)));
  };

  const removeCustomEngineer = (name, index) => {
    const setCustomNames =
      index === 1 ? setCustomEngineerNames1 : setCustomEngineerNames2;
    setCustomNames((prev) =>
      prev.filter((n) => normalizeName(n) !== normalizeName(name)),
    );
  };

  const renderEngineerSelect = (index) => {
    const selected = index === 1 ? selectedEngineers1 : selectedEngineers2;
    const customNames =
      index === 1 ? customEngineerNames1 : customEngineerNames2;
    const engineerInput = index === 1 ? engineerInput1 : engineerInput2;
    const setEngineerInput =
      index === 1 ? setEngineerInput1 : setEngineerInput2;
    const showExternal =
      index === 1 ? showExternalEngineerInput1 : showExternalEngineerInput2;
    const setShowExternal =
      index === 1
        ? setShowExternalEngineerInput1
        : setShowExternalEngineerInput2;

    return (
      <View style={styles.fieldItem}>
        <Text style={styles.fieldLabel}>* Engineer</Text>
        <View style={styles.engineerSelectWrap}>
          <select
            style={htmlInputStyle}
            value=""
            onChange={(e) => {
              const nextId = e.target.value;
              if (nextId.startsWith(EXTERNAL_ENGINEER_PRESET_PREFIX)) {
                const name = nextId.slice(
                  EXTERNAL_ENGINEER_PRESET_PREFIX.length,
                );
                setShowExternal(false);
                addCustomEngineerName(name, index);
              } else if (nextId === EXTERNAL_ENGINEER_OPTION) {
                setShowExternal(true);
              } else if (nextId) {
                setShowExternal(false);
                addEngineerById(nextId, index);
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
            {EXTERNAL_ENGINEER_PRESETS.length > 0 && (
              <optgroup label="외부 엔지니어">
                {EXTERNAL_ENGINEER_PRESETS.map((name) => (
                  <option
                    key={`${EXTERNAL_ENGINEER_PRESET_PREFIX}${name}`}
                    value={`${EXTERNAL_ENGINEER_PRESET_PREFIX}${name}`}
                  >
                    {name}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={EXTERNAL_ENGINEER_OPTION}>텍스트 입력</option>
          </select>
          {showExternal && (
            <TextInput
              placeholder="외부 엔지니어 이름 입력 후 Enter"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={engineerInput}
              onChangeText={setEngineerInput}
              onSubmitEditing={() => {
                addCustomEngineerName(engineerInput, index);
                setEngineerInput("");
              }}
              style={styles.input}
            />
          )}
        </View>
        <View style={styles.engineerTagWrap}>
          {selected.map((engineer) => (
            <View key={engineer.id} style={styles.engineerTag}>
              <Text style={styles.engineerTagText}>{engineer.name}</Text>
              <TouchableOpacity
                onPress={() => removeSelectedEngineer(engineer.id, index)}
                style={styles.engineerTagRemove}
              >
                <Text style={styles.engineerTagRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {customNames.map((name) => (
            <View key={name} style={styles.engineerTag}>
              <Text style={styles.engineerTagText}>{name}</Text>
              <TouchableOpacity
                onPress={() => removeCustomEngineer(name, index)}
                style={styles.engineerTagRemove}
              >
                <Text style={styles.engineerTagRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
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
      Alert.alert(
        "입력 오류",
        "2차 기간은 시작일과 종료일을 모두 입력해주세요.",
      );
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

    const jobScheduleEngineers1 = [
      ...selectedEngineers1.map((engineer) => ({
        engineerType: "INTERNAL",
        engineerId: engineer.id,
      })),
      ...customEngineerNames1.map((name) => ({
        engineerType: "EXTERNAL",
        externalName: name,
      })),
    ];
    const jobScheduleEngineers2 = [
      ...selectedEngineers2.map((engineer) => ({
        engineerType: "INTERNAL",
        engineerId: engineer.id,
      })),
      ...customEngineerNames2.map((name) => ({
        engineerType: "EXTERNAL",
        externalName: name,
      })),
    ];

    const jobScheduleRequests = [
      {
        startDate,
        endDate,
        note: note1,
        jobScheduleEngineers: jobScheduleEngineers1,
      },
    ];
    if (startDate2 && endDate2) {
      jobScheduleRequests.push({
        startDate: startDate2,
        endDate: endDate2,
        note: note2,
        jobScheduleEngineers: jobScheduleEngineers2,
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
      Alert.alert(
        "실패",
        isEdit ? "일정 수정에 실패했습니다." : "등록에 실패했습니다.",
      );
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
            <Text style={styles.sectionSub}>* 표시는 필수 항목입니다.</Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* Job Number</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openJobSearch}
                >
                  <View pointerEvents="none">
                    <TextInput
                      placeholder="작업 번호 검색"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      value={jobNumber}
                      editable={false}
                      style={styles.input}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* Customer</Text>
                <TextInput
                  placeholder="예: 에스티케이엔지니어링 주식회사"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={customer}
                  onChangeText={setCustomer}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={[styles.fieldRow, styles.fieldRowSpaced]}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>IMO Number</Text>
                <TextInput
                  placeholder="예: 1234567"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={imoNumber}
                  onChangeText={setImoNumber}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* Region</Text>
                <TextInput
                  placeholder="예: 대한민국"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={region}
                  onChangeText={setRegion}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={[styles.fieldRow, styles.fieldRowSpaced]}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Vessel Name</Text>
                <TextInput
                  placeholder="예: HANJIN OCEAN 102"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={vesselName}
                  onChangeText={setVesselName}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Hull No</Text>
                <TextInput
                  placeholder="예: HO-102"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={hullNo}
                  onChangeText={setHullNo}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* Description</Text>
                <TextInput
                  placeholder="예: COMMISSIONING"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={workType}
                  onChangeText={setWorkType}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* System</Text>
                <TextInput
                  placeholder="예: SERVICE"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={systemType}
                  onChangeText={setSystemType}
                  style={styles.input}
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <Text style={styles.fieldLabel}>Details of Service Request</Text>
                <TextInput
                  placeholder="작업 내용을 입력하세요"
                  placeholderTextColor={PLACEHOLDER_COLOR}
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
          <View style={styles.fieldGroup}>
            {showSecondRange && (
              <View style={styles.fieldGroupHeader}>
                <View />
                <TouchableOpacity
                  style={styles.addSecondIconButton}
                  onPress={removeFirstSchedule}
                  aria-label="1차 일정 제거"
                >
                  <Text style={styles.addSecondIconText}>- 제거</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* Start Date</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>* End Date</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>{renderEngineerSelect(1)}</View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <Text style={styles.fieldLabel}>* Note</Text>
                <TextInput
                  placeholder="예: ETA: 11월 12일 / ETB: 11월 13일~11월 15일 / ETD: 11월 16일"
                  placeholderTextColor={PLACEHOLDER_COLOR}
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
                <View />
                <TouchableOpacity
                  style={styles.addSecondIconButton}
                  onPress={() => {
                    setShowSecondRange(false);
                    setStartDate2("");
                    setEndDate2("");
                    setNote2("");
                    setSelectedEngineers2([]);
                    setCustomEngineerNames2([]);
                    setPendingInternalNames2([]);
                    setEngineerInput2("");
                    setShowExternalEngineerInput2(false);
                  }}
                  aria-label="2차 일정 제거"
                >
                  <Text style={styles.addSecondIconText}>- 제거</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>* Start Date</Text>
                  <input
                    type="date"
                    style={htmlInputStyle}
                    value={startDate2}
                    onChange={(e) => setStartDate2(e.target.value)}
                  />
                </View>
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>* End Date</Text>
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
            <View style={styles.fieldGroup}>{renderEngineerSelect(2)}</View>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldItem, styles.fieldItemFull]}>
                  <Text style={styles.fieldLabel}>* 비고(2차)</Text>
                  <TextInput
                    placeholder="예: ETA: 11월 12일 / ETB: 11월 13일~11월 15일 / ETD: 11월 16일"
                    placeholderTextColor={PLACEHOLDER_COLOR}
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
            <PreviewRow label="Job Number" value={jobNumber || "-"} />
            <PreviewRow label="Vessel Name" value={vesselName || "-"} />
            <PreviewRow label="IMO Number" value={imoNumber || "-"} />
            <PreviewRow label="Hull No" value={hullNo || "-"} />
            <PreviewRow label="Region" value={region || "-"} />
            <PreviewRow
              label="Date"
              value={
                startDate
                  ? `${startDate} ~ ${endDate}${
                      startDate2 && endDate2
                        ? ` / ${startDate2} ~ ${endDate2}`
                        : ""
                    }`
                  : "-"
              }
            />
            <PreviewRow label="Description" value={workType || "-"} />
            <PreviewRow label="System" value={systemType || "-"} />
            <PreviewRow
              label={showSecondRange ? "Engineer(1차)" : "Engineer"}
              value={
                [...selectedEngineers1, ...customEngineerNames1].length
                  ? [
                      ...selectedEngineers1.map((e) => e.name),
                      ...customEngineerNames1,
                    ].join(", ")
                  : "-"
              }
            />
            {showSecondRange && (
              <PreviewRow
                label="Engineer(2차)"
                value={
                  [...selectedEngineers2, ...customEngineerNames2].length
                    ? [
                        ...selectedEngineers2.map((e) => e.name),
                        ...customEngineerNames2,
                      ].join(", ")
                    : "-"
                }
              />
            )}
            <PreviewRow
              label={showSecondRange ? "Note(1차)" : "Note"}
              value={note1 || "-"}
              multiline
            />
            {showSecondRange && (
              <PreviewRow label="Note(2차)" value={note2 || "-"} multiline />
            )}
            <PreviewRow
              label="Details of Service Request"
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

      <Modal
        visible={jobSearchOpen}
        transparent
        animationType="fade"
        onRequestClose={closeJobSearch}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeJobSearch}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.jobSearchModal}
          >
            <View style={styles.jobSearchHeader}>
              <Text style={styles.jobSearchTitle}>작업 번호 검색</Text>
              <TouchableOpacity onPress={closeJobSearch}>
                <Text style={styles.jobSearchClose}>닫기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.jobSearchRow}>
              <TextInput
                value={jobSearchKeyword}
                onChangeText={setJobSearchKeyword}
                placeholder="작업 번호를 입력하세요"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={styles.jobSearchInput}
                autoCorrect={false}
                autoCapitalize="none"
                onSubmitEditing={runJobSearch}
              />
              <TouchableOpacity
                style={styles.jobSearchButton}
                onPress={runJobSearch}
                disabled={jobSearchLoading}
              >
                <Text style={styles.jobSearchButtonText}>
                  {jobSearchLoading ? "검색중..." : "찾기"}
                </Text>
              </TouchableOpacity>
            </View>
            {jobSearchError ? (
              <Text style={styles.jobSearchError}>{jobSearchError}</Text>
            ) : null}
            <ScrollView style={styles.jobSearchResultList}>
              {jobSearchResults.map((item) => (
                <TouchableOpacity
                  key={`${item.jobNumber}-${item.imoNumber ?? ""}`}
                  style={styles.jobSearchResultItem}
                  activeOpacity={0.85}
                  onPress={() => handleSelectJob(item)}
                >
                  <Text style={styles.jobSearchResultTitle}>
                    {item.jobNumber}
                  </Text>
                  <Text style={styles.jobSearchResultSub} numberOfLines={2}>
                    {[
                      item.customer,
                      item.vesselName,
                      item.imoNumber,
                      item.hullNo,
                      item.sysName,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  cardStackTop: {
    zIndex: 9999,
    position: "relative",
    overflow: "visible",
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
  fieldGroupOverlay: {
    zIndex: 9999,
    position: "relative",
    overflow: "visible",
  },
  fieldGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  fieldRowOverlay: {
    zIndex: 9999,
    position: "relative",
    overflow: "visible",
  },
  fieldRowSpaced: {
    marginTop: 12,
  },
  fieldItem: {
    flexGrow: 1,
    minWidth: 200,
  },
  fieldItemOverlay: {
    zIndex: 9999,
    position: "relative",
    overflow: "visible",
  },
  fieldItemFull: {
    minWidth: "100%",
  },
  fieldLabel: {
    fontSize: 12,
    color: FIELD_LABEL_COLOR,
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
    color: FIELD_LABEL_COLOR,
  },
  inputReadOnly: {
    backgroundColor: "#F8FAFC",
    color: "#475569",
  },
  engineerSelectWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  jobSuggestionBox: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "auto",
    maxHeight: 220,
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  jobSuggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  jobSuggestionTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  jobSuggestionSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  jobSuggestionHint: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#94A3B8",
  },
  jobSuggestionAnchor: {
    position: "relative",
    zIndex: 9999,
  },
  jobSearchModal: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  jobSearchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobSearchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  jobSearchClose: {
    fontSize: 13,
    color: "#64748B",
  },
  jobSearchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  jobSearchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: FIELD_LABEL_COLOR,
  },
  jobSearchButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#121D6D",
    alignItems: "center",
    justifyContent: "center",
  },
  jobSearchButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  jobSearchError: {
    marginTop: 8,
    color: "#EF4444",
    fontSize: 12,
  },
  jobSearchResultList: {
    marginTop: 12,
    maxHeight: 320,
  },
  jobSearchResultItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  jobSearchResultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  jobSearchResultSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
