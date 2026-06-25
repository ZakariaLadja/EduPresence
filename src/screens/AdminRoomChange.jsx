import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ref, onValue } from "firebase/database";
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function AdminRoomChange() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const schedulesRef = ref(database, 'active_schedules');
    const teachersRef = ref(database, 'users/teachers');

    Promise.all([
      new Promise(resolve => onValue(schedulesRef, resolve, { onlyOnce: true })),
      new Promise(resolve => onValue(teachersRef, resolve, { onlyOnce: true }))
    ]).then(([schedulesSnap, teachersSnap]) => {
      const schedules = schedulesSnap.val() || {};
      const teachers = teachersSnap.val() || {};
      const newStats = {};

      Object.values(schedules).forEach(change => {
        const room = change.originalRoomId || "قاعة غير معروفة";
        
        if (!newStats[room]) {
          newStats[room] = { count: 0, logs: [] };
        }
        
        newStats[room].count += 1;

        let teacherName = "أستاذ غير محدد";
        const teacherObj = Object.values(teachers).find(t => 
          t.sub1 === change.subjectName || t.sub2 === change.subjectName
        );
        
        if (teacherObj) {
          teacherName = teacherObj.name;
        }

        newStats[room].logs.push({
          teacher: teacherName,
          reason: change.reason || "لا يوجد سبب مرفق",
          time: `${change.day || ''} - ${change.time || ''}`
        });
      });
      
      setStats(newStats);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← رجوع</Text></TouchableOpacity>
      <Text style={styles.title}>سجل مشاكل القاعات (تقرير التغييرات)</Text>

      <FlatList
        // الترتيب: أولاً حسب العدد تنازلي، ثانياً حسب اسم القاعة تصاعدي (أبجدي/رقمي)
        data={Object.keys(stats).sort((a, b) => {
          if (stats[b].count !== stats[a].count) {
            return stats[b].count - stats[a].count;
          }
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        })}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.roomName}>{item}</Text>
              <Text style={styles.countBadge}>{stats[item].count} تغييرات</Text>
            </View>
            
            <View style={styles.logs}>
              {stats[item].logs.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logText}>
                    <Text style={styles.bold}>الأستاذ:</Text> {log.teacher}
                  </Text>
                  <Text style={styles.logText}>
                    <Text style={styles.bold}>الموعد:</Text> {log.time}
                  </Text>
                  <Text style={styles.reasonText}>
                    <Text style={styles.bold}>سبب المشكلة في القاعة:</Text> {log.reason}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  back: { color: '#2563eb', marginBottom: 10, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roomName: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  countBadge: { backgroundColor: '#ef4444', color: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: 'bold' },
  logs: { marginTop: 5, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  logItem: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 8 },
  logText: { fontSize: 13, color: '#334155', marginBottom: 2 },
  reasonText: { fontSize: 13, color: '#b91c1c', fontStyle: 'italic', marginTop: 4 },
  bold: { fontWeight: 'bold', color: '#0f172a' }
});