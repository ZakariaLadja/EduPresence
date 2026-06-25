import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Modal, ActivityIndicator, Alert } from 'react-native';
import { database } from '../firebaseConfig'; 
import { ref, get, child } from "firebase/database";

export default function TeacherSchedule({ route, navigation }) {
  const { category, subject, teacherData } = route.params || {};
  
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const teacherId = teacherData?.email ? teacherData.email.replace(/[.@]/g, '_') : null;

  useEffect(() => {
    if (!teacherId) return;

    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const dbRef = ref(database);
        
        // 1. جلب الجدول الأصلي
        const masterSnapshot = await get(child(dbRef, `schedules/${teacherId}/${subject}/${category}`));
        
        // 2. جلب التعديلات النشطة
        const activeSnapshot = await get(child(dbRef, `active_schedules`));
        
        const masterData = masterSnapshot.exists() ? masterSnapshot.val() : {};
        const activeData = activeSnapshot.exists() ? activeSnapshot.val() : {};

        // 3. الدمج التلقائي (الجدول الفعلي)
        const formattedData = Object.keys(masterData).map(key => {
          const original = masterData[key];
          
          // نبحث في التعديلات عن أي تعديل يخص هذا المدرس في نفس اليوم والوقت
          const override = Object.values(activeData).find(a => 
            a.teacherId === teacherId && 
            a.day === original.day && 
            a.time === original.time
          );

          return {
            id: key,
            ...original,
            // إذا وجد تعديل، نستخدم القاعة الجديدة، وإلا نبقى على الأصلية
            room: override ? override.newRoomId : original.room
          };
        });

        setSchedule(formattedData);
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        Alert.alert("خطأ", "تعذر جلب الجدول الدراسي.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [category, subject, teacherId]);

  const handleClassPress = (item) => {
    setSelectedClass({ ...item, subjectName: subject, sessionId: item.id });
    setModalVisible(true);
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{flex: 1}} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>➔ عودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}: {subject}</Text>
      </View>

      <FlatList
        data={schedule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={<Text style={styles.emptyText}>لا توجد حصص مجدولة لهذا المقياس.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.classCard} onPress={() => handleClassPress(item)}>
            <View style={styles.classDetails}>
              <Text style={styles.subjectText}>{subject}</Text>
              <Text style={styles.targetText}>🎓 {item.level || 'غير محدد'} - {item.specialty || ''}</Text>
              {item.group && <Text style={styles.groupText}>👥 {item.group}</Text>}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 {item.room || 'لا توجد قاعة'}</Text>
                <Text style={styles.metaText}>🕒 {item.day || ''} ({item.time || ''})</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.notch} />
            <Text style={styles.modalTitle}>{selectedClass?.subjectName}</Text>
            <Text style={styles.modalSubtitle}>{selectedClass?.level} | {selectedClass?.room}</Text>

            <TouchableOpacity 
              style={[styles.modalOptionButton, { backgroundColor: '#10b981' }]} 
              onPress={() => { 
                setModalVisible(false); 
                navigation.navigate('TeacherAttendance', { 
                  classInfo: selectedClass, 
                  teacherId: teacherId 
                }); 
              }}
            >
              <Text style={styles.modalOptionText}>📝 تسجيل حضور الطلاب</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOptionButton, { backgroundColor: '#475569' }]} 
              onPress={() => { 
                setModalVisible(false); 
                navigation.navigate('TeacherReschedule', { classInfo: selectedClass }); 
              }}
            >
              <Text style={styles.modalOptionText}>⚙️ تغيير القاعة أو التوقيت</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { padding: 16 },
  classCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  classDetails: { alignItems: 'flex-end' },
  subjectText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  targetText: { fontSize: 13, color: '#475569', marginTop: 4 },
  groupText: { fontSize: 13, fontWeight: 'bold', color: '#0284c7', marginTop: 2 },
  metaRow: { flexDirection: 'row-reverse', marginTop: 8 },
  metaText: { fontSize: 12, color: '#64748b', marginLeft: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' },
  notch: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  modalOptionButton: { width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  modalOptionText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { width: '100%', height: 50, marginTop: 10, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { color: '#475569', fontWeight: 'bold' }
});