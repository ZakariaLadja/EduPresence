import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const ABSENCE_DATA = [
  { id: '1', name: 'أحمد بن علي', subject: 'تطبيقات الهاتف', count: 4, status: 'خطر' },
  { id: '2', name: 'سارة خالد', subject: 'ذكاء اصطناعي', count: 1, status: 'مقبول' },
];

export default function AbsenceReports() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>تقرير الغيابات الأسبوعي</Text>
      <FlatList
        data={ABSENCE_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.subject}>{item.subject}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.count}>{item.count}</Text>
              <Text style={[styles.status, { color: item.status === 'خطر' ? '#ef4444' : '#10b981' }]}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  reportCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  count: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 12 }
});