import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Page, InfoCard, PageLoading, PrimaryButton, TextField, Notice } from "./SettingsUI";
import { loadSettings, saveSettings } from "./settingsApi";

export default function ManagedListScreen({ title, icon, description, field, addLabel = "Username" }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { load(); }, []);
  async function load() { try { const data = await loadSettings(); setItems(Array.isArray(data?.[field]) ? data[field] : []); } catch (e) { console.error(`${field} LOAD ERROR:`, e); } finally { setLoading(false); } }
  async function add() { const value = draft.trim(); if (!value) return; setSaving(true); const next=[...items,value]; try { await saveSettings({ [field]: next }); setItems(next); setDraft(""); } catch(e) { Alert.alert("Update failed",e?.response?.data?.message||e?.message||"Unable to save this list."); } finally { setSaving(false); } }
  async function remove(index) { const previous=items; const next=items.filter((_,i)=>i!==index); setItems(next); try { await saveSettings({ [field]: next }); } catch(e) { setItems(previous); Alert.alert("Update failed",e?.response?.data?.message||e?.message||"Unable to update this list."); } }
  if (loading) return <Page title={title} onBack={()=>router.back()}><PageLoading/></Page>;
  return <Page title={title} onBack={()=>router.back()}><InfoCard icon={icon} title={title} text={description}/><Notice>{items.length?`${items.length} item(s) managed.`:"No accounts are currently listed."}</Notice><TextField label={addLabel} value={draft} onChangeText={setDraft} placeholder="Enter a username" autoCapitalize="none"/><PrimaryButton text={saving?"Saving...":"Add"} disabled={saving||!draft.trim()} onPress={add}/><View style={{marginTop:14}}>{items.map((item,index)=><Pressable key={`${String(item)}-${index}`} onLongPress={()=>remove(index)} style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:"#EFEFEF"}}><Text style={{fontSize:15,color:"#111"}}>{String(item)}</Text><Text style={{marginTop:3,color:"#999",fontSize:12}}>Long-press to remove</Text></Pressable>)}</View></Page>;
}