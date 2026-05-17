import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Pressable,
  useWindowDimensions,
  Modal,
  Alert,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sidebar } from "../components/Sidebar";
import { MobileRoleMenu } from "../components/MobileRoleMenu";
import { GradientHero } from "../components/GradientHero";
import { OFFBOARDING_NOTIFICATIONS_KEY } from "../constants/storage";

type OffboardingType = "Termination" | "End of Contract";
type ReasonType =
  | "Performance Issues"
  | "Policy Violation"
  | "Redundancy"
  | "Restructuring"
  | "Other"
  | "";

interface OffboardingNotification {
  id: string;
  name: string;
  department: string;
  date: string;
  type: OffboardingType;
  status: string;
  position: string;
  termDetails: string;
  lastWorkingDay: string;
  reason: string;
  initiatedBy: string;
  evidence?: { name: string; uri: string } | null;
}

const CHECKLIST_ITEMS = [
  "Company ID Card",
  "Laptop Return",
  "Knowledge Transfer Document",
  "Exit Interview Scheduled",
  "Access Card Return",
];

export function ManagerOffboardingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session = route.params?.session ?? {
    name: "Manager",
    email: "",
    role: "manager",
  };
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  // Main screen states
  const [signOffNotes, setSignOffNotes] = useState("");
  const [notifications, setNotifications] = useState<OffboardingNotification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal & Form states
  const [isInitModalVisible, setIsInitModalVisible] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"manual" | "upload">("manual");
  const [offboardingType, setOffboardingType] = useState<OffboardingType>("Termination");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [termDetails, setTermDetails] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [reason, setReason] = useState<ReasonType>("");
  const [evidenceFile, setEvidenceFile] = useState<{ name: string; uri: string } | null>(null);

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Calendar states
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const selectedNotification = notifications.find(n => n.id === selectedId);

  // Load notifications from storage
  const loadNotifications = React.useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFBOARDING_NOTIFICATIONS_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Calendar Logic
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, current: false, month: month - 1, year });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, month, year });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, month: month + 1, year });
    }
    return days;
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const formatted = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
    setLastWorkingDay(formatted);
    setIsDatePickerVisible(false);
  };

  const skipMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const isSelected = (day: number, month: number, year: number) => {
    if (!lastWorkingDay) return false;
    const parts = lastWorkingDay.split("/");
    if (parts.length !== 3) return false;
    const [m, d, y] = parts.map(Number);
    return d === day && m === (month + 1) && y === year;
  };

  const resetForm = () => {
    setEmployeeName("");
    setDepartment("");
    setPosition("");
    setTermDetails("");
    setLastWorkingDay("");
    setReason("");
    setOffboardingType("Termination");
    setEvidenceFile(null);
    setIsInitModalVisible(false);
  };

  const handleInitiate = async () => {
    if (!employeeName || !department || !reason) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    const newNotification: OffboardingNotification = {
      id: Math.random().toString(36).substr(2, 9),
      name: employeeName,
      department: department,
      date: new Date().toISOString().split("T")[0],
      type: offboardingType,
      status: "Review Required",
      position: position,
      termDetails: termDetails,
      lastWorkingDay: lastWorkingDay,
      reason: reason,
      initiatedBy: "Manager",
      evidence: evidenceFile,
    };

    try {
      const updated = [newNotification, ...notifications];
      setNotifications(updated);
      await AsyncStorage.setItem(OFFBOARDING_NOTIFICATIONS_KEY, JSON.stringify(updated));
      Alert.alert("Success", `Offboarding initiated for ${employeeName}.`);
      resetForm();
    } catch (e) {
      Alert.alert("Error", "Failed to save offboarding. Please try again.");
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedId) return;
    try {
      const updated = notifications.map(n =>
        n.id === selectedId ? { ...n, status: "HR Processing" } : n
      );
      setNotifications(updated);
      await AsyncStorage.setItem(OFFBOARDING_NOTIFICATIONS_KEY, JSON.stringify(updated));
      Alert.alert("Sent to HR", "Offboarding has been acknowledged and sent to HR for processing.");
      setSelectedId(null);
    } catch (e) {
      Alert.alert("Error", "Failed to update record.");
    }
  };

  const isFormComplete =
    employeeName.trim() !== "" &&
    department.trim() !== "" &&
    position.trim() !== "" &&
    lastWorkingDay.trim() !== "" &&
    reason !== "" &&
    (submissionMode === "manual" ? termDetails.trim() !== "" : evidenceFile !== null);

  const handlePickEvidence = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });
      if (!result.canceled) {
        setEvidenceFile({ name: result.assets[0].name, uri: result.assets[0].uri });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleRemoveEvidence = () => setEvidenceFile(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.layout}>
        {!isMobile && (
          <Sidebar
            role="manager"
            userName={session.name}
            email={session.email}
            activeScreen="Offboarding"
            navigation={navigation}
          />
        )}

        <View style={styles.mainContent}>
          {isMobile && (
            <MobileRoleMenu
              role="manager"
              userName={session.name}
              email={session.email}
              activeScreen="Offboarding"
              navigation={navigation}
            />
          )}

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <GradientHero>
              <Text style={styles.eyebrow}>Process Management</Text>
              <Text style={styles.title}>Offboarding Management</Text>
              <Text style={styles.subtitle}>
                Manage employee departures and ensure smooth knowledge transfer.
              </Text>
            </GradientHero>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.initiateBtn}
                onPress={() => setIsInitModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.initiateBtnText}> Initiate Offboarding</Text>
              </Pressable>
            </View>

            {/* Notifications Section */}
            {notifications.length > 0 && (
              <View style={[styles.card, styles.notificationsCard]}>
                <Text style={styles.cardTitle}>Offboarding Notifications</Text>
                {notifications.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.notificationRow, selectedId === item.id && styles.notificationRowActive]}
                    onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  >
                    <View style={styles.avatarWrap}>
                      <View style={styles.avatar}>
                        <Ionicons name="person-outline" size={20} color="#64748B" />
                      </View>
                    </View>
                    <View style={styles.notificationMain}>
                      <Text style={styles.notificationName}>{item.name}</Text>
                      <Text style={styles.notificationSub}>
                        {item.department} • {item.status === "Review Required" ? "Submitted" : item.status}
                      </Text>
                    </View>
                    <View style={styles.badgeCol}>
                      <View style={styles.typeBadgePill}>
                        <Text style={styles.typeBadgeTextPill}>{item.type}</Text>
                      </View>
                      <View style={[styles.statusBadgePill, item.status !== "Review Required" && styles.statusBadgeActivePill]}>
                        <Text style={[styles.statusBadgeTextPill, item.status !== "Review Required" && styles.statusBadgeTextActivePill]}>
                          {item.status === "Review Required" ? "Pending" : "Acknowledged"}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Detail Review Section (Visible when a notification is selected) */}
            {selectedNotification && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Offboarding Review</Text>
                    <View style={styles.reviewBadge}>
                      <Text style={styles.reviewBadgeText}>Pending Review</Text>
                    </View>
                  </View>

                  <View style={styles.reviewGrid}>
                    <View style={styles.reviewCol}>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Employee Name</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.name}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Position</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.position || "Not specified"}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Last Working Day</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.lastWorkingDay || "Not specified"}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Submitted Date</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.date}</Text>
                      </View>
                    </View>

                    <View style={styles.reviewCol}>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Department</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.department}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Offboarding Type</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.type}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Reason</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.reason}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Initiated By</Text>
                        <Text style={styles.reviewValue}>{selectedNotification.initiatedBy}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Termination Details</Text>
                    <View style={styles.detailsBox}>
                      <Feather name="file-text" size={16} color="#64748B" style={{ marginTop: 2, marginRight: 8 }} />
                      <Text style={styles.detailsText}>{selectedNotification.termDetails || "No details provided."}</Text>
                    </View>
                  </View>

                  {selectedNotification.evidence && (
                    <View style={[styles.reviewItem, { marginTop: 10 }]}>
                      <Text style={styles.reviewLabel}>Termination Evidence</Text>
                      <View style={styles.evidenceAttachedRow}>
                        <Ionicons name="document-attach-outline" size={18} color="#2563EB" />
                        <Text style={styles.evidenceAttachedText} numberOfLines={1}>
                          {selectedNotification.evidence.name}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Pressable style={styles.acknowledgeBtn} onPress={handleAcknowledge}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.acknowledgeBtnText}>Acknowledge & Send to HR</Text>
                  </Pressable>
                </View>

                {/* Checklist Card */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Employee Checklist Progress</Text>
                  <View style={styles.checklist}>
                    {CHECKLIST_ITEMS.map((item, idx) => (
                      <View key={idx} style={styles.checklistItem}>
                        <View style={styles.checklistLeft}>
                          <Ionicons name="time-outline" size={18} color="#94A3B8" />
                          <Text style={styles.checklistText}>{item}</Text>
                        </View>
                        <View style={styles.checklistBadge}>
                          <Text style={styles.checklistBadgeText}>Not Started</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Knowledge Transfer Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Knowledge Transfer Sign-Off</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Transfer Notes</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Add notes about knowledge transfer completion, documentation handover, etc..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={signOffNotes}
                  onChangeText={setSignOffNotes}
                />
              </View>

              <Pressable style={styles.signOffBtn}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.signOffBtnText}>Sign Off Knowledge Transfer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Initiation Modal */}
      <Modal
        visible={isInitModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.cancelBtn} onPress={resetForm}>
              <View style={styles.cancelBtnContent}>
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ transform: [{ rotate: "45deg" }] }} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </View>
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-remove-outline" size={20} color="#B91C1C" />
                <Text style={styles.sectionHeaderText}>Initiate Offboarding for Team Member</Text>
              </View>

              {/* Offboarding Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Offboarding Type</Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <Text style={styles.dropdownValue}>{offboardingType}</Text>
                  <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                </Pressable>
                {showTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {(["Termination", "End of Contract"] as OffboardingType[]).map((t) => (
                      <Pressable
                        key={t}
                        style={[styles.dropdownItem, offboardingType === t && styles.dropdownItemActive]}
                        onPress={() => {
                          setOffboardingType(t);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, offboardingType === t && styles.dropdownItemTextActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Employee Information */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Employee Name"
                  placeholderTextColor="#94A3B8"
                  value={employeeName}
                  onChangeText={setEmployeeName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Department"
                  placeholderTextColor="#94A3B8"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>

              {/* Position */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Position</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Software Engineer"
                  placeholderTextColor="#94A3B8"
                  value={position}
                  onChangeText={setPosition}
                />
              </View>

              {/* Manual/Upload Toggle */}
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[styles.tabButton, submissionMode === "manual" && styles.tabButtonActive]}
                  onPress={() => setSubmissionMode("manual")}
                >
                  <Ionicons name="document-text-outline" size={18} color={submissionMode === "manual" ? "#FFFFFF" : "#64748B"} />
                  <Text style={[styles.tabText, submissionMode === "manual" && styles.tabTextActive]}>Type Manually</Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, submissionMode === "upload" && styles.tabButtonActive]}
                  onPress={() => setSubmissionMode("upload")}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color={submissionMode === "upload" ? "#FFFFFF" : "#64748B"} />
                  <Text style={[styles.tabText, submissionMode === "upload" && styles.tabTextActive]}>Upload File</Text>
                </Pressable>
              </View>

              {submissionMode === "manual" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Termination Details</Text>
                  <TextInput
                    style={[styles.formInput, styles.textAreaFull]}
                    placeholder="Enter termination details and reason..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={termDetails}
                    onChangeText={setTermDetails}
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Upload Document</Text>
                  <Pressable style={styles.dropzone} onPress={handlePickEvidence}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                    <Text style={styles.dropzoneText}>
                      {evidenceFile ? evidenceFile.name : "Click to upload or drag and drop"}
                    </Text>
                  </Pressable>
                  <Text style={styles.supportedFormats}>Supported formats: PDF, DOC, DOCX (Max 10MB)</Text>
                </View>
              )}

              {/* Last Working Day & Reason Row */}
              <View style={[styles.formRow, { zIndex: 10, marginBottom: showReasonDropdown ? 200 : 0 }]}>
                <View style={[styles.inputGroup, { flex: 1, zIndex: 1 }]}>
                  <Text style={styles.inputLabel}>Last Working Day</Text>
                  <View style={styles.dateInputWrap}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="mm/dd/yyyy"
                      placeholderTextColor="#94A3B8"
                      value={lastWorkingDay}
                      editable={false}
                    />
                    <Pressable
                      style={styles.dateIconPressable}
                      onPress={() => setIsDatePickerVisible(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#64748B" />
                    </Pressable>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10, zIndex: 20 }]}>
                  <Text style={styles.inputLabel}>Reason</Text>
                  <Pressable
                    style={styles.dropdownTrigger}
                    onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                  >
                    <Text style={styles.dropdownValue}>{reason || "Select a reason"}</Text>
                    <Ionicons name={showReasonDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                  </Pressable>
                  {showReasonDropdown && (
                    <View style={styles.dropdownMenuReason}>
                      {(offboardingType === "End of Contract"
                        ? ["Contract Expired", "Project Completed", "Fixed-Term End", "Other"]
                        : offboardingType === "Termination" 
                        ? ["Performance Issues", "Policy Violation", "Redundancy", "Restructuring", "Other"]
                        : ["Resignation", "Other"]
                      ).map((r) => (
                        <Pressable
                          key={r}
                          style={[styles.dropdownItem, reason === r && styles.dropdownItemActive]}
                          onPress={() => {
                            setReason(r as ReasonType);
                            setShowReasonDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, reason === r && styles.dropdownItemTextActive]}>{r}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Pressable
                style={[styles.initiateBtn, !isFormComplete && styles.initiateBtnDisabled]}
                onPress={handleInitiate}
                disabled={!isFormComplete}
              >
                <Ionicons name="person-remove-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.initiateBtnText}>Initiate Offboarding</Text>
              </Pressable>
            </View>

            {/* Custom Date Picker Modal */}
            <Modal
              transparent
              visible={isDatePickerVisible}
              animationType="fade"
              onRequestClose={() => setIsDatePickerVisible(false)}
            >
              <Pressable
                style={styles.calendarOverlay}
                onPress={() => setIsDatePickerVisible(false)}
              >
                <View style={styles.calendarModal}>
                  <View style={styles.calendarHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.calendarMonthText}>{months[viewDate.getMonth()]}</Text>
                      <Text style={styles.calendarYearText}>{viewDate.getFullYear()}</Text>
                      <Ionicons name="chevron-down" size={14} color="#0F172A" style={{ marginTop: 2 }} />
                    </View>
                    <View style={styles.calendarNav}>
                      <Pressable onPress={() => skipMonth(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-up" size={16} color="#64748B" />
                      </Pressable>
                      <Pressable onPress={() => skipMonth(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.calendarWeekdays}>
                    {daysOfWeek.map(d => (
                      <Text key={d} style={styles.weekdayText}>{d}</Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {generateCalendarDays().map((item, idx) => {
                      const active = isSelected(item.day, item.month, item.year);
                      return (
                        <Pressable
                          key={idx}
                          style={[
                            styles.calendarDay,
                            !item.current && styles.calendarDayInactive,
                            active && styles.calendarDayActive
                          ]}
                          onPress={() => handleDateSelect(item.day, item.month, item.year)}
                        >
                          <Text style={[
                            styles.calendarDayText,
                            !item.current && styles.calendarDayTextInactive,
                            active && styles.calendarDayTextActive
                          ]}>
                            {item.day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.calendarFooter}>
                    <Pressable onPress={() => { setLastWorkingDay(""); setIsDatePickerVisible(false); }}>
                      <Text style={styles.footerBtnText}>Clear</Text>
                    </Pressable>
                    <Pressable onPress={() => {
                      const today = new Date();
                      handleDateSelect(today.getDate(), today.getMonth(), today.getFullYear());
                    }}>
                      <Text style={styles.footerBtnText}>Today</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Modal>


          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  layout: {
    flex: 1,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.78)",
    marginBottom: 12,
  },
  actionRow: {
    marginTop: 20,
    marginBottom: 20,
  },
  initiateBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initiateBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Notification Card
  notificationsCard: {
    paddingBottom: 10,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  notificationRowActive: {
    backgroundColor: "#F8FAFC",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderTopWidth: 0,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notificationMain: {
    flex: 1,
    marginRight: 8,
  },
  notificationName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  notificationSub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  typeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },
  statusBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  statusBadgeProcessing: {
    backgroundColor: "#ECFDF3",
    borderColor: "#D1FAE5",
  },
  statusBadgeText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "800",
  },
  statusBadgeTextProcessing: {
    color: "#065F46",
  },

  // Review Styles
  reviewBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reviewBadgeText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "800",
  },
  reviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 20,
  },
  reviewCol: {
    flex: 1,
    minWidth: 140,
    gap: 16,
  },
  reviewItem: {
    gap: 4,
  },
  reviewLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  reviewValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },
  detailsBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailsText: {
    flex: 1,
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    fontStyle: "italic",
  },
  acknowledgeBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  acknowledgeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Checklist Styles
  checklist: {
    gap: 10,
    marginTop: 10,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  checklistLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checklistText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  checklistBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checklistBadgeText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    marginLeft: 4,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: "#0F172A",
    minHeight: 140,
  },
  signOffBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOffBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  cancelBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cancelBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  dropdownTrigger: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    fontSize: 15,
    color: "#0F172A",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemActive: {
    backgroundColor: "#3B82F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#0F172A",
  },
  dropdownItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
  },
  textAreaSmall: {
    minHeight: 100,
  },
  dateInputWrap: {
    position: "relative",
  },
  dateIconPressable: {
    position: "absolute",
    right: 16,
    top: 14,
  },

  // Calendar Modal Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  calendarYearText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  calendarNav: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    padding: 4,
  },
  calendarWeekdays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekdayText: {
    width: 32,
    textAlign: "center",
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDay: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderRadius: 4,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayActive: {
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  calendarDayText: {
    fontSize: 13,
    color: "#0F172A",
  },
  calendarDayTextInactive: {
    color: "#94A3B8",
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  calendarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerBtnText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },

  initiateActionBtn: {
    backgroundColor: "#E0919D",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  initiateActionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  evidenceAttachedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
  },
  evidenceAttachedText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    flex: 1,
  },
  uploadBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  attachmentContainer: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  attachmentFileName: {
    fontSize: 13,
    color: "#1E40AF",
    fontWeight: "700",
  },
  removeAttachmentBtn: {
    padding: 4,
  },
  badgeCol: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  typeBadgePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeTextPill: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  statusBadgePill: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActivePill: {
    backgroundColor: "#DBEAFE",
  },
  statusBadgeTextPill: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "600",
  },
  statusBadgeTextActivePill: {
    color: "#2563EB",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    marginTop: 10,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: "#0F172A",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  textAreaFull: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 12,
    backgroundColor: "#F8FAFC",
  },
  dropzone: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  dropzoneText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  supportedFormats: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
  },
  dropdownMenuReason: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
    zIndex: 1000,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItemActive: {
    backgroundColor: "#3B82F6",
  },
  dropdownItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  initiateBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  initiateBtnDisabled: {
    backgroundColor: "#334155",
  },
  initiateBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
  },
});
