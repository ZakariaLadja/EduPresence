import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

export default function TeacherCategories({ route, navigation }) {
  
const handleCategoryPress = (categoryType) => {
  // استخدام الـ route.params الموجود في الـ props مباشرة
  const { teacherData } = route.params; 

  navigation.navigate('TeacherSubjects', { 
    category: categoryType, 
    teacherData: teacherData,
  });
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* شريط علوي مخصص للرجوع للواجهة الرئيسية */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>➔ عودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تصنيف الحصص والامتحانات</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.hintText}>الرجاء اختيار نوع الحصة البيداغوجية الحالية لبدء عملية تسجيل الحضور:</Text>

        {/* 1. تصنيف المحاضرات - Cour */}
        <TouchableOpacity 
          style={[styles.categoryCard, { borderColor: '#2563eb' }]} 
          onPress={() => handleCategoryPress('Cour')}
        >
          <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.badgeText, { color: '#2563eb' }]}>Cour</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>📚 المحاضرات العامة</Text>
            <Text style={styles.cardDesc}>عرض وتسيير جداول المحاضرات في المدرجات</Text>
          </View>
        </TouchableOpacity>

        {/* 2. تصنيف الأعمال الموجهة - TD */}
        <TouchableOpacity 
          style={[styles.categoryCard, { borderColor: '#0d9488' }]} 
          onPress={() => handleCategoryPress('TD')}
        >
          <View style={[styles.badge, { backgroundColor: '#f0fdfa' }]}>
            <Text style={[styles.badgeText, { color: '#0d9488' }]}>TD</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>📝 الأعمال الموجهة</Text>
            <Text style={styles.cardDesc}>تسيير حضور المجموعات والأفواج في حصص التمارين</Text>
          </View>
        </TouchableOpacity>

        {/* 3. تصنيف الامتحانات - Exam */}
        <TouchableOpacity 
          style={[styles.categoryCard, { borderColor: '#e11d48' }]} 
          onPress={() => handleCategoryPress('Exam')}
        >
          <View style={[styles.badge, { backgroundColor: '#fff1f2' }]}>
            <Text style={[styles.badgeText, { color: '#e11d48' }]}>Exam</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>🎯 الامتحانات والتقييمات</Text>
            <Text style={styles.cardDesc}>مراقبة حضور وضبط غيابات الطلبة في الامتحانات</Text>
          </View>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  hintText: { fontSize: 15, color: '#64748b', textAlign: 'right', marginBottom: 30, lineHeight: 22 },
  categoryCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 16, borderWidth: 2, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  badge: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10 },
  badgeText: { fontSize: 16, fontWeight: '900' },
  textContainer: { alignItems: 'flex-end', flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 5 },
  cardDesc: { fontSize: 13, color: '#64748b', textAlign: 'right' }
});