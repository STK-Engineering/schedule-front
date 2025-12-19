import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import Checkbox from "expo-checkbox";
import category from "../../assets/icon/category.png";
import cause from "../../assets/icon/reason.png";
import time from "../../assets/icon/time.png";
import other from "../../assets/icon/etc.png";

export default function Form() {
  const [type, setType] = useState("연차");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [etc, setEtc] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [diffDay, setDiffDay] = useState(null);

  useEffect(() => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const diffTime = endDate - startDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if(diffDays < 0) {
        setDiffDay(0);
        return;
      }

      setDiffDay(diffDays);
    }
  }, [start, end]);

  return (
    <View style={styles.container}>
      <View style={styles.leftBox}>
        <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
          <Image source={category} style={{ width: 30, height: 30 }} />

          <View style={styles.typeRow}>
            {["연차", "반차(오전)", "반차(오후)", "경조사", "무급", "출산"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.typeButton,
                    type === item && styles.typeButtonActive,
                  ]}
                  onPress={() => setType(item)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === item && styles.typeTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
          <Image source={time} style={{ width: 30, height: 30 }} />
          <input
            type="date"
            style={styles.input}
            onChange={(e) => setStart(e.target.value)}
          ></input>
          <Text>~</Text>
          <input
            type="date"
            style={styles.input}
            onChange={(e) => setEnd(e.target.value)}
          ></input>
        </View>
        <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
          <Image source={cause} style={{ width: 30, height: 30 }} />
          <TextInput
            placeholder="사유를 입력하세요"
            value={reason}
            onChangeText={setReason}
            style={[styles.input, styles.textArea1]}
            multiline
          />
        </View>

        <View style={{ flexDirection: "row", gap: 20, alignItems: "start" }}>
          <Image
            source={other}
            style={{ width: 30, height: 30, marginTop: 10 }}
          />
          <TextInput
            placeholder="기타 사항을 입력하세요"
            value={etc}
            onChangeText={setEtc}
            style={[styles.input, styles.textArea2]}
            multiline
          />
        </View>
        <View style={[styles.check]}>
          <Checkbox
            style={styles.checkbox}
            value={isChecked}
            onValueChange={setChecked}
          />
          <View style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Text style={{ fontSize: 12.5 }}>
              위의 내용에 오탈자, 틀린 내용이 없는 지 최종적으로 확인 후,
              체크란을 클릭해주세요.
            </Text>
            <Text style={{ color: "red", fontSize: 12 }}>
              *휴가 사용 계획서는 사용 일자로부터 하루 전까지 취소와 수정이
              가능합니다.
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              backgroundColor: isChecked ? "#121D6D" : "#b7b7b7ff",
              width: "15%",
              borderWidth: 1,
              borderColor: isChecked ? "#121D6D" : "#b7b7b7ff",
              borderRadius: 10,
              marginTop: 20,
              alignItems: "center",
            }}
            disabled={!isChecked}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              확인
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              width: "17%",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 10,
              marginTop: 20,
              alignItems: "center",
            }}
            disabled={!isChecked}
          >
            <Text style={{ color: "#000000", fontSize: 16, fontWeight: "400" }}>
              임시 저장
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 신청서 */}
      <ScrollView style={styles.rightBox}>
        <View
          style={{
            width: 520,
            height: 700,
            backgroundColor: "#fff",
            marginTop: 30,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              borderWidth: 1,
              borderColor: "#333",
              height: 80,
            }}
          >
            <View
              style={{
                width: 278,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                휴가 사용 신청서
              </Text>
            </View>

            {["신청인", "부서장", "대표"].map((item) => (
              <View
                key={item}
                style={{
                  width: 80,
                  borderLeftWidth: 1,
                  borderColor: "#333",
                }}
              >
                <View
                  style={{
                    height: 22,
                    borderBottomWidth: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 11 }}>{item}</Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                />
              </View>
            ))}
          </View>

          <FormRow label="소속" value="IT/ISO" />
          <FormRow label="성명" value="" />
          <FormRow label="휴가형태" value={type} />
          <FormRow
            label="기 간"
            value={`${start || "미입력"}~${end || "미입력"}`}
          />
          <FormRow label="사용일" value={diffDay + "일" || "0일"} />
          <FormRow label="사유" value={reason || "기타"} />
          <FormRow label="기타 사항" value={etc} height={280} />

          <View
            style={{
              flexDirection: "row",
              borderWidth: 1,
              borderColor: "#333",
              marginTop: -1,
              height: 50,
            }}
          >
            <Cell title="휴가 일수 현황" width={120} />
            <Cell title="총 휴가 일수" width={80} />
            <Cell value="15일" />
            <Cell title="잔여 일수" width={80} />
            <Cell value="13일" />
          </View>

          {/* 날짜 */}
          <View style={{ marginTop: 10, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11 }}>
              {new Date().toISOString().slice(0, 10)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function FormRow({ label, value, height = 50 }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#333",
        marginTop: -1,
        height,
      }}
    >
      <View
        style={{
          width: 120,
          borderRightWidth: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 12 }}>{label}</Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 12 }}>{value}</Text>
      </View>
    </View>
  );
}

function Cell({ title, value, width }) {
  return (
    <View
      style={{
        width: width || undefined,
        flex: width ? undefined : 1,
        borderRightWidth: 1,
        borderColor: "#333",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 12 }}>{title || value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
  },
  leftBox: {
    width: "50%",
    padding: 20,
    backgroundColor: "white",
    borderRightWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    paddingBottom: 100,
    gap: 10,
  },
  rightBox: {
    width: "50%",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
  },
  typeRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 10,
  },
  typeButtonActive: {
    backgroundColor: "#121D6D",
    borderColor: "#121D6D",
  },
  typeText: {
    fontSize: 14,
    color: "#475569",
  },
  typeTextActive: {
    color: "white",
  },
  input: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    backgroundColor: "white",
    cursor: "pointer",
  },
  check: {
    marginTop: 8,
    padding: 15,
    marginLeft: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    backgroundColor: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: 12.5,
    gap: 5,
    flexDirection: "row",
    justifyContent: "start",
  },
  textArea1: {
    height: 40,
    width: "100%",
  },
  textArea2: {
    height: 200,
    width: "100%",
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: "white",
    padding: 20,
    borderWidth: 1,
    borderColor: "#000000",
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  previewValue: {
    fontSize: 16,
    marginTop: 5,
  },
  paragraph: {
    fontSize: 15,
  },
  checkbox: {
    margin: 8,
  },
});
