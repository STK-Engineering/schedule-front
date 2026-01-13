import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from "react-native";
import { Calendar } from "react-native-big-calendar";
import api from "../api/api";
import departmentIcon from "../../assets/icon/department.png";

function leaveTypeToTimeRange(leaveType) {
  switch (leaveType) {
    case "오전반차":
      return { startH: 9, startM: 0, endH: 14, endM: 0 };
    case "오후반차":
      return { startH: 14, startM: 0, endH: 18, endM: 0 };
    case "연차":
    default:
      return { startH: 9, startM: 0, endH: 18, endM: 0 };
  }
}

function toDate(dateStr, h, m) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, 0);
}

function leaveToEvent(item) {
  const empName = item?.employee?.name ?? "이름없음";
  const deptName = item?.employee?.department?.name ?? "";
  const leaveType = item?.leaveType ?? "";

  const { startH, startM, endH, endM } = leaveTypeToTimeRange(leaveType);

  const start = toDate(item.startDate, startH, startM);
  const end = toDate(item.endDate, endH, endM);

  const title = `${empName}${deptName ? ` (${deptName})` : ""} - ${leaveType}`;

  return { title, start, end, isMine: item?.isMine ?? false, raw: item };
}

const LEAVE_TYPE_STYLES = {
  연차: { bg: "#2c7a57ff", border: "#26b472af" },
  오전반차: { bg: "#2d82d7ff", border: "#489aa4ff"},
  오후반차: { bg: "#515ed7ff", border: "#9294b6ff" },
  경조사: { bg: "#b93771ff", border: "#B98A9B" },
  기타: { bg: "#b68c29ff", border: "#C0A26E" },
  출산: { bg: "#de869cff", border: "#C58A97" },
};

const getLeaveTypeStyle = (leaveType) =>
  LEAVE_TYPE_STYLES[leaveType] ?? {
    bg: "#E5E7EB",
    border: "#9CA3AF"
  };

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const normalizeForMode = (date, mode) => {
  const d = new Date(date);
  if (mode === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
};

const moveByMode = (date, mode, step) => {
  if (mode === "day") return addDays(date, step);
  if (mode === "week") return addDays(date, 7 * step);
  return addMonths(date, step);
};

export default function Schedule() {
  const route = useRoute();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const [mode, setMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(() =>
    normalizeForMode(new Date(), "month")
  );

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [loading, setLoading] = useState(false);

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setSelectedEvent(null);
  };

  const DEFAULT_DEPARTMENTS = [
    "MANAGEMENT",
    "Sales&Marketing",
    "ENGINEERING",
    "Coordinator",
    "Logistic&Warehouse",
    "IT/ISO",
  ];

  const [onlyMine, setOnlyMine] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  const [dragStartX, setDragStartX] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState([]);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      let list = [];

      if (onlyMine) {
        res = await api.get("/leaves/me");

        if (Array.isArray(res.data)) {
          list = res.data;
        } else {
          list = [
            ...(res.data?.["요청 대기 건"] ?? []),
            ...(res.data?.["요청 처리 건"] ?? []),
          ];
        }

        list = list.map((x) => ({ ...x, isMine: true }));
      } else {
        res = await api.get("/leaves");
        list = res.data ?? [];
      }

      const approvedOnly = list.filter(
        (item) => item.approvalStatus === "승인"
      );

      const deptSet = new Set(DEFAULT_DEPARTMENTS);

      for (const item of approvedOnly) {
        const deptName = item?.employee?.department?.name;
        if (deptName) deptSet.add(deptName);
      }

      const deptList = Array.from(deptSet).sort();
      setDepartments(deptList);

      const filtered =
        selectedDept.length === 0
          ? approvedOnly
          : approvedOnly.filter((item) => {
              const deptName = item?.employee?.department?.name ?? "";
              return selectedDept.includes(deptName);
            });

      setApprovedLeaves(approvedOnly);
    } catch (e) {
      console.error("스케줄 불러오기 실패", e);
    } finally {
      setLoading(false);
    }
  }, [onlyMine]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    setCurrentDate((prev) => normalizeForMode(prev, mode));
  }, [mode]);

  useEffect(() => {
    setSelectedDept((prev) => prev.filter((d) => departments.includes(d)));
  }, [departments]);

  const events = useMemo(() => {
    const filtered =
      selectedDept.length === 0
        ? approvedLeaves
        : approvedLeaves.filter((item) => {
            const deptName = item?.employee?.department?.name ?? "";
            return selectedDept.includes(deptName);
          });

    return filtered.map(leaveToEvent);
  }, [approvedLeaves, selectedDept]);

  const toggleDept = (deptName) => {
    setSelectedDept((prev) =>
      prev.includes(deptName)
        ? prev.filter((d) => d !== deptName)
        : [...prev, deptName]
    );
  };

  useEffect(() => {
    const dateStr = route?.params?.date;
    const targetMode = route?.params?.mode;

    if (dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const nextDate = new Date(y, m - 1, d, 0, 0, 0);

      if (targetMode === "day") setMode("day");

      setCurrentDate(normalizeForMode(nextDate, targetMode ?? "day"));
    }
  }, [route?.params?.date, route?.params?.mode]);

  const getDeptLabel = () => {
    if (selectedDept.length === 0) return "전체";
    if (selectedDept.length === 1) return selectedDept[0];
    const [first, ...rest] = selectedDept;
    return `${first} 외 ${rest.length}`;
  };

  const onMouseDown = (e) => {
    if (Platform.OS !== "web") return;
    const x = e?.nativeEvent?.pageX;
    if (typeof x === "number") setDragStartX(x);
  };

  const onMouseUp = (e) => {
    if (Platform.OS !== "web") return;
    const endX = e?.nativeEvent?.pageX;
    if (dragStartX == null || typeof endX !== "number") return;

    const dx = endX - dragStartX;
    const threshold = 60;

    if (dx > threshold) {
      setCurrentDate((prev) =>
        normalizeForMode(moveByMode(prev, mode, -1), mode)
      );
    } else if (dx < -threshold) {
      setCurrentDate((prev) =>
        normalizeForMode(moveByMode(prev, mode, +1), mode)
      );
    }

    setDragStartX(null);
  };

  const onTouchStart = (e) => {
    const x = e?.nativeEvent?.pageX;
    if (typeof x === "number") setDragStartX(x);
  };

  const onTouchEnd = (e) => {
    const endX = e?.nativeEvent?.pageX;
    if (dragStartX == null || typeof endX !== "number") return;

    const dx = endX - dragStartX;
    const threshold = 60;

    if (dx > threshold) {
      setCurrentDate((prev) =>
        normalizeForMode(moveByMode(prev, mode, -1), mode)
      );
    } else if (dx < -threshold) {
      setCurrentDate((prev) =>
        normalizeForMode(moveByMode(prev, mode, +1), mode)
      );
    }

    setDragStartX(null);
  };

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: 20,
          position: "relative",
          zIndex: 10,
          elevation: 10,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            marginVertical: 10,
            position: "relative",
            zIndex: 20,
            elevation: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => setDeptOpen(!deptOpen)}
            style={{
              width: 200,
              height: 40,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "white",
              zIndex: 30,
              elevation: 30,
            }}
          >
            <Text numberOfLines={1}>부서: {getDeptLabel()}</Text>
            <Text>{deptOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {deptOpen && (
            <View
              style={{
                position: "absolute",
                top: 40,
                left: 20,
                width: 200,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "white",
                zIndex: 9999,
                elevation: 9999,
              }}
            >
              {departments.length === 0 ? (
                <View style={{ padding: 10 }}>
                  <Text style={{ color: "#6B7280" }}>
                    표시할 부서가 없습니다
                  </Text>
                </View>
              ) : (
                departments.map((dept) => {
                  const isSelected = selectedDept.includes(dept);
                  return (
                    <TouchableOpacity
                      key={dept}
                      onPress={() => toggleDept(dept)}
                      style={{
                        padding: 10,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={departmentIcon}
                        style={{ width: 18, height: 18, marginRight: 8 }}
                        resizeMode="contain"
                      />
                      <Text
                        style={{ color: isSelected ? "#2563EB" : "#6B7280" }}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setOnlyMine((v) => !v)}
          style={{
            height: 40,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: "white",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          disabled={loading}
        >
          <Text>{onlyMine ? "전체 일정 보기" : "내 일정만 보기"}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", margin: 10, gap: 5 }}>
          {["day", "week", "month"].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{
                backgroundColor: "white",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 10,
              }}
            >
              <Text>
                {m === "day" ? "일간" : m === "week" ? "주간" : "월간"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View
        style={{ flex: 1, zIndex: 0 }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Calendar
          events={events}
          height={600}
          mode={mode}
          date={currentDate}
          swipeEnabled={false}
          eventCellStyle={(e) => {
            const leaveType = e?.raw?.leaveType ?? "";
            const style = getLeaveTypeStyle(leaveType);
            return {
              backgroundColor: style.bg,
              borderLeftWidth: 4,
              borderLeftColor: style.border,
              borderRadius: 6,
            };
          }}
          onPressEvent={openEventModal}
        />
      </View>
      <Modal
        visible={eventModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeEventModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeEventModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOpacity: 0.12,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            {(() => {
              const leaveType = selectedEvent?.raw?.leaveType ?? "-";
              const style = getLeaveTypeStyle(leaveType);
              return (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: style.border,
                        }}
                      />
                      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                        일정 상세
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: style.bg,
                        borderWidth: 1,
                        borderColor: style.border,
                      }}
                    >
                      <Text style={{ color: style.text, fontWeight: "500", color: "#cdcdcdff" }}>
                        {leaveType}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: "#F8FAFC",
                      borderRadius: 12,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>제목: </Text>
                      {selectedEvent?.title ?? "-"}
                    </Text>

                    <Text>
                      <Text style={{ fontWeight: "bold" }}>시작: </Text>
                      {selectedEvent?.start
                        ? new Date(selectedEvent.start).toLocaleString()
                        : "-"}
                    </Text>

                    <Text>
                      <Text style={{ fontWeight: "bold" }}>종료: </Text>
                      {selectedEvent?.end
                        ? new Date(selectedEvent.end).toLocaleString()
                        : "-"}
                    </Text>

                    <Text>
                      <Text style={{ fontWeight: "bold" }}>사유: </Text>
                      {selectedEvent?.raw?.reason ?? "-"}
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>기타: </Text>
                      {selectedEvent?.raw?.etc ?? "-"}
                    </Text>
                  </View>
                </>
              );
            })()}

            <TouchableOpacity
              onPress={closeEventModal}
              style={{
                alignSelf: "flex-end",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: "#305685",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
