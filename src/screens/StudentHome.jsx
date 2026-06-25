import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Modal, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ref, onValue } from "firebase/database";
import { database } from '../firebaseConfig';

export default function StudentHome({ route, navigation }) {
  const { studentData, registrationId } = route.params;

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [notiModalVisible, setNotiModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [academicStatus, setAcademicStatus] = useState([]);

  useEffect(() => {
    const notifRef = ref(database, `student_notifications/${registrationId}`);
    
    onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setNotifications(formattedList.reverse());
      } else {
        setNotifications([]);
      }
    });
  }, [registrationId]);

  const fetchAttendanceStats = () => {
    setLoadingStats(true);
    const attendanceRef = ref(database, 'attendance');
    onValue(attendanceRef, (snapshot) => {
      const allData = snapshot.val();
      const stats = {};

      if (allData) {
        Object.keys(allData).forEach(teacherId => {
          Object.keys(allData[teacherId]).forEach(subject => {
            const sessions = allData[teacherId][subject];
            
            Object.keys(sessions).forEach(sessionId => {
              const dates = Object.keys(sessions[sessionId]);
              
              dates.forEach(date => {
                const dayData = sessions[sessionId][date];
                
                // شرط صارم: تطابق التخصص، المستوى، والفوج (أو الفوج العام)
                const isMatch = 
                  dayData.specialty === studentData.specialty && 
                  dayData.level === studentData.level && 
                  (dayData.group === studentData.group || dayData.group === "غير محدد");
                
                if (isMatch) {
                  const uniqueKey = `${subject}_${sessionId}`;
                  
                  if (!stats[uniqueKey]) {
                    stats[uniqueKey] = { id: uniqueKey, subject: `${subject} - ${sessionId}`, absent: 0 };
                  }
                  
                  const studentRecord = dayData.students?.find(s => s.registrationNumber === registrationId);
                  
                  if (!studentRecord || studentRecord.status === 'absent') {
                    stats[uniqueKey].absent += 1;
                  }
                }
              });
            });
          });
        });
      }
      setAcademicStatus(Object.values(stats));
      setLoadingStats(false);
    }, { onlyOnce: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('StudentLogin')}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>فضاء الطالب الرقمي</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>👤</Text></View>
          <Text style={styles.profileName}>{studentData.name || "طالب جامعي"}</Text>
          <Text style={styles.profileId}>رقم التسجيل: {registrationId}</Text>
          <Text style={styles.profileSub}>{studentData.specialty} | {studentData.group}</Text>
        </View>

        <Text style={styles.menuTitle}>الخدمات الإلكترونية:</Text>

        <TouchableOpacity style={[styles.menuButton, { borderColor: '#2563eb' }]} onPress={() => setQrModalVisible(true)}>
          <Text style={styles.buttonIcon}>📱</Text>
          <View style={styles.buttonTextWrapper}>
            <Text style={[styles.buttonMainText, { color: '#2563eb' }]}>بطاقة الحضور الرقمية (QR)</Text>
            <Text style={styles.buttonSubText}>استخدمه للتحضير الفوري</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, { borderColor: '#10b981' }]} onPress={() => setNotiModalVisible(true)}>
          {notifications.length > 0 && (
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{notifications.length}</Text></View>
          )}
          <Text style={styles.buttonIcon}>🔔</Text>
          <View style={styles.buttonTextWrapper}>
            <Text style={[styles.buttonMainText, { color: '#10b981' }]}>مركز التنبيهات</Text>
            <Text style={styles.buttonSubText}>إشعارات الإدارة والأساتذة</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, { borderColor: '#f59e0b' }]} onPress={() => { setStatusModalVisible(true); fetchAttendanceStats(); }}>
          <Text style={styles.buttonIcon}>📊</Text>
          <View style={styles.buttonTextWrapper}>
            <Text style={[styles.buttonMainText, { color: '#f59e0b' }]}>كشف الحضور والغياب</Text>
            <Text style={styles.buttonSubText}>تابع حصيلتك الدراسية</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 1. QR Code Modal */}
      <Modal visible={qrModalVisible} transparent={true} animationType="fade" onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalContentTitle}>رمز الحضور الخاص بك</Text>
            <View style={styles.qrCodeContainer}>
              <QRCode value={String(registrationId)} size={200} />
            </View>
            <Text style={styles.qrIdText}>{registrationId}</Text>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setQrModalVisible(false)}><Text style={styles.closeModalBtnText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Notifications Modal */}
      <Modal visible={notiModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalContentTitle}>🔔 الإشعارات</Text>
            <FlatList 
              data={notifications} 
              keyExtractor={i => i.id} 
              style={{ width: '100%' }}
              renderItem={({item}) => (
                <View style={styles.notiCard}>
                  <View style={styles.notiHeader}>
                    <Text style={styles.notiSender}>من: {item.sender || 'إدارة الكلية'}</Text>
                    <Text style={styles.notiTime}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString('ar-DZ', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      }) : ''}
                    </Text>
                  </View>
                  <Text style={styles.notiTitle}>{item.title}</Text>
                  <Text style={styles.notiBody}>{item.body}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={[styles.closeModalBtn, {backgroundColor:'#10b981'}]} onPress={() => setNotiModalVisible(false)}><Text style={styles.closeModalBtnText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Attendance Modal */}
      <Modal visible={statusModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalContentTitle}>📊 كشف الحضور</Text>
            {loadingStats ? <ActivityIndicator size="large" /> : (
              <FlatList data={academicStatus} keyExtractor={i => i.id} renderItem={({item}) => (
                <View style={[styles.statusCard, item.absent >= 2 && {backgroundColor: '#fee2e2'}]}>
                    <Text style={styles.statusSubject}>{item.subject}</Text>
                    <Text>إجمالي الغيابات: {item.absent}</Text>
                    {item.absent >= 2 && <Text style={{color: 'red', fontWeight: 'bold', marginTop: 5}}>خطر الإقصاء 🔴</Text>}
                </View>
              )}/>
            )}
            <TouchableOpacity style={[styles.closeModalBtn, {backgroundColor:'#f59e0b'}]} onPress={() => setStatusModalVisible(false)}><Text style={styles.closeModalBtnText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  logoutButton: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { padding: 16, alignItems: 'center' },
  menuTitle: { alignSelf: 'flex-start', marginHorizontal: 20, marginBottom: 10, fontWeight: 'bold', color: '#64748b' },
  profileCard: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20, elevation: 2 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 30 },
  profileName: { fontSize: 20, fontWeight: 'bold' },
  profileId: { color: '#64748b', fontSize: 14 },
  profileSub: { color: '#94a3b8', fontSize: 12 },
  menuButton: { width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 },
  buttonIcon: { fontSize: 28, marginLeft: 16 },
  buttonTextWrapper: { flex: 1, alignItems: 'flex-end' },
  buttonMainText: { fontSize: 16, fontWeight: 'bold' },
  buttonSubText: { fontSize: 11, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 20, alignItems: 'center' },
  modalContentTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 15 },
  qrCodeContainer: { padding: 15, backgroundColor: 'white', borderRadius: 10, marginVertical: 10 },
  qrIdText: { fontWeight: 'bold', marginTop: 10 },
  closeModalBtn: { width: '100%', height: 48, backgroundColor: '#2563eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  closeModalBtnText: { color: '#fff', fontWeight: 'bold' },
  notiCard: { padding: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', width: '100%', backgroundColor: '#fff' },
  notiHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  notiSender: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  notiTime: { fontSize: 10, color: '#94a3b8' },
  notiTitle: { fontWeight: 'bold', fontSize: 15, color: '#0f172a' },
  notiBody: { color: '#475569', marginTop: 4, fontSize: 14 },
  statusCard: { padding: 12, marginBottom: 10, backgroundColor: '#f9f9f9', borderRadius: 8, width: '100%' },
  statusSubject: { fontWeight: 'bold' },
  badgeCount: { position: 'absolute', top: 12, left: 16, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeCountText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});