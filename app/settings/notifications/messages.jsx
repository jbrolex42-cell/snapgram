import React from "react";
import { router } from "expo-router";
import { Page, InfoCard, SettingItem } from "../../../components/settings/SettingsUI";
export default function MessageNotificationsScreen(){return <Page title="Message notifications" onBack={()=>router.back()}><InfoCard icon="chatbubble-ellipses-outline" title="Message notifications" text="Manage notifications for messages, requests and story replies."/><SettingItem title="Notification settings" subtitle="Open message notification controls." onPress={()=>router.push("/settings/notifications/notifications")}/></Page>}