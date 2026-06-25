import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';

export default function TeacherSubjects({ route, navigation }) {
  // استقبلنا بيانات الأستاذ ونوع الحصة (Cour/TD/Exam) من الشاشة السابقة
  const { teacherData, category } = route.params;

  // استخراج المقاييس التي تبدأ بـ "sub"
  const subjects = Object.keys(teacherData)
    .filter(key => key.startsWith('sub'))
    .map(key => ({ id: key, name: teacherData[key] }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>اختر المقياس لحصة {category}</Text>
        
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              // تم تصحيح الـ navigation هنا للانتقال إلى شاشة الجدول أولاً
              onPress={() => navigation.navigate('TeacherSchedule', { 
                subject: item.name, 
                category: category,
                teacherData: teacherData // نمرر بيانات الأستاذ لاستخدامها في جلب الجدول
              })}
            >
              <Text style={styles.subjectName}>{item.name}</Text>
              <Text style={styles.arrow}>◀</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'right', color: '#1e293b' },
  card: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15,
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 
  },
  subjectName: { fontSize: 18, color: '#334155', fontWeight: '600' },
  arrow: { color: '#94a3b8', fontSize: 18 }
});