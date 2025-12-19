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
import { useNavigation } from "@react-navigation/native";
import Checkbox from "expo-checkbox";
import category from "../../assets/icon/category.png";
import cause from "../../assets/icon/reason.png";
import time from "../../assets/icon/time.png";
import other from "../../assets/icon/etc.png";

export default function Form() {
  const navigation = useNavigation();
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

      if (diffDays < 0) {
        setDiffDay(0);
        return;
      }

      setDiffDay(diffDays);
    }
  }, [start, end]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <View style={styles.mobileBox}>
        {/* 휴가 종류 */}
        <Section icon={category} title="휴가 종류">
          <View style={styles.typeWrap}>
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
        </Section>

        {/* 기간 */}
        <Section icon={time} title="기간">
          <TextInput
            placeholder="시작일 (YYYY-MM-DD)"
            style={styles.input}
            onChangeText={setStart}
          />
          <TextInput
            placeholder="종료일 (YYYY-MM-DD)"
            style={styles.input}
            onChangeText={setEnd}
          />
          <Text style={styles.helper}>사용일수: {diffDay ?? 0}일</Text>
        </Section>

        {/* 사유 */}
        <Section icon={cause} title="사유">
          <TextInput
            placeholder="사유를 입력하세요"
            value={reason}
            onChangeText={setReason}
            style={[styles.input, { height: 80 }]}
            multiline
          />
        </Section>

        {/* 기타 */}
        <Section icon={other} title="기타 사항">
          <TextInput
            placeholder="기타 사항을 입력하세요"
            value={etc}
            onChangeText={setEtc}
            style={[styles.input, { height: 140 }]}
            multiline
          />
        </Section>

        {/* 체크 */}
        <View style={styles.checkBox}>
          <Checkbox value={isChecked} onValueChange={setChecked} />
          <Text style={styles.checkText}>입력 내용을 모두 확인했습니다.</Text>
        </View>

        {/* 신청서 미리보기 */}
        <PreviewCard
          type={type}
          start={start}
          end={end}
          diffDay={diffDay}
          reason={reason}
          etc={etc}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              backgroundColor: isChecked ? "#121D6D" : "#b7b7b7ff",
              width: 100,
              height: 50,
              borderWidth: 1,
              borderColor: isChecked ? "#121D6D" : "#b7b7b7ff",
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={!isChecked}
            onPress={() => navigation.navigate("Schedule")}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              확인
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              color: "#121D6D",
              width: 100,
              height: 50,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#121D6D",
              borderRadius: 10,
              justifyContent: "center",
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
    </ScrollView>
  );
}

function Section({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Image source={icon} style={{ width: 22, height: 22 }} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function PreviewCard({ type, start, end, diffDay, reason, etc }) {
  return (
    <View style={styles.preview}>
      <Text style={styles.previewTitle}>신청서 미리보기</Text>

      <PreviewRow label="휴가 형태" value={type} />
      <PreviewRow label="기간" value={`${start || "-"} ~ ${end || "-"}`} />
      <PreviewRow label="사용일" value={`${diffDay ?? 0}일`} />
      <PreviewRow label="사유" value={reason || "-"} />
      <PreviewRow label="기타" value={etc || "-"} />
    </View>
  );
}

function PreviewRow({ label, value }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileBox: {
    padding: 16,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  typeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  typeButtonActive: {
    backgroundColor: "#121D6D",
    borderColor: "#121D6D",
  },

  typeText: {
    fontSize: 13,
    color: "#475569",
  },

  typeTextActive: {
    color: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  helper: {
    fontSize: 12,
    color: "#64748B",
  },

  checkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },


  checkText: {
    fontSize: 13,
    flex: 1,
  },

  preview: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  previewRow: {
    marginBottom: 10,
  },

  previewLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  previewValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
