import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Modal, Alert, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { CameraView } from 'expo-camera';
import { ref, onValue, set, push } from "firebase/database";
import { database } from '../firebaseConfig';

export default function TeacherAttendance({ route, navigation }) {
  const { classInfo, teacherId } = route.params; 
  
  const [students, setStudents] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rfidInput, setRfidInput] = useState(''); 
  const inputRef = useRef(null);

  // جلب بيانات الطلاب من قاعدة البيانات
  const fetchStudentsData = () => {
    setLoading(true);
    const studentsRef = ref(database, 'students');
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allStudents = Object.keys(data).map(key => ({ 
          registrationNumber: key, 
          ...data[key],
          status: 'absent' // <--- تم إضافة هذه القيمة لضمان أن الكل يعود "غائب" افتراضياً عند التحديث
        }));
        
        const filtered = allStudents.filter(s => {
          const matchAcademic = s.specialty === classInfo.specialty && s.level === classInfo.level;
          const matchGroup = classInfo.group ? (s.group === classInfo.group) : true;
          return matchAcademic && matchGroup;
        });
        
        setStudents(filtered);
      } else {
        setStudents([]);
      }
      setLoading(false);
    }, { onlyOnce: true });
  };

  // دالة لتأكيد مسح الحضور عند التحديث
  const confirmRefresh = () => {
    Alert.alert(
      "تنبيه 🔄",
      "سيتم إعادة تحميل القائمة وتصفير حالات الحضور المسجلة، هل أنت متأكد؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "نعم، تحديث", onPress: fetchStudentsData }
      ]
    );
  };

  useEffect(() => {
    fetchStudentsData();
  }, [classInfo]);

  const registerAttendance = (scannedValue) => {
    const cleanScanned = String(scannedValue).trim();
    Keyboard.dismiss(); 
    
    setStudents(prevStudents => {
      let studentFound = false;
      const updated = prevStudents.map(s => {
        if (s.registrationNumber === cleanScanned || String(s.rfid_code || "").trim() === cleanScanned) {
          studentFound = true;
          return { ...s, status: 'present', attendanceTime: new Date().toLocaleTimeString() };
        }
        return s;
      });

      if (studentFound) {
        Alert.alert("تم التحضير ✅", "تم تسجيل الحضور");
      } else {
        Alert.alert("تنبيه ⚠️", "البطاقة غير مسجلة");
      }
      return [...updated];
    });
    setRfidInput(''); 
  };

  const handleSaveAttendance = async () => {
    const today = new Date();
    const dateKey = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const presentStudents = students.filter(s => s.status === 'present');
    const attendancePath = `attendance/${teacherId}/${classInfo.subjectName}/${classInfo.sessionId}/${dateKey}`;
    
    try {
      await set(ref(database, attendancePath), {
        students: presentStudents.length > 0 ? presentStudents : null, 
        timestamp: Date.now(),
        totalPresent: presentStudents.length,
        specialty: classInfo.specialty || "غير محدد",
        level: classInfo.level || "غير محدد",
        group: classInfo.group || "غير محدد"
      });

      // إرسال إشعار بسيط للطلاب
      students.forEach(student => {
        push(ref(database, `student_notifications/${student.registrationNumber}`), {
          title: "تنبيه حضور",
          body: `تم تسجيلك كـ ${student.status === 'present' ? 'حاضر' : 'غائب'} في حصة ${classInfo.subjectName}`,
          timestamp: Date.now(),
          isRead: false
        });
      });

      Alert.alert("تم الحفظ ✅", `تم تسجيل الحضور: ${presentStudents.length} حاضر`);
      navigation.goBack(); // الخروج التلقائي بعد الحفظ
    } catch (error) {
      Alert.alert("خطأ", "فشل الحفظ");
    }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#2563eb" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color:'#64748b'}}>رجوع</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الحضور</Text>
        <TouchableOpacity style={styles.saveButtonHeader} onPress={handleSaveAttendance}>
          <Text style={styles.saveButtonText}>حفظ</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={rfidInput}
        onChangeText={setRfidInput}
        onSubmitEditing={() => registerAttendance(rfidInput)}
        blurOnSubmit={false}
      />

      <FlatList
        data={students}
        extraData={students}
        keyExtractor={(item) => item.registrationNumber}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, item.status === 'present' ? styles.presentCard : styles.absentCard]}
            onPress={() => {
              // عند الضغط على بطاقة الطالب، تتبدل حالته بين حاضر وغائب يدوياً
              setStudents(prevStudents => 
                prevStudents.map(s => 
                  s.registrationNumber === item.registrationNumber 
                    ? { 
                        ...s, 
                        status: s.status === 'present' ? 'absent' : 'present', 
                        attendanceTime: s.status === 'present' ? null : new Date().toLocaleTimeString() 
                      }
                    : s
                )
              );
            }}
          >
            <View>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentId}>رقم: {item.registrationNumber}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status === 'present' ? 'حاضر' : 'غائب'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footerButtons}>
        <TouchableOpacity style={styles.refreshButton} onPress={confirmRefresh}>
          <Text style={styles.fabText}>🔄 تحديث</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setScannerVisible(true)}>
          <Text style={styles.fabText}>📸 مسح</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={scannerVisible} animationType="slide">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={(barcode) => {
            setScannerVisible(false);
            registerAttendance(barcode.data);
          }}
        />
        <TouchableOpacity style={styles.closeButton} onPress={() => setScannerVisible(false)}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>إلغاء</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveButtonHeader: { backgroundColor: '#059669', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  hiddenInput: { position: 'absolute', width: 0, height: 0, opacity: 0 },
  card: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  presentCard: { borderLeftWidth: 6, borderLeftColor: '#10b981' },
  absentCard: { borderLeftWidth: 6, borderLeftColor: '#ef4444' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  studentId: { color: '#666', fontSize: 13 },
  statusBadge: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  footerButtons: { flexDirection: 'row', padding: 20 },
  fab: { backgroundColor: '#2563eb', padding: 20, borderRadius: 50, flex: 1, marginLeft: 10, alignItems: 'center' },
  refreshButton: { backgroundColor: '#f59e0b', padding: 20, borderRadius: 50, flex: 1, marginRight: 10, alignItems: 'center' },
  fabText: { color: '#fff', fontWeight: 'bold' },
  closeButton: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#ef4444', padding: 15, borderRadius: 20, width: 150, alignItems: 'center' }
});