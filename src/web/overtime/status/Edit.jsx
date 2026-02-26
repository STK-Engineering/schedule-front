import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  useWindowDimensions,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import PageLayout from "../../../components/PageLayout";
import api from "../../../api/api";
import Checkbox from "expo-checkbox";

const STATUS_STYLE = {
  승인: { bg: "#E8EDFF", text: "#121D6D", dot: "#121D6D" },
  거절: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
  대기: { bg: "#EEF2F7", text: "#475569", dot: "#64748B" },
  반려: { bg: "#FFE9E7", text: "#FF2116", dot: "#FF2116" },
};

const htmlInputStyle = {
  padding: "11px 12px",
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  backgroundColor: "#FFFFFF",
  minWidth: 180,
  flexGrow: 1,
  fontSize: 14,
  color: "#0F172A",
  outline: "none",
};

const normalizeTimeValue = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{2}):(\d{2})/);
  if (!match) return text;
  return `${match[1]}:${match[2]}`;
};

const parseTimeToMinutes = (value) => {
  const normalized = normalizeTimeValue(value);
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
};

const MIN_OVERTIME_MINUTES = 30;
const MAX_OVERTIME_MINUTES = 12 * 60;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const getOvertimeDiffMinutes = (start, end) => {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes == null || endMinutes == null) return null;
  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const isValidOvertimeInterval = (start, end) => {
  const diff = getOvertimeDiffMinutes(start, end);
  if (diff == null) return false;
  return (
    diff >= MIN_OVERTIME_MINUTES &&
    diff <= MAX_OVERTIME_MINUTES &&
    diff % 30 === 0
  );
};

const showIntervalAlert = () => {
  const message =
    "종료시간은 시작시간 기준 30분 단위로, 최소 30분~최대 12시간 내에서 입력해주세요.";
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
    return;
  }
  Alert.alert("입력 오류", message);
};

const showImageSizeAlert = () => {
  const message = "이미지 용량은 5MB 이하만 첨부할 수 있습니다.";
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
    return;
  }
  Alert.alert("입력 오류", message);
};

export default function OvertimeEdit() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isNarrow = width < 1024;

  const params = route?.params ?? {};
  const id = params?.id;

  const [jobNumber, setJobNumber] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [hullNo, setHullNo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [isDragOverImageZone, setIsDragOverImageZone] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const endTimeAlertTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (!id) {
      Alert.alert("오류", "수정할 신청서 id가 없습니다.");
      navigation.goBack();
      return;
    }

    setJobNumber(params.jobNumber ?? "");
    setVesselName(params.vesselName ?? "");
    setHullNo(params.hullNo ?? "");
    setJobDescription(params.jobDescription ?? "");
    setRequestDate(params.requestDate ?? "");
    setStartTime(normalizeTimeValue(params.startTime ?? ""));
    setEndTime(normalizeTimeValue(params.endTime ?? ""));
    setExistingImageUrl(params.imageUrl ?? "");
    setRemoveImage(false);
  }, [id]);

  const hasVesselOrHull =
    vesselName.trim().length > 0 || hullNo.trim().length > 0;
  const isFormValid =
    jobNumber.trim().length > 0 &&
    hasVesselOrHull &&
    jobDescription.trim().length > 0 &&
    requestDate &&
    startTime &&
    endTime &&
    isValidOvertimeInterval(startTime, endTime);

  useEffect(() => {
    if (!isFormValid && isChecked) {
      setChecked(false);
    }
  }, [isFormValid, isChecked, attemptedCheck]);

  useEffect(() => {
    return () => {
      if (endTimeAlertTimerRef.current) {
        clearTimeout(endTimeAlertTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const getDataTransfer = (event) =>
      event?.dataTransfer ?? event?.nativeEvent?.dataTransfer;

    const hasFileType = (event) => {
      const types = Array.from(getDataTransfer(event)?.types ?? []);
      return types.includes("Files");
    };

    const preventBrowserFileDrop = (event) => {
      if (!hasFileType(event)) return;
      event.preventDefault();
    };

    window.addEventListener("dragover", preventBrowserFileDrop);
    window.addEventListener("drop", preventBrowserFileDrop);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileDrop);
      window.removeEventListener("drop", preventBrowserFileDrop);
    };
  }, []);

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const openImagePicker = () => {
    if (imageInputRef.current) imageInputRef.current.click();
  };

  const appendImageFiles = async (incomingFiles) => {
    const files = Array.from(incomingFiles ?? []).filter((file) =>
      String(file?.type ?? "").startsWith("image/"),
    );
    if (!files.length) {
      return;
    }

    try {
      const file = files[0];
      if (file.size > MAX_IMAGE_BYTES) {
        showImageSizeAlert();
        return;
      }
      const uploaded = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        file,
        dataUrl: await fileToDataUrl(file),
      };
      setAttachments([uploaded]);
      setRemoveImage(false);
    } catch (err) {
      console.error("이미지 변환 실패", err);
      Alert.alert("실패", "이미지 첨부에 실패했습니다.");
    }
  };

  const handleImageSelect = async (e) => {
    try {
      await appendImageFiles(e?.target?.files);
    } finally {
      if (e?.target) e.target.value = "";
    }
  };

  const handleImageDragOver = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragOverImageZone(true);
  };

  const handleImageDragEnter = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragOverImageZone(true);
  };

  const handleImageDragLeave = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOverImageZone(false);
    }
  };

  const handleImageDrop = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOverImageZone(false);
    const droppedFiles =
      e?.dataTransfer?.files ?? e?.nativeEvent?.dataTransfer?.files;
    if (!droppedFiles?.length) return;
    await appendImageFiles(droppedFiles);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const openPreviewModal = (imageUri) => {
    const uri = imageUri || attachments[0]?.dataUrl || existingImageUrl;
    if (!uri) return;
    setPreviewImageUri(uri);
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewImageUri("");
  };

  const handleEndTimeChange = (value) => {
    const nextEndTime = normalizeTimeValue(value);
    setEndTime(nextEndTime);

    if (endTimeAlertTimerRef.current) {
      clearTimeout(endTimeAlertTimerRef.current);
    }

    endTimeAlertTimerRef.current = setTimeout(() => {
      if (!startTime || !nextEndTime) return;
      if (!isValidOvertimeInterval(startTime, nextEndTime)) {
        showIntervalAlert();
      }
    }, 250);
  };

  const timeRange =
    startTime || endTime ? `${startTime || "-"} ~ ${endTime || "-"}` : "-";

  const saveEdit = async () => {
    if (!isChecked) return;
    if (!isValidOvertimeInterval(startTime, endTime)) {
      showIntervalAlert();
      return;
    }

    const withSeconds = (value) => {
      if (!value) return value;
      if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
      if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
      return value;
    };

    const payload = {
      jobNumber,
      vesselName,
      hullNo,
      jobDescription,
      requestDate,
      startTime: withSeconds(normalizeTimeValue(startTime)),
      endTime: withSeconds(normalizeTimeValue(endTime)),
      removeImage,
    };

    try {
      const formData = new FormData();
      const overTimeRequestBlob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      formData.append("overTimeRequest", overTimeRequestBlob);

      const newAttachment = attachments[0]?.file;
      if (newAttachment) {
        formData.append(
          "file",
          newAttachment,
          newAttachment?.name || "upload",
        );
      } else {
        const emptyFile = new Blob([], { type: "application/octet-stream" });
        formData.append("file", emptyFile, "null");
      }

      await api.put(`/overtime/${id}`, formData, {
        transformRequest: (data, headers) => {
          if (headers) delete headers["Content-Type"];
          return data;
        },
      });
      Alert.alert("완료", "연장 근로 신청이 수정되었습니다.");
      navigation.navigate("OverTimeStatus");
    } catch (err) {
      console.error("수정 실패", err);
      Alert.alert("실패", "연장 근로 신청 수정에 실패했습니다.");
    }
  };

  return (
    <PageLayout
      breadcrumb={[
        { label: "홈", route: "Home" },
        { label: "연장 근로 신청", route: "Form" },
        { label: "신청 수정" },
      ]}
      title="연장 근로 신청 수정"
    >
      <ScrollView
        contentContainerStyle={[
          styles.pageWrap,
          isNarrow && styles.pageWrapStack,
        ]}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>연장 근로 신청 수정</Text>
          <Text style={styles.pageSub}>
            신청 정보를 수정하고 저장해 주세요.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>신청 정보</Text>
            <Text style={styles.sectionSub}>
              필수 항목을 빠짐없이 입력해 주세요.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 정보</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>작업번호</Text>
                <TextInput
                  placeholder="예: A-1023"
                  value={jobNumber}
                  onChangeText={setJobNumber}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>선박명</Text>
                <TextInput
                  placeholder="예: H-SEA"
                  value={vesselName}
                  onChangeText={setVesselName}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>호선</Text>
                <TextInput
                  placeholder="예: 101"
                  value={hullNo}
                  onChangeText={setHullNo}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 일정</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>요청일자</Text>
                <input
                  type="date"
                  style={htmlInputStyle}
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>시작시간</Text>
                <input
                  type="time"
                  style={htmlInputStyle}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>종료시간</Text>
                <input
                  type="time"
                  style={htmlInputStyle}
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>이미지 첨부</Text>

            {Platform.OS === "web" ? (
              <div
                onDragEnter={handleImageDragEnter}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                style={{
                  ...StyleSheet.flatten([
                    styles.imageAttachPanel,
                    isDragOverImageZone && styles.imageAttachPanelActive,
                  ]),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={openImagePicker}
                >
                  <Text style={styles.imageUploadButtonText}>이미지 선택</Text>
                </TouchableOpacity>

                <Text style={styles.imageHintText}>
                  드래그하거나 버튼으로 선택 (최대 5MB)
                </Text>

                {(attachments.length > 0 || (existingImageUrl && !removeImage)) && (
                  <View style={styles.imageList}>
                    {(attachments.length > 0
                      ? attachments.map((item) => ({
                          ...item,
                          isExisting: false,
                        }))
                      : [
                          {
                            id: "existing",
                            name: "현재 이미지",
                            dataUrl: existingImageUrl,
                            isExisting: true,
                          },
                        ]
                    ).map((item) => (
                      <View key={item.id} style={styles.imageCard}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => openPreviewModal(item.dataUrl)}
                        >
                          <Image
                            source={{ uri: item.dataUrl }}
                            style={styles.imageThumb}
                          />
                        </TouchableOpacity>
                        <Text style={styles.imageName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.imageRemoveButton}
                          onPress={() => {
                            if (item.isExisting) {
                              setRemoveImage((prev) => !prev);
                            } else {
                              removeAttachment(item.id);
                            }
                          }}
                        >
                          <Text style={styles.imageRemoveButtonText}>
                            {item.isExisting && removeImage ? "삭제 취소" : "삭제"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </div>
            ) : (
              <View
                style={[
                  styles.imageAttachPanel,
                  isDragOverImageZone && styles.imageAttachPanelActive,
                ]}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={openImagePicker}
                >
                  <Text style={styles.imageUploadButtonText}>이미지 선택</Text>
                </TouchableOpacity>

                <Text style={styles.imageHintText}>
                  드래그하거나 버튼으로 선택 (최대 5MB)
                </Text>

                {(attachments.length > 0 || (existingImageUrl && !removeImage)) && (
                  <View style={styles.imageList}>
                    {(attachments.length > 0
                      ? attachments.map((item) => ({
                          ...item,
                          isExisting: false,
                        }))
                      : [
                          {
                            id: "existing",
                            name: "현재 이미지",
                            dataUrl: existingImageUrl,
                            isExisting: true,
                          },
                        ]
                    ).map((item) => (
                      <View key={item.id} style={styles.imageCard}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => openPreviewModal(item.dataUrl)}
                        >
                          <Image
                            source={{ uri: item.dataUrl }}
                            style={styles.imageThumb}
                          />
                        </TouchableOpacity>
                        <Text style={styles.imageName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.imageRemoveButton}
                          onPress={() => {
                            if (item.isExisting) {
                              setRemoveImage((prev) => !prev);
                            } else {
                              removeAttachment(item.id);
                            }
                          }}
                        >
                          <Text style={styles.imageRemoveButtonText}>
                            {item.isExisting && removeImage ? "삭제 취소" : "삭제"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupTitle}>작업 내용</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldItem, styles.fieldItemFull]}>
                <Text style={styles.fieldLabel}>내용</Text>
                <TextInput
                  placeholder="작업 내용을 입력하세요"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>미리보기</Text>
            <Text style={styles.sectionSub}>
              수정 내용을 요약해 보여줍니다.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>연장 근로 신청서</Text>
              <Text style={styles.previewSub}>작성한 내용을 확인하세요.</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: STATUS_STYLE["대기"].bg },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_STYLE["대기"].dot },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: STATUS_STYLE["대기"].text },
                ]}
              >
                대기
              </Text>
            </View>
          </View>

          <View style={styles.previewTable}>
            <PreviewRow label="작업번호" value={jobNumber || "-"} />
            <PreviewRow label="선박명" value={vesselName || "-"} />
            <PreviewRow label="호선" value={hullNo || "-"} />
            <PreviewRow label="요청일자" value={requestDate || "-"} />
            <PreviewRow label="작업시간" value={timeRange} />
            <PreviewRow
              label="작업내용"
              value={jobDescription || "-"}
              multiline
            />
            <View style={styles.tableRow}>
              <View style={styles.tableLabelCell}>
                <Text style={styles.tableLabel}>이미지</Text>
              </View>
              <View style={styles.tableValueCell}>
                {attachments.length > 0 || (existingImageUrl && !removeImage) ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      openPreviewModal(
                        attachments[0]?.dataUrl ||
                          (removeImage ? "" : existingImageUrl)
                      )
                    }
                  >
                    <Image
                      source={{
                        uri:
                          attachments[0]?.dataUrl ||
                          (removeImage ? "" : existingImageUrl),
                      }}
                      style={styles.previewImage}
                    />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.tableValue}>첨부 없음</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최종 확인</Text>
            <Text style={styles.sectionSub}>
              입력 내용 확인 후 저장해 주세요.
            </Text>
          </View>
          <View style={styles.sectionDivider} />

          <View style={[styles.check, isNarrow && styles.checkCompact]}>
            <Checkbox
              style={styles.checkbox}
              value={isChecked}
              onValueChange={(val) => {
                setAttemptedCheck(true);

                if (isFormValid) {
                  setChecked(val);
                }
              }}
              color={isFormValid ? "#121D6D" : "#b7b7b7"}
            />
            <View style={styles.checkTextWrap}>
              <Text style={styles.checkText}>
                위의 내용에 오탈자, 틀린 내용이 없는 지 최종적으로 확인 후,
                체크란을 클릭해주세요.
              </Text>
            </View>
          </View>

          <View style={[styles.alert, isNarrow && styles.alertCompact]}>
            {attemptedCheck && !isFormValid && (
              <Text style={{ color: "red", fontSize: 12 }}>
                필수 항목을 모두 입력해주세요.
              </Text>
            )}
          </View>

          <View style={[styles.actionRow, isNarrow && styles.actionRowStack]}>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                backgroundColor:
                  isChecked && isFormValid ? "#121D6D" : "#b7b7b7ff",
                width: "100%",
                borderWidth: 1,
                borderColor: isChecked && isFormValid ? "#121D6D" : "#b7b7b7ff",
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={saveEdit}
              disabled={!isChecked || !isFormValid}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                수정
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={previewModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closePreviewModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePreviewModal}
          style={styles.previewModalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.previewModalBox}
          >
            {!!previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                style={styles.previewModalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity onPress={closePreviewModal}>
              <Text style={styles.previewModalCloseText}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </PageLayout>
  );
}

function PreviewRow({ label, value, multiline = false }) {
  return (
    <View style={styles.tableRow}>
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

const styles = {
  pageWrap: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
  },
  pageWrapStack: {
    padding: 16,
    gap: 16,
  },
  pageHeader: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 18,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  pageSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionHeader: {
    marginBottom: 6,
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
    marginBottom: 16,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  inlineRowTop: { alignItems: "flex-start" },
  fieldGroup: {
    paddingVertical: 6,
  },
  fieldGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  fieldItem: {
    flexGrow: 1,
    minWidth: 200,
  },
  fieldItemFull: {
    minWidth: "100%",
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: 180,
    flexGrow: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  checkCompact: { marginTop: 4 },
  checkbox: { width: 18, height: 18, marginRight: 2 },
  checkTextWrap: { flex: 1, justifyContent: "center" },
  checkText: { fontSize: 12, color: "#475569" },
  alert: { minHeight: 18, marginTop: 6 },
  alertCompact: { minHeight: 16 },
  actionRow: { marginTop: 10 },
  actionRowStack: { marginTop: 8 },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  previewSub: { fontSize: 13, color: "#94A3B8", marginTop: 6 },
  statusPill: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#0F172A",
  },
  statusText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  previewTable: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  tableLabelCell: {
    width: 128,
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
  tableLabel: { fontSize: 13, fontWeight: "600", color: "#475569" },
  tableValue: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  tableValueMultiline: { lineHeight: 20 },
  imageAttachPanel: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    padding: 16,
    gap: 10,
    alignItems: "center",
  },
  imageAttachPanelActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  imageUploadButton: {
    alignSelf: "center",
    width: 80,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  imageUploadButtonText: {
    color: "#8f8f8fff",
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
  },
  imageHintText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 240,
  },
  imageList: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  imageCard: {
    width: 170,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 8,
    gap: 8,
  },
  imageThumb: {
    width: "100%",
    height: 90,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  imageName: {
    fontSize: 12,
    color: "#334155",
  },
  imageRemoveButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  imageRemoveButtonText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "600",
  },
  previewImage: {
    width: 260,
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  previewModalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    padding: 20,
  },
  previewModalBox: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  previewModalImage: {
    width: "100%",
    height: 480,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  previewModalCloseText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  backButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backButtonText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
};
