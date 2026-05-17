import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Pressable,
  useWindowDimensions,
  Alert,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Sidebar } from "../components/Sidebar";
import { MobileRoleMenu } from "../components/MobileRoleMenu";
import { GradientHero } from "../components/GradientHero";

type OffboardingTemplate = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  applicableFor: ("Resignation" | "Termination" | "End of Contract")[];
  checklistItems: string[];
  systemAccessItems: string[];
  hasKnowledgeTransfer: boolean;
  createdDate: string;
  lastModifiedDate: string;
};

const INITIAL_TEMPLATES: OffboardingTemplate[] = [
  {
    id: "1",
    name: "Standard Engineering Offboarding",
    description: "Default template for engineering team members including knowledge transfer and technical access revocation.",
    isDefault: true,
    isActive: true,
    applicableFor: ["Resignation", "Termination", "End of Contract"],
    checklistItems: [
      "Return company laptop and hardware",
      "Complete knowledge transfer documentation",
      "Conduct handover session with engineering team",
      "Submit final timekeeping logs",
      "Complete exit interview survey",
    ],
    systemAccessItems: [
      "GitHub Organization Access",
      "AWS / Cloud Console access",
      "Slack and corporate email",
      "Internal server VPN keys",
      "Jira & Confluence access",
    ],
    hasKnowledgeTransfer: true,
    createdDate: "2026-01-15",
    lastModifiedDate: "2026-01-10",
  },
  {
    id: "2",
    name: "Sales Team Offboarding",
    description: "Template for sales representatives with CRM and client handover requirements.",
    isDefault: false,
    isActive: true,
    applicableFor: ["Resignation", "End of Contract"],
    checklistItems: [
      "Hand over active client accounts in CRM",
      "Return company-issued phone and laptop",
      "Transfer ownership of shared spreadsheets and templates",
      "Document current sales pipeline deal status",
      "Team sync regarding remaining sales quotas",
    ],
    systemAccessItems: [
      "Salesforce CRM Account",
      "Google Workspace Access",
      "Slack profile",
      "LinkedIn Sales Navigator license",
    ],
    hasKnowledgeTransfer: true,
    createdDate: "2026-02-20",
    lastModifiedDate: "2026-03-15",
  },
  {
    id: "3",
    name: "Contractor Exit",
    description: "Simplified exit template for external contractors and temporary staff.",
    isDefault: false,
    isActive: true,
    applicableFor: ["End of Contract"],
    checklistItems: [
      "Return company temporary keycard",
      "Submit final contract invoice",
      "Revoke active temporary security tokens",
    ],
    systemAccessItems: [
      "Slack access",
      "Guest email account",
    ],
    hasKnowledgeTransfer: false,
    createdDate: "2026-03-05",
    lastModifiedDate: "2026-03-05",
  },
];

export function SystemAdminOffboardingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session = route.params?.session ?? { name: "Admin", email: "", role: "system_admin" };
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const [templates, setTemplates] = useState<OffboardingTemplate[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");

  // Modal Visibility
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OffboardingTemplate | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formApplicableFor, setFormApplicableFor] = useState<("Resignation" | "Termination" | "End of Contract")[]>([]);
  const [formChecklistItems, setFormChecklistItems] = useState<string[]>([]);
  const [formSystemAccessItems, setFormSystemAccessItems] = useState<string[]>([]);
  const [formHasKT, setFormHasKT] = useState(true);

  // Dynamic stats
  const stats = useMemo(() => {
    const total = templates.length;
    const defaults = templates.filter((t) => t.isDefault).length;
    const active = templates.filter((t) => t.isActive).length;
    const avgItems = total > 0
      ? Math.round(templates.reduce((sum, t) => sum + t.checklistItems.length, 0) / total)
      : 0;

    return { total, defaults, active, avgItems };
  }, [templates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(keyword) ||
        t.description.toLowerCase().includes(keyword) ||
        t.applicableFor.some((a) => a.toLowerCase().includes(keyword))
    );
  }, [search, templates]);

  // Form Initializers
  const openForm = (template: OffboardingTemplate | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormDescription(template.description);
      setFormIsDefault(template.isDefault);
      setFormIsActive(template.isActive);
      setFormApplicableFor(template.applicableFor);
      setFormChecklistItems([...template.checklistItems]);
      setFormSystemAccessItems([...template.systemAccessItems]);
      setFormHasKT(template.hasKnowledgeTransfer);
    } else {
      setEditingTemplate(null);
      setFormName("");
      setFormDescription("");
      setFormIsDefault(false);
      setFormIsActive(true);
      setFormApplicableFor(["Resignation"]);
      setFormChecklistItems([""]);
      setFormSystemAccessItems([""]);
      setFormHasKT(true);
    }
    setModalVisible(true);
  };

  // Form checklist item modifiers
  const handleAddChecklistItem = () => {
    setFormChecklistItems((prev) => [...prev, ""]);
  };

  const handleUpdateChecklistItem = (index: number, text: string) => {
    setFormChecklistItems((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleRemoveChecklistItem = (index: number) => {
    setFormChecklistItems((prev) => {
      if (prev.length === 1) return [""]; // Keep at least one empty box
      return prev.filter((_, i) => i !== index);
    });
  };

  // Form system access item modifiers
  const handleAddSystemAccess = () => {
    setFormSystemAccessItems((prev) => [...prev, ""]);
  };

  const handleUpdateSystemAccess = (index: number, text: string) => {
    setFormSystemAccessItems((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleRemoveSystemAccess = (index: number) => {
    setFormSystemAccessItems((prev) => {
      if (prev.length === 1) return [""]; // Keep at least one
      return prev.filter((_, i) => i !== index);
    });
  };

  // Save changes
  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert("Required Field", "Please enter a template name.");
      return;
    }
    if (!formDescription.trim()) {
      Alert.alert("Required Field", "Please enter a description.");
      return;
    }
    if (formApplicableFor.length === 0) {
      Alert.alert("Required Field", "Please select at least one applicable offboarding type.");
      return;
    }

    // Clean empty values
    const checklistItems = formChecklistItems.map((s) => s.trim()).filter(Boolean);
    const systemAccessItems = formSystemAccessItems.map((s) => s.trim()).filter(Boolean);

    if (checklistItems.length === 0) {
      Alert.alert("Required Field", "Please add at least one valid checklist item.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const updatedTemplate: OffboardingTemplate = {
      id: editingTemplate?.id ?? String(Math.random()),
      name: formName.trim(),
      description: formDescription.trim(),
      isDefault: formIsDefault,
      isActive: formIsActive,
      applicableFor: formApplicableFor,
      checklistItems,
      systemAccessItems,
      hasKnowledgeTransfer: formHasKT,
      createdDate: editingTemplate?.createdDate ?? today,
      lastModifiedDate: today,
    };

    setTemplates((prev) => {
      let next = [...prev];
      if (formIsDefault) {
        next = next.map((t) => ({ ...t, isDefault: false }));
      }
      if (editingTemplate) {
        next = next.map((t) => (t.id === editingTemplate.id ? updatedTemplate : t));
      } else {
        next.push(updatedTemplate);
      }
      return next;
    });

    setModalVisible(false);
    Alert.alert("Success", editingTemplate ? "Template updated successfully." : "Template created successfully.");
  };

  // Duplicate template
  const handleDuplicate = (template: OffboardingTemplate) => {
    const today = new Date().toISOString().split("T")[0];
    const duplicated: OffboardingTemplate = {
      ...template,
      id: String(Math.random()),
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdDate: today,
      lastModifiedDate: today,
    };
    setTemplates((prev) => [...prev, duplicated]);
    Alert.alert("Success", `Duplicated template: "${template.name}"`);
  };

  // Delete template
  const handleDelete = (template: OffboardingTemplate) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete the template "${template.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
          },
        },
      ]
    );
  };

  // Toggle checklist checkbox selections
  const toggleScenario = (type: "Resignation" | "Termination" | "End of Contract") => {
    setFormApplicableFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.layout}>
        {!isMobile && (
          <Sidebar
            role="system_admin"
            userName={session.name}
            email={session.email}
            activeScreen="Offboarding"
            navigation={navigation}
          />
        )}

        <View style={styles.mainContent}>
          {isMobile && (
            <MobileRoleMenu
              role="system_admin"
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
            {/* Header banner */}
            <GradientHero style={styles.heroCard}>
              <Text style={[styles.eyebrow, { color: "rgba(255,255,255,0.75)" }]}>System Administration</Text>
              <Text style={[styles.title, { color: "#FFFFFF" }]}>Offboarding Management</Text>
              <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.78)" }]}>
                Configure and audit checklist templates, company resource handovers, and system access lifecycles.
              </Text>
            </GradientHero>

            {/* Dyn stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Templates</Text>
                <Text style={styles.summaryValue}>{stats.total}</Text>
                <Text style={styles.summaryHelper}>System configurations</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Default Templates</Text>
                <Text style={styles.summaryValue}>{stats.defaults}</Text>
                <Text style={styles.summaryHelper}>Primary exit profiles</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Active Templates</Text>
                <Text style={styles.summaryValue}>{stats.active}</Text>
                <Text style={styles.summaryHelper}>Operational pathways</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Avg. Checklist Items</Text>
                <Text style={styles.summaryValue}>{stats.avgItems}</Text>
                <Text style={styles.summaryHelper}>Task load per exit</Text>
              </View>
            </View>

            {/* List section */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Templates</Text>
                <Pressable
                  style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => openForm(null)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.createBtnText}>Create Template</Text>
                </Pressable>
              </View>

              {/* Search box */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search templates by name, rules, or scenarios..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
              </View>

              {filteredTemplates.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {templates.length === 0
                      ? "No offboarding templates configured. Tap 'Create Template' to start."
                      : "No matching templates found."}
                  </Text>
                </View>
              ) : (
                filteredTemplates.map((template) => (
                  <View key={template.id} style={styles.templateCard}>
                    {/* Top layout */}
                    <View style={styles.templateHeader}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        {template.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        {!template.isActive && (
                          <View style={[styles.defaultBadge, { backgroundColor: "#64748B" }]}>
                            <Text style={styles.defaultBadgeText}>Inactive</Text>
                          </View>
                        )}
                      </View>

                      {/* Control panel */}
                      <View style={styles.actionsPanel}>
                        <Pressable
                          style={({ pressed }) => [styles.actionIconButton, pressed && { opacity: 0.7 }]}
                          onPress={() => openForm(template)}
                        >
                          <Feather name="edit-2" size={15} color="#475569" />
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.actionIconButton, pressed && { opacity: 0.7 }]}
                          onPress={() => handleDuplicate(template)}
                        >
                          <MaterialCommunityIcons name="content-copy" size={15} color="#475569" />
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.actionIconButton, pressed && { opacity: 0.7 }]}
                          onPress={() => handleDelete(template)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Desc */}
                    <Text style={styles.templateDesc}>{template.description}</Text>

                    {/* Applicable For */}
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Applicable for:</Text>
                      <View style={styles.pillRow}>
                        {template.applicableFor.map((app) => {
                          let colorStyle = styles.resignationPill;
                          if (app === "Termination") colorStyle = styles.terminationPill;
                          if (app === "End of Contract") colorStyle = styles.contractPill;

                          return (
                            <View key={app} style={[styles.pill, colorStyle.bg]}>
                              <Text style={[styles.pillText, colorStyle.text]}>{app}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Features */}
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Features:</Text>
                      <View style={styles.pillRow}>
                        <View style={[styles.pill, styles.featureChecklist.bg]}>
                          <Text style={[styles.pillText, styles.featureChecklist.text]}>
                            {template.checklistItems.length} Checklist items
                          </Text>
                        </View>
                        <View style={[styles.pill, styles.featureAccess.bg]}>
                          <Text style={[styles.pillText, styles.featureAccess.text]}>
                            {template.systemAccessItems.length} System Access
                          </Text>
                        </View>
                        {template.hasKnowledgeTransfer && (
                          <View style={[styles.pill, styles.featureKT.bg]}>
                            <Text style={[styles.pillText, styles.featureKT.text]}>Knowledge Transfer</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.templateFooter}>
                      <Text style={styles.footerTimestamp}>
                        Created: {template.createdDate}  •  Last Modified: {template.lastModifiedDate}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* DYNAMIC FORM MODAL (HIGH FIDELITY PROTO-MATCH) */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Form Title banner */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitleText}>
                    {editingTemplate ? "Edit Template" : "Create New Template"}
                  </Text>
                  <Text style={styles.modalSubtitleText}>
                    Configure the template settings and checklist items
                  </Text>
                </View>
                <Pressable style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalFormContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Template Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Template Name *</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g., Standard Engineer Offboarding"
                    placeholderTextColor="#94A3B8"
                    style={styles.formInput}
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="Describe when this template should be used..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    style={[styles.formInput, { height: 72, textAlignVertical: "top", paddingTop: 8 }]}
                  />
                </View>

                {/* Applicable Scenarios */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Applicable Offboarding Types *</Text>
                  <View style={styles.checkboxRow}>
                    {(["Resignation", "Termination", "End of Contract"] as const).map((sc) => {
                      const isChecked = formApplicableFor.includes(sc);
                      return (
                        <Pressable
                          key={sc}
                          style={styles.formCheckRow}
                          onPress={() => toggleScenario(sc)}
                        >
                          <Ionicons
                            name={isChecked ? "checkbox" : "square-outline"}
                            size={18}
                            color={isChecked ? "#2563EB" : "#64748B"}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.checkText, isChecked && styles.checkTextActive]}>
                            {sc}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Switch Actions */}
                <View style={styles.formGroup}>
                  <Pressable
                    style={styles.formCheckRowInline}
                    onPress={() => setFormIsDefault(!formIsDefault)}
                  >
                    <Ionicons
                      name={formIsDefault ? "checkbox" : "square-outline"}
                      size={18}
                      color={formIsDefault ? "#2563EB" : "#64748B"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.checkTextInline, formIsDefault && styles.checkTextActive]}>
                      Set as default template
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.formCheckRowInline, { marginTop: 10 }]}
                    onPress={() => setFormHasKT(!formHasKT)}
                  >
                    <Ionicons
                      name={formHasKT ? "checkbox" : "square-outline"}
                      size={18}
                      color={formHasKT ? "#2563EB" : "#64748B"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.checkTextInline, formHasKT && styles.checkTextActive]}>
                      Require knowledge transfer sign-off
                    </Text>
                  </Pressable>

                  <View style={[styles.formCheckRowInline, { marginTop: 10, justifyContent: "space-between" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons
                        name={formIsActive ? "checkmark-circle-outline" : "ellipse-outline"}
                        size={18}
                        color={formIsActive ? "#16A34A" : "#64748B"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.checkTextInline, formIsActive && { color: "#16A34A", fontWeight: "700" }]}>
                        Active Status
                      </Text>
                    </View>
                    <Switch
                      value={formIsActive}
                      onValueChange={setFormIsActive}
                      trackColor={{ false: "#CBD5E1", true: "#BBF7D0" }}
                      thumbColor={formIsActive ? "#16A34A" : "#F1F5F9"}
                    />
                  </View>
                </View>

                <View style={styles.dividerLine} />

                {/* Checklist Items list section */}
                <View style={styles.formGroup}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.formLabel}>Checklist Items *</Text>
                    <Pressable
                      style={({ pressed }) => [styles.listAddBtn, pressed && { opacity: 0.7 }]}
                      onPress={handleAddChecklistItem}
                    >
                      <Ionicons name="add" size={14} color="#2563EB" style={{ marginRight: 2 }} />
                      <Text style={styles.listAddBtnText}>Add Item</Text>
                    </Pressable>
                  </View>

                  {formChecklistItems.map((item, index) => (
                    <View key={`checklist-${index}`} style={styles.listItemRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#2563EB"
                        style={{ marginRight: 8, marginTop: 12 }}
                      />
                      <TextInput
                        value={item}
                        onChangeText={(text) => handleUpdateChecklistItem(index, text)}
                        placeholder="e.g., Return company laptop"
                        placeholderTextColor="#94A3B8"
                        style={styles.listItemInput}
                      />
                      <Pressable
                        style={styles.listItemRemoveBtn}
                        onPress={() => handleRemoveChecklistItem(index)}
                      >
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.dividerLine} />

                {/* System Access list section */}
                <View style={styles.formGroup}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.formLabel}>System Access to Revoke</Text>
                    <Pressable
                      style={({ pressed }) => [styles.listAddBtn, pressed && { opacity: 0.7 }]}
                      onPress={handleAddSystemAccess}
                    >
                      <Ionicons name="add" size={14} color="#2563EB" style={{ marginRight: 2 }} />
                      <Text style={styles.listAddBtnText}>Add System</Text>
                    </Pressable>
                  </View>

                  {formSystemAccessItems.map((item, index) => (
                    <View key={`system-${index}`} style={styles.listItemRow}>
                      <Ionicons
                        name="key-outline"
                        size={17}
                        color="#0284C7"
                        style={{ marginRight: 8, marginTop: 12 }}
                      />
                      <TextInput
                        value={item}
                        onChangeText={(text) => handleUpdateSystemAccess(index, text)}
                        placeholder="e.g., Email, VPN, Database"
                        placeholderTextColor="#94A3B8"
                        style={styles.listItemInput}
                      />
                      <Pressable
                        style={styles.listItemRemoveBtn}
                        onPress={() => handleRemoveSystemAccess(index)}
                      >
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </Pressable>
                    </View>
                  ))}
                </View>

              </ScrollView>

              {/* Action layout footer */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.85 }
                  ]}
                  onPress={handleSave}
                >
                  <Ionicons name="document-text-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    {editingTemplate ? "Save Changes" : "Create Template"}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F1F5F9" },
  layout: { flex: 1, flexDirection: "row", backgroundColor: "#F1F5F9" },
  mainContent: { flex: 1, backgroundColor: "#F1F5F9" },
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 20, padding: 20, marginBottom: 16,
  },
  eyebrow: { fontSize: 12, fontWeight: "800", color: "#2563EB", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#64748B" },

  // Stats
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    minWidth: "45%",
    flex: 1,
  },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8 },
  summaryValue: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  summaryHelper: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },

  // Templates Container
  card: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 20, padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  // Search box
  searchBox: {
    height: 46, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 14,
    backgroundColor: "#F8FAFC", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 14 },

  // Template List Items
  templateCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  templateName: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginRight: 8 },
  defaultBadge: {
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "center",
    marginRight: 6,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: "700", color: "#334155" },
  templateDesc: { fontSize: 13, lineHeight: 19, color: "#64748B", marginBottom: 12 },
  detailsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailsLabel: {
    width: 95,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  pillRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: "700" },

  resignationPill: { bg: { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }, text: { color: "#D97706" } },
  terminationPill: { bg: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }, text: { color: "#DC2626" } },
  contractPill:    { bg: { backgroundColor: "#F3E8FF", borderColor: "#E9D5FF" }, text: { color: "#7C3AED" } },

  featureChecklist: { bg: { backgroundColor: "#CCFBF1", borderColor: "#99F6E4" }, text: { color: "#0D9488" } },
  featureAccess:    { bg: { backgroundColor: "#E0F2FE", borderColor: "#BAE6FD" }, text: { color: "#0284C7" } },
  featureKT:        { bg: { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0" }, text: { color: "#059669" } },

  actionsPanel: {
    flexDirection: "row",
    gap: 6,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  templateFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 8,
    marginTop: 4,
  },
  footerTimestamp: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: { color: "#94A3B8", fontSize: 13, textAlign: "center" },

  // Modal Structure
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitleText: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 3 },
  modalSubtitleText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  modalFormContent: {
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#0F172A",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  // Checkboxes
  checkboxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  formCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  checkTextActive: { color: "#2563EB", fontWeight: "700" },

  formCheckRowInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  checkTextInline: { fontSize: 13, color: "#475569", fontWeight: "600" },

  // List Management (Checklists & Systems)
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
  },
  listAddBtnText: { fontSize: 12, color: "#2563EB", fontWeight: "700" },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#0F172A",
    fontSize: 13,
    backgroundColor: "#FFFFFF",
  },
  listItemRemoveBtn: {
    padding: 8,
    marginLeft: 2,
  },

  // Actions
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
    gap: 12,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: "#334155", // matching web dark grey slate color
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#334155", fontSize: 14, fontWeight: "700" },
});
