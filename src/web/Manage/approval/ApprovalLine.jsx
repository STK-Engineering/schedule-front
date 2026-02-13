import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import api from "../../../api/api";
import showIcon from "../../../../assets/icon/show.png";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";

const columns = [
  { key: "department", title: "부서", width: 200 },
  { key: "engineeringPart", title: "ENGINEERING 구분", width: 200 },
  { key: "steps", title: "결재 단계", width: 200 },
  { key: "employees", title: "대상 인원", width: 700 },
  { key: "action", title: "", width: 100 },
];
const TABLE_WIDTH = columns.reduce((sum, col) => sum + col.width, 0);

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

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return [data];
};

const toLabel = (value) => {
  if (!value) return "-";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.name ??
      value.part ??
      value.label ??
      value.title ??
      value.departmentName ??
      value.engineeringPartName ??
      "-"
    );
  }
  return "-";
};

export default function ApprovalLine() {
  const navigation = useNavigation();
  const route = useRoute();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [engineeringPartId, setEngineeringPartId] = useState("");
  const [partOpen, setPartOpen] = useState(false);
  const [steps, setSteps] = useState([{ managerId: "", approvalStepRole: "부서장" }]);
  const deptTriggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const partTriggerRef = useRef(null);
  const [partDropdownPos, setPartDropdownPos] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [managerOpenIndex, setManagerOpenIndex] = useState(null);
  const [managerDropdownPos, setManagerDropdownPos] = useState(null);
  const managerTriggerRefs = useRef({});

  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/approval-lines");
      const list = normalizeList(res.data);

      const mapped = list.map((item, index) => {
        const line = item?.approvalLineResponse ?? item ?? {};
        const department = toLabel(line?.department);
        const engineeringPart = toLabel(line?.engineeringPart);
        const departmentId = line?.department?.id ?? line?.departmentId ?? "";
        const engineeringPartId =
          line?.engineeringPart?.id ?? line?.engineeringPartId ?? "";
        const lineSteps = Array.isArray(item?.steps)
          ? item.steps.map((step) => ({
              ...step,
              managerId: normalizeStepManagerId(step),
              approvalStepRole: normalizeStepRole(step),
            }))
          : [];
        const employeeNames = Array.isArray(item?.employeeNames)
          ? item.employeeNames
          : [];
        return {
          id: line?.id ?? index,
          lineName: line?.lineName ?? "-",
          department,
          engineeringPart: engineeringPart || "-",
          departmentId,
          engineeringPartId,
          steps: lineSteps,
          employeeNames,
        };
      });

      setRows(mapped);
    } catch (e) {
      console.log("approval-line fetch error:", e?.response?.data ?? e);
      setError("결재 라인 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLines();
    }, [fetchLines])
  );

  const rowCount = useMemo(() => rows.length, [rows]);

  const openDetail = (item) => {
    navigation.navigate("ApprovalLineContent", item);
  };

  const resetCreateForm = () => {
    setDepartmentId("");
    setDeptOpen(false);
    setEngineeringPartId("");
    setPartOpen(false);
    setSteps([{ managerId: "", approvalStepRole: "부서장" }]);
    setCreateError("");
    setDropdownPos(null);
    setPartDropdownPos(null);
    setManagerOpenIndex(null);
    setManagerDropdownPos(null);
    setFormMode("create");
    setEditingId(null);
  };

  const openEditModal = (item) => {
    if (!item) return;
    setFormMode("edit");
    setEditingId(item.id ?? null);
    setDepartmentId(item.departmentId ? String(item.departmentId) : "");
    setEngineeringPartId(item.engineeringPartId ? String(item.engineeringPartId) : "");
    setSteps(
      item.steps?.length
        ? item.steps.map((step) => ({
            managerId: step.managerId ? String(step.managerId) : "",
            approvalStepRole: step.approvalStepRole || "부서장",
          }))
        : [{ managerId: "", approvalStepRole: "부서장" }]
    );
    setCreateError("");
    setCreateOpen(true);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const closeAllDropdowns = () => {
    setDeptOpen(false);
    setPartOpen(false);
    setManagerOpenIndex(null);
    setDropdownPos(null);
    setPartDropdownPos(null);
    setManagerDropdownPos(null);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { managerId: "", approvalStepRole: "부서장" }]);
  };

  const removeStep = (idx) => {
    setSteps((prev) => prev.filter((_, index) => index !== idx));
  };

  const updateStepManagerId = (idx, value) => {
    setSteps((prev) =>
      prev.map((step, index) =>
        index === idx ? { ...step, managerId: value.replace(/\D/g, "") } : step
      )
    );
  };

  const updateStepRole = (idx, role) => {
    setSteps((prev) =>
      prev.map((step, index) =>
        index === idx ? { ...step, approvalStepRole: role } : step
      )
    );
  };

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
    fetchLines();
  }, [fetchLines]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const editItem = route?.params?.editItem;
    const openEdit = route?.params?.openEdit;
    if (openEdit && editItem) {
      openEditModal(editItem);
      navigation.setParams({ openEdit: false, editItem: null });
    }
  }, [route?.params, navigation]);

  const createApprovalLine = async () => {
    const isEngineering = String(departmentId) === "3";
    if (!departmentId || (isEngineering && !engineeringPartId)) {
      setCreateError(
        isEngineering
          ? "부서를 선택하고 ENGINEERING 파트를 선택해주세요."
          : "부서를 선택해주세요."
      );
      return;
    }
    if (!steps.length) {
      setCreateError("최소 1개 이상의 결재 단계를 추가해주세요.");
      return;
    }

    const parsedSteps = steps.map((step, index) => ({
      stepOrder: index + 1,
      managerId: Number(step.managerId),
      approvalStepRole: step.approvalStepRole,
    }));

    const hasInvalidManager = parsedSteps.some(
      (step) => !Number.isFinite(step.managerId) || step.managerId <= 0
    );
    if (hasInvalidManager) {
      setCreateError("각 단계의 결재자 ID를 올바르게 입력해주세요.");
      return;
    }

  const payload = {
      departmentId: Number(departmentId),
      engineeringPartId: isEngineering ? Number(engineeringPartId) : null,
      steps: parsedSteps,
    };

    try {
      setCreating(true);
      setCreateError("");
      if (formMode === "edit" && editingId) {
        await api.put(`/approval-lines/${editingId}/steps`, payload);
      } else {
        await api.post("/approval-lines", payload);
      }
      await fetchLines();
      setCreateOpen(false);
      Alert.alert(
        "완료",
        formMode === "edit" ? "결재 라인이 수정되었습니다." : "결재 라인이 추가되었습니다."
      );
    } catch (e) {
      console.log("approval-line create error:", e?.response?.data ?? e);
      setCreateError(
        formMode === "edit"
          ? "결재 라인 수정에 실패했습니다."
          : "결재 라인 추가에 실패했습니다."
      );
    } finally {
      setCreating(false);
    }
  };

  const selectedDept = DEPARTMENT_OPTIONS.find(
    (opt) => String(opt.value) === String(departmentId)
  );
  const selectedPart = ENGINEERING_PART_OPTIONS.find(
    (opt) => String(opt.value) === String(engineeringPartId)
  );
  const isEngineering = String(departmentId) === "3";

  const managerOptions = useMemo(() => {
    return employees
      .filter((e) => e.roles.includes("MANAGER"))
      .map((e) => ({
        value: e.id,
        label: `${e.name}${e.position ? ` - ${e.position}` : ""}`,
      }));
  }, [employees]);

  return (
    <View style={styles.page}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>결재 라인 관리</Text>
        <Text style={styles.pageSub}>
          부서별 결재 라인을 확인하고 관리할 수 있습니다.
        </Text>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>결재 라인 목록</Text>
          <View style={styles.headerActions}>
            <Text style={styles.countText}>총 {rowCount}개</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
              <Text style={styles.addBtnText}>결재라인 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#121D6D" />
            <Text style={styles.helperText}>불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={[styles.tableInner, { width: TABLE_WIDTH }]}>
              <View style={styles.headerRow}>
                {columns.map((col) => (
                  <View
                    key={col.key}
                    style={[
                      styles.cell,
                      styles.headerCell,
                      { width: col.width },
                    ]}
                  >
                    <Text style={styles.headerText}>{col.title}</Text>
                  </View>
                ))}
              </View>
              <ScrollView style={styles.tableBody} nestedScrollEnabled>
                {rows.map((row) => (
                  <View key={String(row.id)} style={styles.row}>
                    <View style={[styles.cell, { width: columns[0].width }]}>
                      <Text style={styles.cellText}>{row.department}</Text>
                    </View>
                    <View style={[styles.cell, { width: columns[1].width }]}>
                      <Text style={styles.cellText}>
                        {row.engineeringPart}
                      </Text>
                    </View>
                    <View style={[styles.cell, { width: columns[2].width }]}>
                      <Text style={styles.cellText}>
                        {row.steps.length}단계
                      </Text>
                    </View>
                    <View style={[styles.cell, { width: columns[3].width }]}>
                      <Text style={styles.cellText}>
                        {row.employeeNames.length}명
                      </Text>
                    </View>
                    <View style={[styles.cell, { width: columns[4].width }]}>
                      <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => openDetail(row)}
                      >
                        <Text style={styles.detailButtonText}>보기</Text>
                        <Image source={showIcon} style={styles.detailButtonIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (deptOpen || partOpen || managerOpenIndex != null) {
              closeAllDropdowns();
            } else {
              closeCreateModal();
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
            <Text style={styles.modalTitle}>
              {formMode === "edit" ? "결재 라인 수정" : "결재 라인 추가"}
            </Text>

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
                          setPartOpen(false);
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
              {steps.map((step, index) => (
                <View key={`new-step-${index}`} style={styles.stepCard}>
                  <View style={styles.stepCardHeader}>
                    <Text style={styles.stepTitle}>{index + 1}단계</Text>
                    {steps.length > 1 ? (
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
                      <Text style={{ color: step.managerId ? "#000" : "#999" }}>
                        {step.managerId
                          ? managerOptions.find(
                              (opt) =>
                                String(opt.value) === String(step.managerId)
                            )?.label ?? step.managerId
                          : employeeLoading
                            ? "불러오는 중..."
                            : "결재자를 선택해주세요"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>결재 역할</Text>
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

              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
            </ScrollView>

            <View style={styles.createActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeCreateModal}
                disabled={creating}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={createApprovalLine}
                disabled={creating}
              >
                <Text style={styles.submitButtonText}>
                  {creating
                    ? "저장 중..."
                    : formMode === "edit"
                      ? "수정"
                      : "저장"}
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
                        setDepartmentId(String(opt.value));
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
                        setEngineeringPartId(String(opt.value));
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
                          setSteps((prev) =>
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  pageSub: { fontSize: 12, color: "#64748B", marginTop: 6 },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    minHeight: 240,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countText: { fontSize: 12, color: "#64748B" },
  addBtn: {
    backgroundColor: "#121D6D",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  centered: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  helperText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#EF4444" },
  tableScrollContent: { flexGrow: 1 },
  tableInner: { minWidth: "100%" },
  tableBody: { maxHeight: 540 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#EEE" },
  cell: { padding: 12, justifyContent: "center" },
  headerCell: { backgroundColor: "#F4F6F8" },
  headerText: { fontWeight: "600", color: "#0F172A" },
  cellText: { color: "#333" },
  detailButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "space-between",
  },
  detailButtonText: { fontSize: 12, color: "#0F172A" },
  detailButtonIcon: { width: 14, height: 14, resizeMode: "contain" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    overflow: "visible",
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
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
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
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
  detailRow: { marginTop: 12 },
  detailLabel: { fontSize: 12, color: "#64748B" },
  detailValue: { fontSize: 14, color: "#0F172A", marginTop: 4 },
  detailSection: { marginTop: 16 },
  detailSectionTitle: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  detailItem: { marginTop: 8 },
  detailItemText: { fontSize: 13, color: "#334155" },
  detailEmpty: { fontSize: 12, color: "#94A3B8", marginTop: 6 },
  closeButton: {
    marginTop: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#121D6D",
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "600" },
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
});
