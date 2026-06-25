import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ref, onValue } from "firebase/database";
import { database } from '../firebaseConfig';

export default function ArchiveDetail({ route, navigation }) {
  const { sessionId, subjectName, teacherId } = route.params;
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = `attendance/${teacherId}/${subjectName}/${sessionId}`;
    const attendanceRef = ref(database, path);

    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const datesList = Object.keys(data).map(dateKey => ({
          date: dateKey.replace(/-/g, '/'),
          attendanceInfo: data[dateKey]
        }));
        setDates(datesList);
      } else {
        setDates([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, subjectName, teacherId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0284c7" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>سجل حضور: {subjectName}</Text>
      
      {dates.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>لا توجد بيانات حضور مسجلة.</Text>
        </View>
      ) : (
        <FlatList
          data={dates}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => {
                // نمرر البيانات لشاشة عرض الحاضرين والغائبين
                navigation.navigate('StudentAttendanceList', { 
                  students: item.attendanceInfo.students || [], // قائمة الحاضرين
                  date: item.date,
                  specialty: item.attendanceInfo.specialty,    
                  level: item.attendanceInfo.level,            
                  group: item.attendanceInfo.group             
                });
              }}
            >
              <Text style={styles.dateText}>📅 {item.date}</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.infoText}>تخصص: {item.attendanceInfo.specialty || 'غير محدد'}</Text>
                <Text style={styles.infoText}>مستوى: {item.attendanceInfo.level || 'غير محدد'}</Text>
              </View>
              
              <Text style={styles.infoText}>الفوج: {item.attendanceInfo.group || 'غير محدد'}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.countText}>
                عدد الحاضرين: {item.attendanceInfo.totalPresent || 0} طالب
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3, borderLeftWidth: 5, borderLeftColor: '#059669' },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoText: { fontSize: 13, color: '#475569' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  countText: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  emptyText: { fontSize: 16, color: '#94a3b8', textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});