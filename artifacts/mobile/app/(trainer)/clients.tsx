import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { CLIENTS } from "@/lib/dummyData";

const STATUS_COLOR = { Excellent: "success", "On Track": "info", "Needs Attention": "warning" } as const;

export default function ClientsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [search, setSearch] = useState("");

  const filtered = CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.goal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Clients</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{CLIENTS.length} total</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderRadius: colors.radius }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search clients..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No clients found</Text>
          </View>
        ) : (
          filtered.map((client) => (
            <AppCard
              key={client.id}
              onPress={() => router.push({ pathname: "/(trainer)/client-detail", params: { clientId: client.id } })}
              style={styles.clientCard}
            >
              <View style={styles.clientRow}>
                <Avatar name={client.name} size={48} />
                <View style={styles.clientInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.clientName, { color: colors.foreground }]}>{client.name}</Text>
                    <Badge label={client.progressStatus} color={STATUS_COLOR[client.progressStatus]} small />
                  </View>
                  <Text style={[styles.clientGoal, { color: colors.mutedForeground }]}>{client.goal}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="body-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>BMI {client.bmi}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{client.lastActive}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  clientCard: {},
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientInfo: { flex: 1 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  clientGoal: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 5 },
  metaRow: { flexDirection: "row", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
