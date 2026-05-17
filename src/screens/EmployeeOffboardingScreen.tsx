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
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sidebar } from "../components/Sidebar";
import { MobileRoleMenu } from "../components/MobileRoleMenu";
import { GradientHero } from "../components/GradientHero";
import { Colors } from "../constants/colors";
import { OFFBOARDING_NOTIFICATIONS_KEY } from "../constants/storage";

type ResignationReason = 
  | "Career Growth" 
  | "Better Opportunity" 
  | "Personal Reasons" 
  | "Relocation" 
  | "Further Education"
  | "Health Reasons"
  | "Other" 
  | "";

export function EmployeeOffboardingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session = route.params?.session ?? {
    name: "Staff",
    email: "",
    role: "staff",
  };
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  // Form states
  const [resignationLetter, setResignationLetter] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [reason, setReason] = useState<ResignationReason>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState({
    letter: "",
    date: "",
    reason: "" as ResignationReason,
    attachment: null as { name: string; uri: string } | null
  });

  const [attachment, setAttachment] = useState<{ name: string; uri: string } | null>(null);

  // UI States
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [submissionMode, setSubmissionMode] = useState<"manual" | "upload">("manual");

  // Restore submission status from storage on mount
  React.useEffect(() => {
    const checkSubmission = async () => {
      try {
        const stored = await AsyncStorage.getItem(`RESIGNATION_${session.name}`);
        if (stored) {
          const data = JSON.parse(stored);
          setSubmittedInfo(data);
          setIsSubmitted(true);
        }
      } catch (e) {
        console.error("Failed to load submission info", e);
      }
    };
    checkSubmission();
  }, [session.name]);

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
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, current: false, month: month - 1, year });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, month, year });
    }
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

  const isSelected = (day: number, month: number, year: number) => {
    if (!lastWorkingDay) return false;
    const parts = lastWorkingDay.split("/");
    if (parts.length !== 3) return false;
    const [m, d, y] = parts.map(Number);
    return d === day && m === (month + 1) && y === year;
  };

  const isFormComplete = 
    (submissionMode === "manual" ? resignationLetter.trim() !== "" : attachment !== null) && 
    lastWorkingDay !== "" && 
    reason !== "";

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });
      if (!result.canceled) {
        setAttachment({ name: result.assets[0].name, uri: result.assets[0].uri });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleRemoveDocument = () => {
    setAttachment(null);
  };

  const handleSubmit = () => {
    if (!isFormComplete) {
      Alert.alert("Missing Fields", "Please complete necessary fields before submitting.");
      return;
    }
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit your resignation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            const newResignation = {
              id: Math.random().toString(36).substr(2, 9),
              name: session.name,
              letter: resignationLetter,
              date: lastWorkingDay,
              reason: reason,
              attachment: attachment,
              type: "Resignation",
              status: "Review Required",
              submittedDate: new Date().toISOString().split("T")[0],
              department: "General", // Default as it's not in employee session usually
              position: "Associate", // Default
              initiatedBy: "Employee"
            };

            try {
              // 1. Save local status
              setSubmittedInfo({
                letter: resignationLetter,
                date: lastWorkingDay,
                reason: reason,
                attachment: attachment
              });
              setIsSubmitted(true);

              // 2. Persist for the user themselves
              await AsyncStorage.setItem(`RESIGNATION_${session.name}`, JSON.stringify({
                letter: resignationLetter,
                date: lastWorkingDay,
                reason: reason,
                attachment: attachment
              }));

              // 3. Persist for the manager see
              const existingStr = await AsyncStorage.getItem(OFFBOARDING_NOTIFICATIONS_KEY);
              const existing = existingStr ? JSON.parse(existingStr) : [];
              await AsyncStorage.setItem(OFFBOARDING_NOTIFICATIONS_KEY, JSON.stringify([newResignation, ...existing]));

              Alert.alert("Submitted", "Your resignation has been submitted to your manager and HR.");
            } catch (e) {
              Alert.alert("Error", "Failed to save resignation. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.layout}>
        {!isMobile && (
          <Sidebar
            role="staff"
            userName={session.name}
            email={session.email}
            activeScreen="Offboarding"
            navigation={navigation}
          />
        )}

        <View style={styles.mainContent}>
          {isMobile && (
            <MobileRoleMenu
              role="staff"
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
            {isSubmitted ? (
              <>
                {/* Resignation Status Stepper */}
                <View style={[styles.card, { marginTop: 0 }]}>
                  <Text style={styles.cardTitle}>Resignation Status</Text>
                  
                  <View style={styles.stepperWrap}>
                    <View style={styles.stepperLine} />
                    <View style={styles.stepperItems}>
                      <View style={styles.step}>
                        <View style={[styles.stepCircle, styles.stepCircleActive]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                        <Text style={styles.stepText}>Submitted</Text>
                      </View>
                      <View style={styles.step}>
                        <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
                        <Text style={styles.stepText}>Manager Acknowledged</Text>
                      </View>
                      <View style={styles.step}>
                        <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
                        <Text style={styles.stepText}>HR Accepted</Text>
                      </View>
                      <View style={styles.step}>
                        <View style={styles.stepCircle}><Text style={styles.stepNum}>4</Text></View>
                        <Text style={styles.stepText}>Completed</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statusInfoBox}>
                    <Text style={styles.statusInfoText}>
                      Your resignation has been submitted and is awaiting manager acknowledgment.
                    </Text>
                  </View>
                </View>

                {/* Offboarding Progress */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Offboarding Progress</Text>
                  </View>
                  <View style={styles.progressSummaryRow}>
                    <Text style={styles.progressLabel}>Overall Completion</Text>
                    <Text style={styles.progressCount}>0 of 3 items</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: "0%" }]} />
                  </View>
                </View>

                {/* Offboarding Checklist */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Offboarding Checklist</Text>
                  {[
                    { title: "Company ID Card", icon: "time-outline" },
                    { title: "Laptop Return", icon: "time-outline" },
                    { title: "Access Card Return", icon: "time-outline" }
                  ].map((item, idx) => (
                    <View key={idx} style={styles.checklistItem}>
                      <View style={styles.checklistTitleWrap}>
                        <Ionicons name={item.icon as any} size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <Text style={styles.checklistTitle}>{item.title}</Text>
                      </View>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Resignation Details Read-only */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Resignation Details</Text>
                    <Pressable onPress={() => setIsSubmitted(false)}>
                      <Text style={styles.editText}>Edit</Text>
                    </Pressable>
                  </View>
                  
                  <View style={styles.detailsGroup}>
                    <Text style={styles.detailsLabel}>Resignation Letter</Text>
                    <View style={styles.detailsLetterBox}>
                      <Text style={styles.detailsLetterText}>{submittedInfo.letter}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailsLabel}>Last Working Day</Text>
                      <View style={styles.detailsInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.detailsValText}>{submittedInfo.date}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailsLabel}>Reason for Leaving</Text>
                      <View style={styles.detailsInfoRow}>
                        <Ionicons name="newspaper-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.detailsValText}>{submittedInfo.reason}</Text>
                      </View>
                    </View>
                  </View>

                  {submittedInfo.attachment && (
                    <View style={[styles.detailsGroup, { marginTop: 16 }]}>
                      <Text style={styles.detailsLabel}>Attached Resignation Letter</Text>
                      <View style={styles.attachmentPreview}>
                        <Ionicons name="document-text-outline" size={20} color="#2563EB" />
                        <Text style={styles.attachmentName} numberOfLines={1}>{submittedInfo.attachment.name}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <GradientHero>
                  <Text style={styles.eyebrow}>Process Management</Text>
                  <Text style={styles.title}>Resignation Portal</Text>
                  <Text style={styles.subtitle}>
                    Submit your resignation and coordinate your departure process.
                  </Text>
                </GradientHero>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Resignation Details</Text>

                   {/* Mode Toggle */}
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
                     /* Resignation Letter */
                     <View style={styles.inputGroup}>
                       <Text style={styles.inputLabel}>Resignation Letter</Text>
                       <TextInput
                         style={styles.textArea}
                         placeholder="Enter your resignation letter..."
                         placeholderTextColor="#94A3B8"
                         multiline
                         numberOfLines={8}
                         textAlignVertical="top"
                         value={resignationLetter}
                         onChangeText={setResignationLetter}
                       />
                     </View>
                   ) : (
                     /* Upload File */
                     <View style={styles.inputGroup}>
                       <Text style={styles.inputLabel}>Upload Resignation Letter</Text>
                       <Pressable style={styles.dropzone} onPress={handlePickDocument}>
                         <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                         <Text style={styles.dropzoneText}>
                           {attachment ? attachment.name : "Click to upload or drag and drop"}
                         </Text>
                       </Pressable>
                       <Text style={styles.supportedFormats}>Supported formats: PDF, DOC, DOCX (Max 10MB)</Text>
                     </View>
                   )}

                  <View style={styles.formRow}>
                    {/* Last Working Day */}
                    <View style={[styles.inputGroup, { flex: 1 }]}>
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

                    {/* Reason Dropdown */}
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Reason for Leaving</Text>
                      <Pressable
                        style={styles.dropdownTrigger}
                        onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                      >
                        <Text style={styles.dropdownValue}>{reason || "Select a reason"}</Text>
                        <Ionicons name={showReasonDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                      </Pressable>
                      {showReasonDropdown && (
                        <View style={styles.dropdownMenu}>
                          {[
                            "Career Growth", 
                            "Better Opportunity", 
                            "Personal Reasons", 
                            "Relocation", 
                            "Further Education", 
                            "Health Reasons", 
                            "Other"
                          ].map((r) => (
                            <Pressable
                              key={r}
                              style={[styles.dropdownItem, reason === r && styles.dropdownItemActive]}
                              onPress={() => {
                                setReason(r as ResignationReason);
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
                    style={[styles.submitButton, !isFormComplete && styles.submitButtonDisabled]} 
                    onPress={handleSubmit}
                    disabled={!isFormComplete}
                  >
                    <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit Resignation</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Date Picker Modal */}
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
                <Ionicons name="chevron-down" size={14} color="#0F172A" />
              </View>
              <View style={styles.calendarNav}>
                <Pressable onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                  <Ionicons name="chevron-up" size={16} color="#64748B" />
                </Pressable>
                <Pressable onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>
            </View>
            <View style={styles.calendarWeekdays}>
              {daysOfWeek.map(d => <Text key={d} style={styles.weekdayText}>{d}</Text>)}
            </View>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((item, idx) => {
                const active = isSelected(item.day, item.month, item.year);
                return (
                  <Pressable
                    key={idx}
                    style={[styles.calendarDay, !item.current && styles.calendarDayInactive, active && styles.calendarDayActive]}
                    onPress={() => handleDateSelect(item.day, item.month, item.year)}
                  >
                    <Text style={[styles.calendarDayText, !item.current && styles.calendarDayTextInactive, active && styles.calendarDayTextActive]}>
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
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.85)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 120,
  },
  formRow: {
    flexDirection: "column",
    gap: 4,
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  dateInputWrap: {
    position: "relative",
  },
  dateIconPressable: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  dropdownTrigger: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    fontSize: 14,
    color: "#0F172A",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemActive: {
    backgroundColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#0F172A",
  },
  dropdownItemTextActive: {
    fontWeight: "700",
    color: "#2563EB",
  },
  submitBtn: {
    backgroundColor: "#64748B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  submitBtnActive: {
    backgroundColor: "#0F172A",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // Calendar Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calendarMonthText: { fontWeight: "700" },
  calendarYearText: { fontWeight: "700" },
  calendarNav: { flexDirection: "row", gap: 10 },
  calendarWeekdays: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  weekdayText: { width: 32, textAlign: "center", fontSize: 11, color: "#64748B" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  calendarDay: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 4, borderRadius: 4 },
  calendarDayInactive: { opacity: 0.3 },
  calendarDayActive: { backgroundColor: "#2563EB" },
  calendarDayText: { fontSize: 12 },
  calendarDayTextActive: { color: "#FFFFFF", fontWeight: "700" },
  calendarFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  footerBtnText: { color: "#3B82F6", fontWeight: "600" },

  // Post-Submission Portal Styles
  stepperWrap: {
    height: 70,
    marginTop: 20,
    marginBottom: 20,
    position: "relative",
    justifyContent: "center",
  },
  stepperLine: {
    position: "absolute",
    top: 15,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#E2E8F0",
  },
  stepperItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  step: {
    alignItems: "center",
    width: 60,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  stepText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  statusInfoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  statusInfoText: {
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
    textAlign: "center",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  progressCount: {
    fontSize: 11,
    color: "#0F172A",
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  checklistTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  pendingBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  editText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailsGroup: {
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailsLetterBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
  },
  detailsLetterText: {
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 20,
  },
  detailsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  detailsValText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
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
  submitButton: {
    backgroundColor: "#71717A",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
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
  removeAttachedBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  removeAttachedText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
});
