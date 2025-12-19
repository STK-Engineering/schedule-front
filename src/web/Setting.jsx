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
  { key: "name", title: "이름", width: 120, sortable: true },
  { key: "department", title: "부서", width: 140, sortable: true },
  { key: "position", title: "직급", width: 100, sortable: true },
  { key: "date", title: "입사일", width: 160, sortable: true },
  { key: "mail", title: "메일", width: 182, sortable: true },
  { key: "approver", title: "결재자", width: 120, sortable: true },
  { key: "auth", title: "권한", width: 160, sortable: true },
];

const initialData = [
  {
    id: 1,
    name: "이지우",
    department: "IT/ISO",
    position: "사원",
    date: "2025-01-12",
    mail: "jw.lee@stk-eng.com",
    approver: "김미지",
    auth: "결재자, 관리자",
  },
  {
    id: 2,
    name: "이지우",
    department: "IT/ISO",
    position: "사원",
    date: "2025-05-12",
    mail: "jw.lee@stk-eng.com",
    approver: "김미지",
    auth: "결재자, 관리자",
  },
  {
    id: 3,
    name: "김세진",
    department: "IT/ISO",
    position: "사원",
    date: "2025-01-12",
    mail: "jw.lee@stk-eng.com",
    approver: "김미지",
    auth: "결재자, 관리자",
  },
  {
    id: 4,
    name: "이지우",
    department: "IT/ISO",
    position: "사원",
    date: "2025-03-12",
    mail: "jw.lee@stk-eng.com",
    approver: "김미지",
    auth: "결재자, 관리자",
  },
  {
    id: 5,
    name: "이지우",
    department: "IT/ISO",
    position: "사원",
    date: "2025-02-12",
    mail: "jw.lee@stk-eng.com",
    approver: "김미지",
    auth: "결재자, 관리자",
  },
];

export default function Setting() {
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
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <Text style={styles.title}>직원 수({data.length})</Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#305685",
            borderWidth: 1,
            borderColor: "#305685",
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 45,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: 500 }}
          >
            계정 추가
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal>
        <View>
          {renderHeader()}

          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
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
    padding: 40,
  },
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
  headerCell: {
    backgroundColor: "#F4F6F8",
  },
  headerText: {
    fontWeight: "600",
  },
  cellText: {
    color: "#333",
  },

  checkboxCell: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
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
  textAlign: "center"
},

confirmText: {
  color: "#FFF",
  fontWeight: "600",
  textAlign: "center"
},

});
