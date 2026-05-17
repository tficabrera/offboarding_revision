import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Pressable,
  useWindowDimensions,
  Modal,
  Alert,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Sidebar } from "../components/Sidebar";
import { MobileRoleMenu } from "../components/MobileRoleMenu";
import { Header } from "../components/Header";
import { GradientHero } from "../components/GradientHero";
import { MetricCard } from "../components/MetricCard";
import { Colors } from "../constants/colors";

export function HROfficerOffboardingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session = route.params?.session ?? {
    name: "HR Officer",
    email: "",
    role: "hr",
  };
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const OFFBOARDING_NOTIFICATIONS_KEY = "dummy_offboarding_notifications";

  // View Toggle
  const [showInitiateForm, setShowInitiateForm] = useState(false);

  // Form States
  const [offboardingType, setOffboardingType] = useState("Termination");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [terminationDetails, setTerminationDetails] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [reason, setReason] = useState("");
  const [submissionMode, setSubmissionMode] = useState<"manual" | "upload">("manual");
  const [evidenceFile, setEvidenceFile] = useState<any>(null);

  // Data State
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedOffboarding, setSelectedOffboarding] = useState<any>(null);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<string | null>(null);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);

  // Pay States
  const [salaryBalance, setSalaryBalance] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [additionalPay, setAdditionalPay] = useState("0");

  const totalPay = (
    parseFloat(salaryBalance || "0") -
    parseFloat(deductions || "0") +
    parseFloat(additionalPay || "0")
  ).toFixed(2);

  // Access States
  const [accessRevoked, setAccessRevoked] = useState({
    email: false,
    vpn: false,
    db: false,
    apps: false,
    cloud: false
  });

  // UI States
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const loadRequests = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFBOARDING_NOTIFICATIONS_KEY);
      if (stored) {
        setRequests(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Error loading requests", e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [])
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
    employeeName.trim() !== "" &&
    department.trim() !== "" &&
    position.trim() !== "" &&
    lastWorkingDay.trim() !== "" &&
    reason !== "" &&
    (submissionMode === "manual" ? terminationDetails.trim() !== "" : evidenceFile !== null);

  const resetForm = () => {
    setEmployeeName("");
    setDepartment("");
    setPosition("");
    setTerminationDetails("");
    setLastWorkingDay("");
    setReason("");
    setEvidenceFile(null);
    setShowInitiateForm(false);
  };

  const handlePickEvidence = () => {
    // Mock file picker
    setEvidenceFile({ name: "evidence_doc.pdf", size: "1.2MB" });
  };

  const handleInitiate = () => {
    Alert.alert(
      "Confirm Initiation",
      `Are you sure you want to initiate ${offboardingType.toLowerCase()} for ${employeeName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            const newRequest = {
              id: Date.now().toString(),
              name: employeeName,
              department: department,
              type: offboardingType,
              date: new Date().toISOString().split("T")[0],
              status: "Pending Review",
              position: position,
              reason: reason,
              initiatedBy: "HR",
              termDetails: terminationDetails
            };
            
            try {
              const updatedRequests = [newRequest, ...requests];
              setRequests(updatedRequests);
              await AsyncStorage.setItem(OFFBOARDING_NOTIFICATIONS_KEY, JSON.stringify(updatedRequests));
              
              Alert.alert("Success", "Offboarding process has been initiated.");
              setShowInitiateForm(false);
              resetForm();
            } catch (e) {
              Alert.alert("Error", "Failed to save offboarding request.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateRequestStatus = async (id: string, newStatus: string) => {
    try {
      const updatedRequests = requests.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      );
      setRequests(updatedRequests);
      await AsyncStorage.setItem(OFFBOARDING_NOTIFICATIONS_KEY, JSON.stringify(updatedRequests));
      Alert.alert("Success", `Request marked as ${newStatus}.`);
    } catch (e) {
      Alert.alert("Error", "Failed to update request status.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.layout}>
        {!isMobile && (
          <Sidebar
            role="hr"
            userName={session.name}
            email={session.email}
            activeScreen="Offboarding"
            navigation={navigation}
          />
        )}

        <View style={styles.mainContent}>
          {isMobile ? (
            <MobileRoleMenu
              role="hr"
              userName={session.name}
              email={session.email}
              activeScreen="Offboarding"
              navigation={navigation}
            />
          ) : (
            <Header role="hr" userName={session.name} />
          )}

          {/* Initiation Modal */}
          <Modal
            visible={showInitiateForm}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.initiateModalHeader}>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.cancelBtn} onPress={resetForm}>
                  <View style={styles.cancelBtnContent}>
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ transform: [{ rotate: "45deg" }] }} />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </View>
                </Pressable>
              </View>

              <ScrollView
                style={styles.initiateModalScroll}
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
                      <View style={styles.dropdownMenuStyle}>
                        {["Termination", "End of Contract"].map((t) => (
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
                        value={terminationDetails}
                        onChangeText={setTerminationDetails}
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
                                setReason(r);
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
                    style={[styles.initiateActionBtn, !isFormComplete && styles.initiateActionBtnDisabled]}
                    onPress={handleInitiate}
                    disabled={!isFormComplete}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.initiateActionBtnText}>Initiate Offboarding</Text>
                  </Pressable>
                </View>
              </ScrollView>

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
                    <View style={styles.calendarHeaderWrap}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.calendarMonthText}>{months[viewDate.getMonth()]}</Text>
                        <Text style={styles.calendarYearText}>{viewDate.getFullYear()}</Text>
                      </View>
                      <View style={styles.calendarNav}>
                        <Pressable onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                          <Ionicons name="chevron-back" size={18} color="#64748B" />
                        </Pressable>
                        <Pressable onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                          <Ionicons name="chevron-forward" size={18} color="#64748B" />
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
                  </View>
                </Pressable>
              </Modal>

            </SafeAreaView>
          </Modal>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <GradientHero style={styles.hero}>
              <View style={styles.heroContent}>
                <View style={styles.heroTextContent}>
                  <Text style={styles.eyebrow}>HR Portal</Text>
                  <Text style={styles.title}>Offboarding Management</Text>
                  <Text style={styles.subtitle}>
                    Track and manage employee exit processes and final settlements.
                  </Text>
                </View>
                <Pressable
                  style={styles.initiateBtn}
                  onPress={() => setShowInitiateForm(true)}
                >
                  <Ionicons name="add" size={20} color="#0F172A" />
                  <Text style={styles.initiateBtnText}>Initiate Offboarding</Text>
                </Pressable>
              </View>
            </GradientHero>

            {/* Metrics Row */}
            <ScrollView 
              horizontal={isMobile} 
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
              contentContainerStyle={{ gap: 12, paddingRight: isMobile ? 20 : 0 }}
            >
              <View style={isMobile ? { width: 160 } : styles.metricWrapper}>
                <MetricCard
                  label="Total Offboarding"
                  value="0"
                  sub="Active cases"
                  icon={<Ionicons name="time-outline" size={18} color="#3B82F6" />}
                />
              </View>
              <View style={isMobile ? { width: 160 } : styles.metricWrapper}>
                <MetricCard
                  label="Completed"
                  value="0"
                  sub="All time"
                  icon={<Ionicons name="checkmark-outline" size={18} color="#22C55E" />}
                />
              </View>
              <View style={isMobile ? { width: 160 } : styles.metricWrapper}>
                <MetricCard
                  label="Pending Review"
                  value={String(requests.length)}
                  sub="Require action"
                  alert
                  icon={<Ionicons name="warning-outline" size={18} color="#F59E0B" />}
                />
              </View>
            </ScrollView>

            {/* Incoming Requests */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Incoming Offboarding Requests</Text>
              {requests.length > 0 ? (
                <View>
                  {requests.map((req) => (
                    <Pressable 
                      key={req.id} 
                      style={[styles.requestItem, selectedOffboarding?.id === req.id && styles.requestItemActive]}
                      onPress={() => setSelectedOffboarding(req)}
                    >
                      <View style={{ flex: 2 }}>
                        <Text style={styles.reqName}>{req.name}</Text>
                        <Text style={styles.reqDept}>{req.department}</Text>
                      </View>
                      <View style={{ flex: 1.5, alignItems: "center" }}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{req.type}</Text>
                        </View>
                        <Text style={styles.reqDate}>{req.date}</Text>
                      </View>
                      <View style={{ flex: 1.5, alignItems: "center" }}>
                        <View style={styles.statusBadgeAmber}>
                          <Text style={styles.statusBadgeTextAmber}>{req.status}</Text>
                        </View>
                      </View>
                      <View style={styles.actionIcons}>
                        <Pressable 
                          style={styles.iconBtnCheck}
                          onPress={() => handleUpdateRequestStatus(req.id, "HR Approved")}
                        >
                          <Ionicons name="checkmark" size={16} color="#166534" />
                        </Pressable>
                        <Pressable 
                          style={styles.iconBtnClose}
                          onPress={() => handleUpdateRequestStatus(req.id, "HR Rejected")}
                        >
                          <Ionicons name="close" size={16} color="#991B1B" />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No pending requests</Text>
                </View>
              )}
            </View>

            {/* Selected Employee Details */}
            {selectedOffboarding && (
              <View style={styles.sectionCard}>
                <View style={[styles.cardHeader, { justifyContent: "space-between", marginBottom: 16 }]}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Selected Employee</Text>
                  <View style={[styles.statusBadgeAmber, { backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" }]}>
                    <Text style={[styles.statusBadgeTextAmber, { color: "#1D4ED8" }]}>In Progress</Text>
                  </View>
                </View>

                <View style={[styles.topRowDetails, isMobile && { flexDirection: "column" }]}>
                  <View style={[styles.detailBox, isMobile && { borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }]}>
                    <Text style={styles.detailBoxLabel}>Employee</Text>
                    <Text style={styles.detailBoxVal}>{selectedOffboarding.name}</Text>
                  </View>
                  <View style={[styles.detailBox, isMobile && { borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }]}>
                    <Text style={styles.detailBoxLabel}>Department</Text>
                    <Text style={styles.detailBoxVal}>{selectedOffboarding.department || "Engineering"}</Text>
                  </View>
                  <View style={[styles.detailBox, isMobile && { borderRightWidth: 0 }]}>
                    <Text style={styles.detailBoxLabel}>Type</Text>
                    <Text style={styles.detailBoxVal}>{selectedOffboarding.type}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Management Row */}
            <View style={[styles.dualRow, isMobile && { flexDirection: "column" }]}>
              <View style={styles.halfCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="key-outline" size={18} color="#F97316" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>System Access Revocation</Text>
                </View>
                {!selectedOffboarding ? (
                  <View style={styles.emptyStateSmall}>
                    <Text style={styles.emptyStateTextSmall}>Select an employee to manage access</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {[
                      { key: "email", label: "Email" },
                      { key: "vpn", label: "VPN" },
                      { key: "db", label: "Database" },
                      { key: "apps", label: "Internal Applications" },
                      { key: "cloud", label: "Cloud Storage" }
                    ].map((svc) => (
                      <View key={svc.key} style={styles.accessRow}>
                        <Text style={styles.accessLabel}>{svc.label}</Text>
                        <Pressable 
                          style={[styles.revokeBtn, accessRevoked[svc.key as keyof typeof accessRevoked] && styles.revokeBtnActive]}
                          onPress={() => setAccessRevoked(prev => ({ ...prev, [svc.key]: !prev[svc.key as keyof typeof prev] }))}
                        >
                          <Text style={[styles.revokeBtnText, accessRevoked[svc.key as keyof typeof accessRevoked] && styles.revokeBtnTextActive]}>
                            {accessRevoked[svc.key as keyof typeof accessRevoked] ? "Revoked" : "Revoke"}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                    <View style={styles.infoAlertBlue}>
                      <Text style={styles.infoAlertBlueText}>Revoke system access immediately to disable employee access to critical systems.</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.halfCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="currency-usd" size={18} color="#22C55E" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Final Pay</Text>
                </View>
                {!selectedOffboarding ? (
                  <View style={styles.emptyStateSmall}>
                    <Text style={styles.emptyStateTextSmall}>Accept offboarding to manage final pay</Text>
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={styles.inputLabel}>Salary Balance</Text>
                      <TextInput 
                        style={styles.formInput} 
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={salaryBalance}
                        onChangeText={setSalaryBalance}
                      />
                    </View>
                    <View>
                      <Text style={styles.inputLabel}>Deductions</Text>
                      <TextInput 
                        style={styles.formInput} 
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={deductions}
                        onChangeText={setDeductions}
                      />
                    </View>
                    <View>
                      <Text style={styles.inputLabel}>Additional Pay</Text>
                      <TextInput 
                        style={styles.formInput} 
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={additionalPay}
                        onChangeText={setAdditionalPay}
                      />
                    </View>
                    <View style={styles.totalPayRow}>
                      <Text style={styles.totalPayLabel}>Total Amount</Text>
                      <Text style={styles.totalPayValue}>${totalPay}</Text>
                    </View>
                    <View style={styles.paymentPendingRow}>
                      <Text style={styles.paymentPendingLabel}>Payment Pending</Text>
                      <Text style={styles.paymentPendingValue}>${totalPay}</Text>
                    </View>
                    <Pressable style={styles.releasePaymentBtn}>
                      <Text style={styles.releasePaymentBtnText}>Release Payment</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Knowledge Transfer Sign-Off (NEW) */}
            <View style={styles.sectionCard}>
              <View style={[styles.cardHeader, { marginBottom: 16 }]}>
                <Ionicons name="document-text" size={18} color="#A855F7" style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Knowledge Transfer Sign-Off</Text>
              </View>
              <View style={styles.warningAlertYellow}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="time-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
                  <Text style={styles.warningAlertYellowTitle}>Pending Manager Sign-Off</Text>
                </View>
                <Text style={styles.warningAlertYellowSub}>Waiting for the manager to complete and sign off on knowledge transfer process.</Text>
              </View>
            </View>

            {/* Checklist Verification */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Checklist Verification</Text>
              {requests.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {[
                    "Company ID Card",
                    "Laptop Return",
                    "Knowledge Transfer Document",
                    "Exit Interview Scheduled",
                    "Access Card Return"
                  ].map((item, i) => (
                    <View key={i} style={styles.checkRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkEmpName}>{selectedOffboarding ? selectedOffboarding.name : requests[0].name}</Text>
                        <Text style={styles.checkItemName}>{item}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={styles.statusBadgeYellowPill}>
                          <Text style={styles.statusBadgeTextYellowPill}>Pending Review</Text>
                        </View>
                        <Pressable 
                          style={styles.outlinedViewBtn}
                          onPress={() => {
                            setSelectedChecklistItem(item);
                            setIsItemModalVisible(true);
                          }}
                        >
                          <Ionicons name="eye-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                          <Text style={styles.outlinedViewBtnText}>View</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No checklist items to verify</Text>
                </View>
              )}
            </View>

            {/* Offboarding Overview */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Offboarding Overview</Text>
              {!selectedOffboarding ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No active offboarding cases</Text>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View>
                      <Text style={styles.detailBoxLabel}>{selectedOffboarding.name}</Text>
                      <Text style={styles.detailBoxVal}>{selectedOffboarding.department}</Text>
                    </View>
                    <View style={[styles.statusBadgeAmber, { backgroundColor: "#DBEAFE", borderColor: "#BFDBFE", alignSelf: "flex-end" }]}>
                      <Text style={[styles.statusBadgeTextAmber, { color: "#1D4ED8" }]}>In Progress</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={styles.emptyStateTextSmall}>Progress</Text>
                    <Text style={styles.emptyStateTextSmall}>0 of 5 items (0%)</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarFill} />
                  </View>
                </View>
              )}
            </View>

            {/* Clearance Certificate */}
            <View style={styles.sectionCard}>
              <View style={[styles.cardHeader, { marginBottom: 16 }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Clearance Certificate</Text>
              </View>
              <View style={styles.warningAlertYellow}>
                <Text style={styles.warningAlertYellowSub}>Complete all checklist items and release final pay to generate clearance.</Text>
              </View>
              
              <View style={styles.clearanceBox}>
                <Text style={styles.clearanceBoxText}>
                  This is to certify that <Text style={{ fontWeight: "800" }}>{selectedOffboarding ? selectedOffboarding.name : "Current User"}</Text>, Software Engineer from the {selectedOffboarding?.department || "Engineering"} department, has completed all offboarding requirements and returned all company property. All financial obligations have been settled.
                </Text>
              </View>

              <Pressable style={styles.disabledBtnFull}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.disabledBtnFullText}>Generate Clearance</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Checklist Item Details Modal */}
      <Modal
        transparent
        visible={isItemModalVisible}
        animationType="slide"
        onRequestClose={() => setIsItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checklist Item Details</Text>
              <Pressable onPress={() => setIsItemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.modalScroll}>
              {/* Employee Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Employee</Text>
                <Text style={styles.detailValue}>{requests[0]?.name || "John Doe"}</Text>
              </View>

              {/* Item Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Checklist Item</Text>
                <Text style={styles.detailValue}>{selectedChecklistItem || "Company ID Card"}</Text>
              </View>

              {/* Status Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadgeAmber}>
                  <Text style={styles.statusBadgeTextAmber}>Pending Review</Text>
                </View>
              </View>

              {/* Note Alert */}
              <View style={styles.noteAlert}>
                <Text style={styles.noteText}>
                  <Text style={{ fontWeight: "800" }}>Note:</Text> Employee has not yet submitted proof for this item.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgApp,
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
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 20,
    marginBottom: 20,
  },
  heroContent: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  heroTextContent: {
    flex: 1,
    minWidth: 200,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  initiateBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  initiateBtnText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  metricsRowVertical: {
    flexDirection: "column",
  },
  metricWrapper: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  dualRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  verticalRow: {
    flexDirection: "column",
  },
  halfCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateSmall: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTextSmall: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Form Styles
  formContainer: {
    marginTop: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  formTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  formInputCustom: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 100,
    textAlignVertical: "top",
  },
  dropdownTrigger: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#0F172A",
  },
  initiateSubmitBtn: {
    backgroundColor: "#E11D48",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  initiateSubmitBtnText: {
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
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  calendarHeaderWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarMonthText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  calendarYearText: { fontSize: 16, fontWeight: "500", color: "#64748B", marginLeft: 4 },
  calendarNav: { flexDirection: "row", gap: 15 },
  calendarWeekdays: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  weekdayText: { width: 32, textAlign: "center", fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  calendarDay: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 6, borderRadius: 8 },
  calendarDayInactive: { opacity: 0.2 },
  calendarDayActive: { backgroundColor: "#0F172A" },
  calendarDayText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  calendarDayTextActive: { color: "#FFFFFF" },

  // Dynamic Styles
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  reqName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  reqDept: { fontSize: 11, color: "#64748B", marginTop: 2 },
  reqDate: { fontSize: 10, color: "#94A3B8", marginTop: 4 },
  typeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeBadgeText: { fontSize: 10, fontWeight: "600", color: "#64748B" },
  statusBadgeAmber: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  statusBadgeTextAmber: { fontSize: 10, fontWeight: "700", color: "#B45309" },
  actionIcons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  iconBtnCheck: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  checkEmpName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  checkItemName: { fontSize: 11, color: "#64748B", marginTop: 1 },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewBtnText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },

  // Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalScroll: {
    gap: 16,
  },
  detailSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  noteAlert: {
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },

  // Redesigned Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  initiateModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cancelBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
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
  initiateModalScroll: {
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
  dropdownMenuStyle: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItemActive: {
    backgroundColor: "#3B82F6",
  },
  dropdownItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 20,
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
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },
  supportedFormats: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
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
  dateInputWrap: {
    position: "relative",
  },
  dateIconPressable: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  initiateActionBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  initiateActionBtnDisabled: {
    backgroundColor: "#334155",
  },
  initiateActionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  topRowDetails: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
  },
  detailBox: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  detailBoxLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailBoxVal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  inputGroupCol: {
    flex: 1,
  },
  accessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  accessLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  revokeBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  revokeBtnActive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  revokeBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  revokeBtnTextActive: {
    color: "#94A3B8",
  },
  infoAlertBlue: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoAlertBlueText: {
    color: "#0369A1",
    fontSize: 12,
    lineHeight: 16,
  },
  totalPayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalPayLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  totalPayValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentPendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FEF9C3",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  paymentPendingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#854D0E",
  },
  paymentPendingValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#854D0E",
  },
  releasePaymentBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  releasePaymentBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  warningAlertYellow: {
    backgroundColor: "#FEFCE8",
    borderWidth: 1,
    borderColor: "#FEF08A",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningAlertYellowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  warningAlertYellowSub: {
    fontSize: 12,
    color: "#A16207",
    lineHeight: 18,
  },
  statusBadgeYellowPill: {
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEF08A",
  },
  statusBadgeTextYellowPill: {
    color: "#A16207",
    fontSize: 11,
    fontWeight: "700",
  },
  outlinedViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outlinedViewBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    width: "0%",
    backgroundColor: "#3B82F6",
    height: "100%",
  },
  clearanceBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearanceBoxText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
    textAlign: "center",
  },
  disabledBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#94A3B8",
    paddingVertical: 14,
    borderRadius: 8,
  },
  disabledBtnFullText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
