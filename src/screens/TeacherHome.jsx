import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';

export default function TeacherHome({ route, navigation }) {
  // استقبال البيانات التي مررناها من صفحة Login
  const { teacherData, teacherId } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* الترحيب بالأستاذ */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            مرحباً، د. {teacherData?.name || 'أستاذنا الفاضل'}
          </Text>
          <Text style={styles.subtitleText}>لوحة تحكم EduPresence+</Text>
        </View>

        {/* الخيار الأول: نظام المراسلات - تم التعديل هنا لتمرير الـ teacherId */}
        <TouchableOpacity 
          style={[styles.mainCard, { borderColor: '#475569' }]} 
          onPress={() => navigation.navigate('TeacherMessages', { teacherId: teacherId })}
        >
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>✉️ المراسلات والتنبيهات</Text>
            <Text style={styles.cardDesc}>إرسال رسالة فورية إلى الإدارة أو مجموعات الطلبة</Text>
          </View>
        </TouchableOpacity>

        {/* الخيار الثاني: نظام إدارة الحصص */}
        <TouchableOpacity 
          style={[styles.mainCard, { borderColor: '#0284c7' }]} 
          onPress={() => navigation.navigate('TeacherCategories', { teacherData })}
        >
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>👨‍🏫 الدروس والحصص</Text>
            <Text style={styles.cardDesc}>عرض وتسيير حصص الأسبوع (Cour / TD / Exam)</Text>
          </View>
        </TouchableOpacity>

        {/* الخيار الثالث: الأرشيف والسجلات السابقة */}
        <TouchableOpacity 
          style={[styles.mainCard, { borderColor: '#10b981' }]} 
          onPress={() => navigation.navigate('ArchiveSelection', { teacherData })}
        >
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>📋 الأرشيف والسجلات</Text>
            <Text style={styles.cardDesc}>استعراض تقارير وحضور الطلبة في الحصص السابقة</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  header: { marginBottom: 40, alignItems: 'center' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 5, textAlign: 'center' },
  subtitleText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  mainCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 15, 
    borderWidth: 2, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardTextContainer: { width: '100%', alignItems: 'flex-end' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748b', textAlign: 'right' }
});