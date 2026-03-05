import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageLayout from "../../components/PageLayout";
import api from "../../api/api";

export default function SchedulingContent({ route }) {
  const navigation = useNavigation();
  const params = route?.params ?? {};
  const source = params?.source ?? null;
  const [authorities, setAuthorities] = useState([]);
  const [currentUserName, setCurrentUserName] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchMe = async () => {
      try {
        const res = await api.get("/employees/me");
        const data = res?.data ?? {};
        if (!mounted) return;

        setCurrentUserName(
          String(data?.name ?? data?.employee?.name ?? "").trim(),
        );

        const rawAuthorities = data?.roles ?? data?.role ?? [];
        const normalized = Array.isArray(rawAuthorities)
          ? rawAuthorities
              .flatMap((item) => {
                if (!item) return [];
                if (typeof item === "string") return [item];
                return [item.authorityName, item.name, item.authority].filter(
                  Boolean,
                );
              })
              .map((v) => String(v).toLowerCase())
          : [rawAuthorities].flatMap((v) => {
              if (!v) return [];
              return String(v)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.toLowerCase());
            });

        setAuthorities(normalized);
      } catch (e) {
        if (!mounted) return;
        setCurrentUserName("");
        setAuthorities([]);
      }
    };

    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizeAuthority = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/^role_/, "");

  const hasAuthority = (target) =>
    authorities.some(
      (auth) => normalizeAuthority(auth) === normalizeAuthority(target),
    );

  const isScheduleAdmin =
    hasAuthority("schedule_admin") || hasAuthority("schdule_admin");
  const isScheduleGeneral =
    hasAuthority("schedule_general") || hasAuthority("schdule_general");

  const scheduleOwnerName =
    source?.employee?.name ??
    source?.writer?.name ??
    source?.createdBy?.name ??
    source?.createdByName ??
    "";

  const isOwner = useMemo(() => {
    if (!currentUserName || !scheduleOwnerName) return false;
    return (
      String(scheduleOwnerName).trim().toLowerCase() ===
      String(currentUserName).trim().toLowerCase()
    );
  }, [currentUserName, scheduleOwnerName]);

  const canEdit =
    Boolean(source?.id) && (isScheduleAdmin || (isScheduleGeneral && isOwner));

  const {
    jobNumber = "",
    vesselName = "",
    hullNo = "",
    region = "",
    dateRange = "",
    workType = "",
    systemType = "",
    engineers = "",
    note = "",
    jobDescription = "",
    customer = "",
  } = params;
  const customerValue = customer || source?.customer || "-";

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: "일정 관리", route: "SchedulingList" },
        { label: "일정 상세" },
      ]}
      title="일정 상세"
      contentStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
    >
      <View style={styles.pageWrap}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sectionTitle}>일정 등록 정보</Text>
              <Text style={styles.sectionSub}>선택한 일정의 상세 정보입니다.</Text>
            </View>
            {canEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate("SchedulingForm", {
                    mode: "edit",
                    source,
                  })
                }
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.table}>
            <InfoRow label="작업번호" value={jobNumber || "-"} />
            <InfoRow label="고객사" value={customerValue} />
            <InfoRow label="선박명" value={vesselName || "-"} />
            <InfoRow label="호선" value={hullNo || "-"} />
            <InfoRow label="지역" value={region || "-"} />
            <InfoRow label="기간" value={dateRange || "-"} />
            <InfoRow label="작업" value={workType || "-"} />
            <InfoRow label="종류" value={systemType || "-"} />
            <InfoRow label="엔지니어" value={engineers || "-"} multiline />
            <InfoRow label="비고" value={note || "-"} multiline />
            <InfoRow
              label="작업내용"
              value={jobDescription || "-"}
              multiline
              isLast
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
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
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginVertical: 16,
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
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  editButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: "center",
  },
  backButtonText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});
