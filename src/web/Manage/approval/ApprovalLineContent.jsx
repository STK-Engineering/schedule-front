import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageLayout from "../../../components/PageLayout";
import api from "../../../api/api";

const APPROVAL_STEP_ROLES = ["파트장", "부서장", "팀장", "대표"];
const DEPARTMENT_OPTIONS = [
  { value: 1, label: "Sales&Marketing" },
  { value: 2, label: "MANAGEMENT" },
  { value: 3, label: "ENGINEERING" },
  { value: 4, label: "Logistic&Warehouse" },
  { value: 5, label: "IT/ISO" },
  { value: 6, label: "Coordinator" },
];
const ENGINEERING_PART_OPTIONS = [
  { value: 1, label: "AMS" },
  { value: 2, label: "BWMS" },
  { value: 3, label: "SWBD-1" },
  { value: 4, label: "SWBD-2" },
  { value: 5, label: "설계" },
];

const normalizeStepRole = (step) => {
  if (!step) return "부서장";
  return (
    step.approvalStepRole ??
    step.approvalStepRoleDisplay ??
    step.stepRole ??
    step.role ??
    step.position ??
    "부서장"
  );
};

const normalizeStepManagerId = (step) => {
  if (!step) return "";
  return (
    step.managerId ??
    step.manager?.id ??
    step.employeeId ??
    step.employee?.id ??
    ""
  );
};

export default function ApprovalLineContent({ route }) {
  const navigation = useNavigation();
  const params = route?.params ?? {};

  const {
    id,
    lineName = "-",
    department = "-",
    engineeringPart = "-",
    steps = [],
    employeeNames = [],
    departmentId = "",
    engineeringPartId = "",
  } = params;

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departmentIdState, setDepartmentIdState] = useState(
    departmentId ? String(departmentId) : ""
  );
  const [engineeringPartIdState, setEngineeringPartIdState] = useState(
    engineeringPartId ? String(engineeringPartId) : ""
  );
  const [deptOpen, setDeptOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const deptTriggerRef = useRef(null);
  const partTriggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [partDropdownPos, setPartDropdownPos] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [managerOpenIndex, setManagerOpenIndex] = useState(null);
  const [managerDropdownPos, setManagerDropdownPos] = useState(null);
  const managerTriggerRefs = useRef({});
  const [stepsState, setStepsState] = useState(
    steps?.length
      ? steps.map((step) => ({
          managerId: normalizeStepManagerId(step)
            ? String(normalizeStepManagerId(step))
            : "",
          managerName: step.managerName ?? step.manager?.name ?? "",
          managerDepartment:
            step.managerDepartment ??
            step.manager?.department?.name ??
            step.department ??
            "",
          managerPosition: step.position ?? step.manager?.position ?? step.level ?? "",
          approvalStepRole: normalizeStepRole(step),
        }))
      : [{ managerId: "", managerName: "", approvalStepRole: "부서장" }]
  );

  const normalizeRoles = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (typeof v === "string") return v;
          if (v && typeof v === "object") return v.authorityName ?? v.name ?? v.role;
          return "";
        })
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }
    if (value && typeof value === "object") {
      return [value.authorityName ?? value.name ?? value.role]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }
    return String(value)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setEmployeeLoading(true);
      const res = await api.get("/employees");
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map((e) => {
        const roles = normalizeRoles(e.roles ?? e.role ?? e.authorityName ?? "");
        return {
          id: e.id,
          name: e.name ?? "",
          department: e.department?.name ?? e.department ?? "",
          position: e.level ?? e.position ?? "",
          roles,
        };
      });
      setEmployees(mapped);
    } catch (e) {
      console.log("employee list error:", e?.response?.status, e?.response?.data);
      setEmployees([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!employees.length) return;
    setStepsState((prev) =>
      prev.map((step) => {
        if (step.managerId || !step.managerName) return step;
        const match = employees.find(
          (e) =>
            e.name === step.managerName &&
            (!step.managerDepartment || e.department === step.managerDepartment)
        );
        if (!match) return step;
        return { ...step, managerId: String(match.id) };
      })
    );
  }, [employees]);

  const selectedDept = DEPARTMENT_OPTIONS.find(
    (opt) => String(opt.value) === String(departmentIdState)
  );
  const selectedPart = ENGINEERING_PART_OPTIONS.find(
    (opt) => String(opt.value) === String(engineeringPartIdState)
  );
  const isEngineering = String(departmentIdState) === "3";

  const managerOptions = useMemo(() => {
    return employees
      .filter((e) => e.roles.includes("MANAGER"))
      .map((e) => ({
        value: e.id,
        label: `${e.name}${e.position ? ` - ${e.position}` : ""}`,
      }));
  }, [employees]);

  const closeAllDropdowns = () => {
    setDeptOpen(false);
    setPartOpen(false);
    setManagerOpenIndex(null);
    setDropdownPos(null);
    setPartDropdownPos(null);
    setManagerDropdownPos(null);
  };

  const addStep = () => {
    setStepsState((prev) => [...prev, { managerId: "", approvalStepRole: "부서장" }]);
  };

  const removeStep = (idx) => {
    setStepsState((prev) => prev.filter((_, index) => index !== idx));
  };

  const updateStepRole = (idx, role) => {
    setStepsState((prev) =>
      prev.map((step, index) =>
        index === idx ? { ...step, approvalStepRole: role } : step
      )
    );
  };

  const onSave = async () => {
    if (!stepsState.length) {
      setError("최소 1개 이상의 결재 단계를 추가해주세요.");
      return;
    }

    const resolvedStepsState = stepsState.map((step) => {
      if (step.managerId || !step.managerName) return step;
      const match = employees.find((e) => e.name === step.managerName);
      if (!match) return step;
      return { ...step, managerId: String(match.id) };
    });

    setStepsState(resolvedStepsState);

    const parsedSteps = resolvedStepsState.map((step, index) => ({
      stepOrder: index + 1,
      managerId: Number(step.managerId),
      approvalStepRole: step.approvalStepRole,
    }));

    const hasInvalidManager = parsedSteps.some(
      (step) => !Number.isFinite(step.managerId) || step.managerId <= 0
    );
    if (hasInvalidManager) {
      setError("각 단계의 결재자를 선택해주세요.");
      return;
    }

    const payload = {
      departmentId: Number(departmentIdState),
      engineeringPartId: isEngineering ? Number(engineeringPartIdState) : null,
      steps: parsedSteps,
    };

    try {
      setSaving(true);
      setError("");
      await api.put(`/approval-lines/${id}/steps`, payload);
      Alert.alert("완료", "결재 라인이 수정되었습니다.");
      setEditOpen(false);
      navigation.navigate("ApprovalLine");
    } catch (e) {
      console.log("approval-line edit error:", e?.response?.data ?? e);
      setError("결재 라인 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: "결재 라인 관리", route: "ApprovalLine" },
        { label: "결재 라인 상세" },
      ]}
      title="결재 라인 상세"
      contentStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
    >
      <View style={styles.pageWrap}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sectionTitle}>결재 라인 정보</Text>
              <Text style={styles.sectionSub}>등록된 정보를 확인하세요.</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setDepartmentIdState(departmentId ? String(departmentId) : "");
                setEngineeringPartIdState(
                  engineeringPartId ? String(engineeringPartId) : ""
                );
                setStepsState(
                  steps?.length
                    ? steps.map((step) => ({
                        managerId: normalizeStepManagerId(step)
                          ? String(normalizeStepManagerId(step))
                          : "",
                        managerName: step.managerName ?? step.manager?.name ?? "",
                        managerDepartment:
                          step.managerDepartment ??
                          step.manager?.department?.name ??
                          step.department ??
                          "",
                        managerPosition:
                          step.position ?? step.manager?.position ?? step.level ?? "",
                        approvalStepRole: normalizeStepRole(step),
                      }))
                    : [{ managerId: "", managerName: "", approvalStepRole: "부서장" }]
                );
                closeAllDropdowns();
                setError("");
                setEditOpen(true);
              }}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.table}>
            <InfoRow label="부서" value={department || "-"} />
            <InfoRow label="ENGINEERING 구분" value={engineeringPart || "-"} />
            <InfoRow label="결재 단계" value={`${steps.length}단계`} />
            <InfoRow
              label="대상 인원"
              value={`${employeeNames.length}명`}
              isLast
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>결재 단계</Text>
          <Text style={styles.sectionSub}>결재 단계별 담당자를 확인하세요.</Text>
          <View style={styles.sectionDivider} />

          {steps?.length ? (
            steps.map((step, index) => (
              <View key={`${id}-step-${index}`} style={styles.listItem}>
                <Text style={styles.listText}>
                  {step.stepOrder ?? index + 1}단계 · {step.managerName ?? "-"} (
                  {step.position ?? "-"})
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>등록된 단계가 없습니다.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>대상 인원</Text>
          <Text style={styles.sectionSub}>결재 라인 대상 인원을 확인하세요.</Text>
          <View style={styles.sectionDivider} />

          {employeeNames?.length ? (
            employeeNames.map((name) => (
              <View key={`${id}-${name}`} style={styles.listItem}>
                <Text style={styles.listText}>{name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>대상 인원이 없습니다.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (deptOpen || partOpen || managerOpenIndex != null) {
              closeAllDropdowns();
            } else {
              setEditOpen(false);
            }
          }}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            onStartShouldSetResponderCapture={() => {
              if (deptOpen || partOpen || managerOpenIndex != null) {
                closeAllDropdowns();
                return true;
              }
              return false;
            }}
            style={styles.createModalCard}
          >
            <Text style={styles.modalTitle}>결재 라인 수정</Text>

            <View style={styles.createBody}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>부서</Text>
                <View style={styles.selectWrap}>
                  <TouchableOpacity
                    ref={deptTriggerRef}
                    style={styles.input}
                    onPress={() => {
                      closeAllDropdowns();
                      setDeptOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          requestAnimationFrame(() => {
                            deptTriggerRef.current?.measureInWindow(
                              (x, y, width, height) => {
                                setDropdownPos({ x, y, width, height });
                              }
                            );
                          });
                        } else {
                          setDropdownPos(null);
                        }
                        return next;
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: selectedDept ? "#000" : "#999" }}>
                      {selectedDept ? selectedDept.label : "부서를 선택해주세요"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isEngineering && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>ENGINEERING 파트</Text>
                  <View style={styles.selectWrap}>
                    <TouchableOpacity
                      ref={partTriggerRef}
                      style={styles.input}
                      onPress={() => {
                        closeAllDropdowns();
                        setPartOpen((prev) => {
                          const next = !prev;
                          if (next) {
                            requestAnimationFrame(() => {
                              partTriggerRef.current?.measureInWindow(
                                (x, y, width, height) => {
                                  setPartDropdownPos({ x, y, width, height });
                                }
                              );
                            });
                          } else {
                            setPartDropdownPos(null);
                          }
                          return next;
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: selectedPart ? "#000" : "#999" }}>
                        {selectedPart ? selectedPart.label : "파트를 선택해주세요"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.stepHeader}>
                <Text style={styles.detailSectionTitle}>결재 단계</Text>
                <TouchableOpacity style={styles.stepAddButton} onPress={addStep}>
                  <Text style={styles.stepAddButtonText}>단계 추가</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.createScroll} showsVerticalScrollIndicator={false}>
              {stepsState.map((step, index) => (
                <View key={`edit-step-${index}`} style={styles.stepCard}>
                  <View style={styles.stepCardHeader}>
                    <Text style={styles.stepTitle}>{index + 1}단계</Text>
                    {stepsState.length > 1 ? (
                      <TouchableOpacity onPress={() => removeStep(index)}>
                        <Text style={styles.stepDeleteText}>삭제</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={styles.fieldLabel}>결재자</Text>
                  <View style={styles.selectWrap}>
                    <TouchableOpacity
                      ref={(el) => {
                        managerTriggerRefs.current[index] = el;
                      }}
                      style={styles.input}
                      onPress={() => {
                        closeAllDropdowns();
                        setManagerOpenIndex((prev) => {
                          const next = prev === index ? null : index;
                          if (next != null) {
                            requestAnimationFrame(() => {
                              managerTriggerRefs.current[index]?.measureInWindow(
                                (x, y, width, height) => {
                                  setManagerDropdownPos({
                                    x,
                                    y,
                                    width,
                                    height,
                                  });
                                }
                              );
                            });
                          } else {
                            setManagerDropdownPos(null);
                          }
                          return next;
                        });
                      }}
                      activeOpacity={0.7}
                    >
                    <Text style={{ color: step.managerId || step.managerName ? "#000" : "#999" }}>
                      {step.managerId
                        ? managerOptions.find(
                            (opt) => String(opt.value) === String(step.managerId)
                          )?.label ?? step.managerName ?? step.managerId
                        : step.managerName
                          ? `${step.managerName}${
                              step.managerDepartment ? ` (${step.managerDepartment})` : ""
                            }${step.managerPosition ? ` - ${step.managerPosition}` : ""}`
                          : employeeLoading
                            ? "불러오는 중..."
                            : "결재자를 선택해주세요"}
                    </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                    결재 역할
                  </Text>
                  <View style={styles.roleRow}>
                    {APPROVAL_STEP_ROLES.map((role) => {
                      const selected = step.approvalStepRole === role;
                      return (
                        <TouchableOpacity
                          key={`${index}-${role}`}
                          onPress={() => updateStepRole(index, role)}
                          style={[
                            styles.roleChip,
                            selected && styles.roleChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              selected && styles.roleChipTextSelected,
                            ]}
                          >
                            {role}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.createActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditOpen(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={onSave}
                disabled={saving}
              >
                <Text style={styles.submitButtonText}>
                  {saving ? "저장 중..." : "수정"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {deptOpen && dropdownPos ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.dropdownPortal,
                {
                  top: dropdownPos.y + dropdownPos.height + 6,
                  left: dropdownPos.x,
                  width: dropdownPos.width,
                },
              ]}
            >
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScroll}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={styles.dropdownItem2}
                      onPress={() => {
                        setDepartmentIdState(String(opt.value));
                        setDeptOpen(false);
                      }}
                    >
                      <Text>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {partOpen && partDropdownPos ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.dropdownPortal,
                {
                  top: partDropdownPos.y + partDropdownPos.height + 6,
                  left: partDropdownPos.x,
                  width: partDropdownPos.width,
                },
              ]}
            >
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScroll}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {ENGINEERING_PART_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={styles.dropdownItem2}
                      onPress={() => {
                        setEngineeringPartIdState(String(opt.value));
                        setPartOpen(false);
                      }}
                    >
                      <Text>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {managerOpenIndex != null && managerDropdownPos ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.dropdownPortal,
                {
                  top: managerDropdownPos.y + managerDropdownPos.height + 6,
                  left: managerDropdownPos.x,
                  width: managerDropdownPos.width,
                },
              ]}
            >
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScroll}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {managerOptions.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        표시할 결재자가 없습니다.
                      </Text>
                    </View>
                  ) : (
                    managerOptions.map((opt) => (
                      <TouchableOpacity
                        key={String(opt.value)}
                        style={styles.dropdownItem2}
                        onPress={() => {
                          setStepsState((prev) =>
                            prev.map((step, i) =>
                              i === managerOpenIndex
                                ? { ...step, managerId: String(opt.value) }
                                : step
                            )
                          );
                          setManagerOpenIndex(null);
                          setManagerDropdownPos(null);
                        }}
                      >
                        <Text>{opt.label}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      </Modal>
    </PageLayout>
  );
}

function InfoRow({ label, value, isLast = false }) {
  return (
    <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
      <View style={styles.tableLabelCell}>
        <Text style={styles.tableLabel}>{label}</Text>
      </View>
      <View style={styles.tableValueCell}>
        <Text style={styles.tableValue} numberOfLines={1}>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  sectionSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#121D6D",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  editButtonText: { color: "#121D6D", fontSize: 12, fontWeight: "700" },
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
  tableRowLast: { borderBottomWidth: 0 },
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
  tableValue: { fontSize: 14, color: "#0F172A" },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
  },
  listText: { fontSize: 13, color: "#0F172A" },
  emptyText: { fontSize: 12, color: "#94A3B8" },
  backButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backButtonText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    overflow: "visible",
  },
  createModalCard: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    maxHeight: "88%",
    overflow: "visible",
    zIndex: 100,
    elevation: 100,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  createBody: { marginTop: 12, overflow: "visible", zIndex: 2 },
  createScroll: { maxHeight: 360, zIndex: 1 },
  fieldBlock: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  selectWrap: { position: "relative", marginBottom: 10 },
  dropdownPortal: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  stepHeader: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepAddButton: {
    borderWidth: 1,
    borderColor: "#121D6D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepAddButtonText: { color: "#121D6D", fontSize: 12, fontWeight: "600" },
  stepCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  stepCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepTitle: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  stepDeleteText: { fontSize: 12, color: "#DC2626", fontWeight: "600" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleChip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  roleChipSelected: {
    borderColor: "#121D6D",
    backgroundColor: "#121D6D",
  },
  roleChipText: { fontSize: 12, color: "#334155" },
  roleChipTextSelected: { color: "#FFFFFF" },
  detailSectionTitle: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  dropdownMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownScrollContent: {
    paddingVertical: 2,
  },
  dropdownItem2: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  dropdownEmpty: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownEmptyText: { fontSize: 12, color: "#94A3B8" },
  createActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  submitButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#121D6D",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 6 },
});
