import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import Checkbox from "expo-checkbox";
import { Calendar, DefaultCalendarEventRenderer } from "react-native-big-calendar";
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

function toDateOnly(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d, 0, 0, 0);
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function leaveToEvents(item, holidayDateSet) {
  const empName = item?.employee?.name ?? "이름없음";
  const deptName = item?.employee?.department?.name ?? "";
  const leaveType = item?.leaveType ?? "";

  const { startH, startM, endH, endM } = leaveTypeToTimeRange(leaveType);

  const title = `${empName}${deptName ? ` (${deptName})` : ""} - ${leaveType}`;
  const startDate = item?.startDate;
  const endDate = item?.endDate || startDate;
  if (!startDate || !endDate) return [];

  const isAnnualLeave = leaveType === "연차";

  if (!isAnnualLeave) {
    const start = toDate(startDate, startH, startM);
    const end = toDate(endDate, endH, endM);
    return [{ title, start, end, isMine: item?.isMine ?? false, raw: item }];
  }

  const events = [];
  let cursor = toDateOnly(startDate);
  const last = toDateOnly(endDate);

  while (cursor <= last) {
    if (!isWeekend(cursor)) {
      const dateKey = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1,
      ).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (holidayDateSet?.has(dateKey)) {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
        continue;
      }
      const start = toDate(dateKey, startH, startM);
      const end = toDate(dateKey, endH, endM);
      events.push({
        title,
        start,
        end,
        isMine: item?.isMine ?? false,
        raw: item,
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  return events;
}

function parseTimeToParts(time) {
  if (!time) return null;
  const str = String(time).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function overtimeToEvent(item) {
  const empName = item?.employee?.name ?? "이름없음";
  const deptName = item?.employee?.department?.name ?? "";
  const requestDate = item?.requestDate;
  if (!requestDate) return null;

  const startParts = parseTimeToParts(item?.startTime) ?? { h: 18, m: 0 };
  const endParts = parseTimeToParts(item?.endTime) ?? { h: 20, m: 0 };

  const start = toDate(requestDate, startParts.h, startParts.m);
  const end = toDate(requestDate, endParts.h, endParts.m);

  const title = `${empName}${deptName ? ` (${deptName})` : ""} - 연장근로`;

  return {
    title,
    start,
    end,
    isMine: item?.isMine ?? false,
    raw: {
      ...item,
      leaveType: "연장근로",
      reason: item?.jobDescription ?? "",
      isOvertime: true,
    },
  };
}

function normalizeHolidayDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return null;
}

function normalizeHolidayItem(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const date = normalizeHolidayDate(item);
    return date ? { date, name: "공휴일" } : null;
  }
  if (typeof item === "object") {
    const date =
      normalizeHolidayDate(item.date) ||
      normalizeHolidayDate(item.locdate) ||
      normalizeHolidayDate(item.holidayDate) ||
      normalizeHolidayDate(item.localDate) ||
      normalizeHolidayDate(item.day);
    if (!date) return null;
    const dateName =
      item.dateName || item.holidayName || item.name || item.title || "공휴일";
    return { date, name: dateName, dateName };
  }
  return null;
}

function toDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isDateInRange(dateKey, start, end) {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  return dateKey >= startKey && dateKey <= endKey;
}

const LEAVE_TYPE_STYLES = {
  연차: { bg: "#DCEFE6", border: "#9CCFB6", text: "#1F5A45" },
  오전반차: { bg: "#DDE9FB", border: "#9BBEE6", text: "#1D4C7A" },
  오후반차: { bg: "#E5E3FB", border: "#B7B7E6", text: "#3B3E7E" },
  "본인의 결혼": { bg: "#EEE7E1", border: "#D2C7BC", text: "#5B4E44" },
  "배우자 출산": { bg: "#EEE7E1", border: "#D2C7BC", text: "#5B4E44" },
  "본인•배우자의 부모 또는 배우자의 사망": {
    bg: "#EEE7E1",
    border: "#D2C7BC",
    text: "#5B4E44",
  },
  "본인•배우자의 조부모 또는 외조부모의 사망": {
    bg: "#EEE7E1",
    border: "#D2C7BC",
    text: "#5B4E44",
  },
  "자녀 또는 자녀의 배우자 사망": { bg: "#F4E2E2", border: "#E0B1B1", text: "#7A2D2D" },
  "본인•배우자의 형제•자매 사망": { bg: "#F4E2E2", border: "#E0B1B1", text: "#7A2D2D" },
  건강검진: { bg: "#EAEFF6", border: "#C1CAD7", text: "#3A4A5E" },
  예비군: { bg: "#EAEFF6", border: "#C1CAD7", text: "#3A4A5E" },
  특별보상휴가: { bg: "#EAEFF6", border: "#C1CAD7", text: "#3A4A5E" },
  무급: { bg: "#EAEFF6", border: "#C1CAD7", text: "#3A4A5E" },
  출산: { bg: "#F7E0EC", border: "#E2B4CB", text: "#7A3B58" },
  연장근로: { bg: "#D8F1EF", border: "#9DCFCB", text: "#0F5D58" },
  공휴일: { bg: "#F4F7FB", border: "#E8B8B8", text: "#B42323" },
};

const getLeaveTypeStyle = (leaveType) =>
  LEAVE_TYPE_STYLES[leaveType] ?? {
    bg: "#E5E7EB",
    border: "#9CA3AF",
    text: "#334155",
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
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [dayEventsDate, setDayEventsDate] = useState(null);

  const [mode, setMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(() =>
    normalizeForMode(new Date(), "month")
  );

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLeave, setShowLeave] = useState(true);
  const [showOvertime, setShowOvertime] = useState(true);

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const openDayEventsModal = (date, list) => {
    setDayEventsDate(date);
    setDayEvents(list);
    setDayEventsModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setSelectedEvent(null);
  };

  const closeDayEventsModal = () => {
    setDayEventsModalOpen(false);
    setDayEvents([]);
    setDayEventsDate(null);
  };

  const DEFAULT_DEPARTMENTS = [
    "MANAGEMENT",
    "Sales&Marketing",
    "ENGINEERING",
    "Coordinator",
    "Logistic&Warehouse",
    "IT/ISO",
  ];

  const detail = selectedEvent?.raw;
  const employeeName = detail?.employee?.name ?? "-";
  const displayName = detail?.isHoliday
    ? detail?.dateName ?? detail?.name ?? "공휴일"
    : employeeName;
  const departmentName = detail?.employee?.department?.name ?? "-";
  const leaveType = detail?.leaveType ?? "-";
  const showTime =
    leaveType === "오전반차" ||
    leaveType === "오후반차" ||
    detail?.isOvertime;

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatDateTimeNoSeconds = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const datePart = formatDate(d);
    const timePart = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  };

  const timeLabel =
    selectedEvent?.start && selectedEvent?.end
      ? showTime
        ? `${formatDateTimeNoSeconds(selectedEvent.start)} ~ ${formatDateTimeNoSeconds(
            selectedEvent.end
          )}`
        : `${formatDate(selectedEvent.start)} ~ ${formatDate(
            selectedEvent.end
          )}`
      : "-";

  const [onlyMine, setOnlyMine] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  const [dragStartX, setDragStartX] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [approvedOvertime, setApprovedOvertime] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayCache, setHolidayCache] = useState({});

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      let list = [];
      let overtimeList = [];

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
        (item) => item.approvalStatusDisplay === "승인"
      );

      const overtimeRes = await api.get("/overtime");
      overtimeList = Array.isArray(overtimeRes.data) ? overtimeRes.data : [];
      const approvedOvertimeOnly = overtimeList.filter(
        (item) => item.approvalStatusDisplay === "승인"
      );

      const deptSet = new Set(DEFAULT_DEPARTMENTS);

      for (const item of approvedOnly) {
        const deptName = item?.employee?.department?.name;
        if (deptName) deptSet.add(deptName);
      }
      for (const item of approvedOvertimeOnly) {
        const deptName = item?.employee?.department?.name;
        if (deptName) deptSet.add(deptName);
      }

      const deptList = Array.from(deptSet).sort();
      setDepartments(deptList);

      setApprovedLeaves(approvedOnly);
      setApprovedOvertime(approvedOvertimeOnly);
    } catch (e) {
      console.error("스케줄 불러오기 실패", e);
    } finally {
      setLoading(false);
    }
  }, [onlyMine]);

  const fetchHolidays = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const cacheKey = `${year}-${String(month).padStart(2, "0")}`;
    const cached = holidayCache[cacheKey];
    if (cached) {
      setHolidays(cached);
      return;
    }

    try {
      const res = await api.get("/holiday", {
        params: { year, month },
      });
      const items =
        res.data?.response?.body?.items?.item ??
        res.data?.items?.item ??
        res.data?.items ??
        res.data?.data ??
        res.data ??
        [];
      const list = Array.isArray(items) ? items : [items];
      const normalized = list
        .map(normalizeHolidayItem)
        .filter((item) => item?.date);
      setHolidays(normalized);
      setHolidayCache((prev) => ({ ...prev, [cacheKey]: normalized }));
    } catch (e) {
      console.error("공휴일 불러오기 실패", e);
      setHolidays([]);
    }
  }, [currentDate, holidayCache]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    setCurrentDate((prev) => normalizeForMode(prev, mode));
  }, [mode]);

  useEffect(() => {
    setSelectedDept((prev) => prev.filter((d) => departments.includes(d)));
  }, [departments]);

  const events = useMemo(() => {
    const holidayDateSet = new Set(
      holidays
        .map((holiday) => normalizeHolidayDate(holiday?.date))
        .filter(Boolean)
    );
    const filteredLeaves =
      selectedDept.length === 0
        ? approvedLeaves
        : approvedLeaves.filter((item) => {
            const deptName = item?.employee?.department?.name ?? "";
            return selectedDept.includes(deptName);
          });

    const filteredOvertime =
      selectedDept.length === 0
        ? approvedOvertime
        : approvedOvertime.filter((item) => {
            const deptName = item?.employee?.department?.name ?? "";
            return selectedDept.includes(deptName);
          });

    const leaveEvents = filteredLeaves.flatMap((item) =>
      leaveToEvents(item, holidayDateSet)
    );
    const overtimeEvents = filteredOvertime
      .map(overtimeToEvent)
      .filter(Boolean);
    const holidayEvents = holidays
      .map((holiday) => {
        const date = normalizeHolidayDate(holiday?.date);
        if (!date) return null;
        return {
          title: holiday?.name ? holiday.name : "공휴일",
          start: toDate(date, 0, 0),
          end: toDate(date, 23, 59),
          raw: { ...holiday, leaveType: "공휴일", isHoliday: true },
        };
      })
      .filter(Boolean);

    const includeLeave = showLeave;
    const includeOvertime = showOvertime;

    return [
      ...(includeLeave ? leaveEvents : []),
      ...(includeOvertime ? overtimeEvents : []),
      ...(includeLeave ? holidayEvents : []),
    ];
  }, [approvedLeaves, approvedOvertime, selectedDept, holidays, showLeave, showOvertime]);

  const getEventsForDate = useCallback(
    (date) => {
      if (!date) return [];
      const targetKey = toDateKey(date);
      return events.filter((event) =>
        isDateInRange(targetKey, event.start, event.end)
      );
    },
    [events]
  );

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

  const allChecked = showLeave && showOvertime;

  const toggleAll = () => {
    const next = !allChecked;
    setShowLeave(next);
    setShowOvertime(next);
  };

  const FilterCheckbox = ({ label, checked, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        backgroundColor: "white",
      }}
    >
      <Checkbox value={checked} onValueChange={onPress} color="#121D6D" />
      <Text style={{ fontSize: 12, color: "#0F172A", fontWeight: "600" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, paddingTop: 12, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 8,
          gap: 12,
          position: "relative",
          zIndex: 10,
          elevation: 10,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
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
                left: 0,
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

        <View style={{ flexDirection: "row", gap: 10, padding: 6 }}>
          <FilterCheckbox
            label="전체"
            checked={allChecked}
            onPress={toggleAll}
          />
          <FilterCheckbox
            label="휴가"
            checked={showLeave}
            onPress={() => setShowLeave((v) => !v)}
          />
          <FilterCheckbox
            label="연장"
            checked={showOvertime}
            onPress={() => setShowOvertime((v) => !v)}
          />
        </View>
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
          height={500}
          mode={mode}
          date={currentDate}
          swipeEnabled={false}
          maxVisibleEventCount={2}
          moreLabel="+ {moreCount}개의 일정 더보기"
          theme={{
            palette: { moreLabel: "#94A3B8" },
            typography: {
              moreLabel: {
                fontSize: 12,
                fontWeight: "500",
                textAlign: "center",
                paddingTop: 5,
              },
            },
            moreLabel: { textAlign: "center" },
          }}
          onPressMoreLabel={(moreEvents, date) =>
            openDayEventsModal(date, moreEvents)
          }
          onPressDateHeader={(date) =>
            openDayEventsModal(date, getEventsForDate(date))
          }
          renderEvent={(event, touchableOpacityProps) => (
            (() => {
              const style = getLeaveTypeStyle(event?.raw?.leaveType ?? "");
              return (
            <DefaultCalendarEventRenderer
              event={event}
              touchableOpacityProps={touchableOpacityProps}
              textColor={style.text ?? "#334155"}
              showTime={false}
            />
              );
            })()
          )}
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
              maxWidth: 460,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOpacity: 0.15,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  일정 상세
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: "#DBEAFE",
                  }}
                >
                  <Text style={{ color: "#121D6D", fontWeight: "bold" }}>
                    {leaveType}
                  </Text>
                </View>
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: "#E2E8F0",
                  }}
                >
                  <Text style={{ color: "#334155" }}>{departmentName}</Text>
                </View>
              </View>

              {selectedEvent?.isMine ? (
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: "#DCFCE7",
                  }}
                >
                  <Text style={{ color: "#15803D", fontWeight: "bold" }}>
                    내 일정
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={{
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 14,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#64748B", marginBottom: 6 }}>이름</Text>
              <Text style={{ fontSize: 16 }}>{displayName}</Text>
            </View>
            <View
              style={{
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 14,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#64748B", marginBottom: 6 }}>종류</Text>
              <Text style={{ fontSize: 15 }}>{leaveType}</Text>
            </View>
            <View
              style={{
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 14,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#64748B", marginBottom: 6 }}>기간</Text>
              <Text style={{ fontSize: 15 }}>{timeLabel}</Text>
            </View>

            {!detail?.isHoliday && (
              <View
                style={{
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#64748B", marginBottom: 6 }}>사유</Text>
                <Text style={{ fontSize: 15, color: "#0F172A" }}>
                  {detail?.reason ?? "-"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={closeEventModal}
              style={{
                alignSelf: "flex-end",
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 999,
                backgroundColor: "#121D6D",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={dayEventsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeDayEventsModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeDayEventsModal}
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
              maxWidth: 460,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOpacity: 0.15,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                {dayEventsDate ? `${toDateKey(dayEventsDate)} 일정` : "일정"}
              </Text>
              <Text style={{ color: "#64748B", marginTop: 4 }}>
                {dayEvents.length}건
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {dayEvents.length === 0 ? (
                <Text style={{ color: "#64748B" }}>
                  해당 날짜에 일정이 없습니다.
                </Text>
              ) : (
                dayEvents.map((event) => {
                  const leaveType = event?.raw?.leaveType ?? "";
                  const style = getLeaveTypeStyle(leaveType);
                  return (
                    <TouchableOpacity
                      key={`${event.title}-${event.start.toISOString()}`}
                      onPress={() => {
                        openEventModal(event);
                        closeDayEventsModal();
                      }}
                      style={{
                        backgroundColor: "white",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ fontWeight: "600" }}>
                          {event.title}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: style.bg,
                            borderWidth: 1,
                            borderColor: style.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: style.text ?? style.border,
                              fontWeight: "600",
                            }}
                          >
                            {leaveType || "기타"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={closeDayEventsModal}
              style={{
                alignSelf: "flex-end",
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 999,
                backgroundColor: "#121D6D",
                marginTop: 10,
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
