import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

// قاموس للترجمة الرسمية للرموز
const sessionLabels = {
  C: "محاضرة",
  T: "حصة أعمال موجهة",
  E: "امتحان"
};

export default function ArchiveSessionsList({ route, navigation }) {
  // قمنا باستقبال teacherId هنا من الشاشة التي سبقت هذه الصفحة
  const { subject, type, sessionsData, teacherId } = route.params;

  const sessions = Object.keys(sessionsData).map(key => ({
    id: key, 
    info: sessionsData[key]
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>قائمة الحصص لـ {subject}</Text>
      
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ArchiveDetail', { 
              sessionId: item.id, 
              subjectName: subject,
              teacherId: teacherId // <--- تم إضافة الـ teacherId المفقود هنا
            })}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {sessionLabels[item.id.charAt(0)] || "حصة"} {item.id}
              </Text>
            </View>
            <Text style={styles.sessionSub}>📍 القاعة: {item.info.room || 'غير محددة'}</Text>
            <Text style={styles.sessionSub}>⏰ التوقيت: {item.info.time || 'غير محدد'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 15, 
    elevation: 3,
    borderRightWidth: 5,
    borderRightColor: '#0284c7' 
  },
  badge: { 
    backgroundColor: '#e0f2fe', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20, 
    alignSelf: 'flex-start', 
    marginBottom: 10 
  },
  badgeText: { color: '#0369a1', fontWeight: 'bold', fontSize: 14 },
  sessionSub: { fontSize: 14, color: '#475569', marginTop: 2 }
});