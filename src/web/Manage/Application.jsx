import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const columns = [
  { key: "name", title: "이름", width: 120, sortable: true },
  { key: "department", title: "부서", width: 140, sortable: true },
  { key: "type", title: "유형", width: 90, sortable: true },
  { key: "date", title: "사용일자", width: 200, sortable: true },
  { key: "reason", title: "사유", width: 200, sortable: true },
  { key: "etc", title: "기타사항", width: 232, sortable: true },
];

const initialData = [
  {
    id: 1,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-01-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 2,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-02-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 3,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-03-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
];

export default function Application() {
  const [data, setData] = useState(initialData);
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...data].sort((a, b) => {
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      return 0;
    });

    setSort({ key, direction });
    setData(sorted);
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((col) => (
        <TouchableOpacity
          key={col.key}
          style={[styles.cell, { width: col.width }]}
          onPress={() => col.sortable && handleSort(col.key)}
        >
          <Text style={styles.headerText}>
            {col.title}
            {sort.key === col.key && (sort.direction === "asc" ? " ↑" : " ↓")}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.moreWrapper} />
    </View>
  );

  const renderRow = ({ item }) => {
    const isOpen = openMenuId === item.id;

    return (
      <View style={styles.row}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText}>{item[col.key]}</Text>
          </View>
        ))}

        <View style={styles.moreWrapper}>
          <TouchableOpacity
            onPress={() => setOpenMenuId(isOpen ? null : item.id)}
          >
            <Text style={styles.moreText}>⋮</Text>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setOpenMenuId(null);
                  console.log("다운로드", item);
                }}
              >
                <Text>다운로드</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.title}>휴가 신청 목록 ({data.length})</Text>

      <ScrollView horizontal>
        <View>
          {renderHeader()}
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRow}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },

  cell: {
    padding: 12,
    justifyContent: "center",
  },

  headerText: {
    fontWeight: "600",
  },

  cellText: {
    color: "#333",
  },

  checkboxCell: {
    width: 50,
  },

  moreWrapper: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  moreText: {
    fontSize: 18,
    color: "#555",
    zIndex: 1000,
  },
  dropdown: {
    position: "absolute",
    top: 24,
    right: 0,
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 8,
    zIndex: 999,

    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
