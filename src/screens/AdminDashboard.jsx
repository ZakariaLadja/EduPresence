import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

export default function AdminDashboard({ navigation, route }) {
  // استلام بيانات المسؤول
  const { adminData } = route.params || {};

  const menuItems = [
    { title: 'إضافة أساتذة', icon: '💼', screen: 'AdminAddTeacher' },
    { title: 'إضافة طلبة', icon: '🎓', screen: 'AdminAddStudent' },
    { title: 'إدارة الحصص', icon: '📅', screen: 'AdminManageSessions' },
    { title: 'إدارة القاعات', icon: '🏫', screen: 'AdminRoomStatus' },
    { title: 'تغيير القاعات', icon: '🔄', screen: 'AdminRoomChange' },
    { title: 'مركز الرسائل', icon: '✉️', screen: 'AdminMessagingCenter' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>لوحة تحكم الإدارة</Text>
        <Text style={styles.subHeader}>{adminData?.institution || 'نظام الإدارة المركزية'}</Text>
      </View>
      
      {/* أضفنا flexGrow: 1 هنا لتمتد الـ ScrollView وتملأ المساحة */}
      <ScrollView contentContainerStyle={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card} 
            onPress={() => navigation.navigate(item.screen, { adminData })}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('AdminLogin')}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  headerContainer: { marginBottom: 25 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 5 },
  
  // جعل الـ grid تأخذ مساحة الشاشة بالكامل وتوزع العناصر
  grid: { 
    flexGrow: 1, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    alignContent: 'flex-start' 
  },
  
  // زيادة العرض والـ padding لتكبير البطاقات
  card: { 
    width: '48%', 
    backgroundColor: '#fff', 
    paddingVertical: 35, 
    borderRadius: 16, 
    marginBottom: 15, 
    alignItems: 'center', 
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  
  icon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', textAlign: 'center' },
  
  // دفع زر الخروج للأسفل دائماً
  logoutBtn: { marginTop: 'auto', padding: 18, backgroundColor: '#fee2e2', borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});