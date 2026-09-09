import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const ACCENT = "#0095F6";
export const DANGER = "#ED4956";

export function Page({ children, title, onBack, scroll = true, loading = false }) {
  const body = loading ? <PageLoading /> : children;
  return (
    <View style={styles.page}>
      {title ? (
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpace} />
        </View>
      ) : null}
      {scroll ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
    </View>
  );
}

export function PageLoading({ text = "Loading settings..." }) {
  return <View style={styles.loading}><ActivityIndicator size="small" color={ACCENT} /><Text style={styles.loadingText}>{text}</Text></View>;
}

export function InfoCard({ icon = "settings-outline", title, text }) {
  return (
    <View style={styles.infoBlock}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={27} color="#111" /></View>
      <Text style={styles.infoTitle}>{title}</Text>
      {text ? <Text style={styles.infoText}>{text}</Text> : null}
    </View>
  );
}

export function SettingItem({ title, subtitle, icon, onPress, danger = false, right }) {
  const content = (
    <>
      {icon ? <View style={styles.itemIcon}><Ionicons name={icon} size={20} color={danger ? DANGER : "#111"} /></View> : null}
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, danger && styles.danger]}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      {right || (onPress ? <Ionicons name="chevron-forward" size={18} color="#B5B5B5" /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} accessibilityRole="button">{content}</Pressable>;
}

export function SwitchRow({ title, subtitle, value, onChange, disabled = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.itemContent}><Text style={styles.itemTitle}>{title}</Text>{subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}</View>
      <Switch value={Boolean(value)} onValueChange={onChange} disabled={disabled} trackColor={{ false: "#E5E5E5", true: ACCENT }} thumbColor="#fff" ios_backgroundColor="#E5E5E5" />
    </View>
  );
}

export function ChoiceSettings({ title, options, selected, onSelect }) {
  return <View>{title ? <Text style={styles.choiceTitle}>{title}</Text> : null}{options.map((option) => (
    <Pressable key={option} onPress={() => onSelect(option)} style={styles.choiceRow}>
      <Text style={[styles.itemTitle, selected === option && styles.choiceSelected]}>{option}</Text>
      <Ionicons name={selected === option ? "radio-button-on" : "radio-button-off"} size={22} color={selected === option ? ACCENT : "#C7C7C7"} />
    </Pressable>
  ))}</View>;
}

export function PrimaryButton({ text, onPress, disabled = false, danger = false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, danger && styles.dangerButton, disabled && styles.disabledButton]}><Text style={styles.buttonText}>{text}</Text></Pressable>;
}

export function TextField({ label, value, onChangeText, placeholder, multiline = false, ...props }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#999" multiline={multiline} style={[styles.input, multiline && styles.multiline]} {...props} /></View>;
}

export function SectionHeading({ children }) { return <Text style={styles.sectionHeading}>{children}</Text>; }

export function Notice({ children, tone = "neutral" }) {
  return <View style={[styles.notice, tone === "danger" && styles.noticeDanger, tone === "success" && styles.noticeSuccess]}><Text style={styles.noticeText}>{children}</Text></View>;
}

export function ErrorText({ children }) { return <Text style={styles.errorText}>{children}</Text>; }

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  header: { height: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFEFEF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerSpace: { width: 40 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  infoBlock: { alignItems: "center", paddingVertical: 10, paddingBottom: 24 },
  infoIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  infoTitle: { fontSize: 20, fontWeight: "700", color: "#111", textAlign: "center" },
  infoText: { marginTop: 6, color: "#777", fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  row: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFEFEF", flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowPressed: { opacity: 0.55 },
  itemIcon: { width: 34, alignItems: "center", justifyContent: "center", marginRight: 4 },
  itemContent: { flex: 1, paddingRight: 12 },
  itemTitle: { fontSize: 15, color: "#111", fontWeight: "500" },
  itemSubtitle: { marginTop: 4, fontSize: 12.5, lineHeight: 18, color: "#777" },
  danger: { color: DANGER },
  sectionHeading: { marginTop: 18, marginBottom: 8, fontSize: 12, color: "#777", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  choiceTitle: { marginBottom: 8, color: "#777", fontSize: 13 },
  choiceRow: { minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFEFEF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  choiceSelected: { color: ACCENT, fontWeight: "700" },
  button: { minHeight: 48, marginTop: 18, borderRadius: 10, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  dangerButton: { backgroundColor: DANGER },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  field: { marginTop: 14 },
  fieldLabel: { marginBottom: 7, fontSize: 13, fontWeight: "700", color: "#444" },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, paddingHorizontal: 12, fontSize: 15, color: "#111", backgroundColor: "#FAFAFA" },
  multiline: { minHeight: 130, paddingTop: 12, textAlignVertical: "top" },
  notice: { marginTop: 12, borderRadius: 10, padding: 12, backgroundColor: "#F5F5F5" },
  noticeDanger: { backgroundColor: "#FFF2F3" },
  noticeSuccess: { backgroundColor: "#EFFAF2" },
  noticeText: { fontSize: 13, lineHeight: 19, color: "#444" },
  errorText: { marginTop: 7, color: DANGER, fontSize: 13 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#777", fontSize: 13 },
});

export function capitalizeChoice(value) {
  if (!value) return "Everyone";
  if (value === "no_one") return "No one";
  if (value === "following") return "Following";
  return "Everyone";
}
export function toSettingValue(value) {
  if (value === "No one") return "no_one";
  if (value === "Following") return "following";
  return "everyone";
}