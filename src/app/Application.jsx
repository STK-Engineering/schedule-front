import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";

const columns = [
  { key: "name", title: "이름", width: 60, sortable: true },
  { key: "department", title: "부서", width: 60, sortable: true },
  { key: "type", title: "유형", width: 80, sortable: true },
  { key: "date", title: "사용일자", width: 100, sortable: true },
  { key: "reason", title: "사유", width: 80, sortable: true },
  { key: "etc", title: "기타사항", width: 100, sortable: true }
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
    type: "오전반차",
    date: "2025-01-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 3,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-01-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 4,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-01-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 5,
    name: "김민지",
    department: "IT/ISO",
    type: "연차",
    date: "2025-02-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 6,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-08-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
  {
    id: 7,
    name: "이지우",
    department: "IT/ISO",
    type: "연차",
    date: "2025-05-12",
    reason: "가족 여행",
    etc: "싱가포르",
  },
];

export default function Application() {
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [modalVisible, setModalVisible] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

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
      <View style={[styles.checkboxCell, styles.headerCell]} />
      {columns.map((col) => (
        <TouchableOpacity
          key={col.key}
          style={[styles.cell, { width: col.width }]}
          activeOpacity={0.7}
          onPress={() => col.sortable && handleSort(col.key)}
        >
          <Text style={styles.headerText}>
            {col.title}
            {sort.key === col.key && (
              <Text style={styles.sortIcon}>
                {sort.direction === "asc" ? " ↑" : " ↓"}
              </Text>
            )}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRow = ({ item }) => {
    const checked = selectedIds.includes(item.id);

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.checkboxCell}
          onPress={() => toggleSelect(item.id)}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        </TouchableOpacity>

        {columns.map((col) => (
          <View key={col.key} style={[styles.cell, { width: col.width }]}>
            <Text style={styles.cellText}>{item[col.key]}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.moreCell}
          onPress={() => {
            console.log("more", item);
          }}
        >
          <Text style={styles.moreText}>⋮</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>휴가 신청 목록({data.length})</Text>

      <ScrollView horizontal>
        <View>
          {renderHeader()}

          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRow}
            removeClippedSubviews
            initialNumToRender={10}
            windowSize={7}
          />
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>계정 추가</Text>

            <TextInput style={styles.input} placeholder="이름" />
            <TextInput style={styles.input} placeholder="부서" />
            <TextInput style={styles.input} placeholder="직급" />
            <TextInput style={styles.input} placeholder="입사일" />
            <TextInput style={styles.input} placeholder="메일" />
            <TextInput style={styles.input} placeholder="결재자" />
            <TextInput style={styles.input} placeholder="권한" />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.confirmText}>수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    marginTop: 10
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 30,
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
  headerCell: {
    backgroundColor: "#F4F6F8",
  },
  headerText: {
    fontWeight: "600",
    fontSize: 10
  },
  cellText: {
    color: "#333",
    fontSize: 10
  },

  checkboxCell: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: "#121D6D",
    borderColor: "#121D6D",
  },

  moreCell: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 18,
    color: "#555",
  },
  sortIcon: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: 340,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },

  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#305685",
    width: "48%",
  },

  confirmButton: {
    backgroundColor: "#305685",
    width: "48%",
  },

  cancelText: {
    color: "#305685",
    fontWeight: "600",
    textAlign: "center",
  },

  confirmText: {
    color: "#FFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
