import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Modal, ActivityIndicator, TextInput } from 'react-native';
import { ref, onValue, set, remove, push, get } from "firebase/database";
import { database } from '../firebaseConfig';

const fetchTeacherName = async (teacherId) => {
  if (!teacherId) return "أستاذ غير معروف";
  const snapshot = await get(ref(database, `users/teachers/${teacherId}/name`));
  return snapshot.exists() ? snapshot.val() : "أستاذ غير معروف";
};

export default function TeacherReschedule({ route, navigation }) {
  const { classInfo } = route.params || { 
    classInfo: { id: 'temp_id', room: 'مدرج D', time: '14:45 - 16:15', subjectName: 'هندسة التكوين', day: 'الأربعاء', teacher: 'default' } 
  };
  
  const [classrooms, setClassrooms] = useState([]); 
  const [allSchedules, setAllSchedules] = useState([]);
  const [activeSchedules, setActiveSchedules] = useState({});
  const [cancelledSchedules, setCancelledSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [selectedDay, setSelectedDay] = useState(classInfo?.day || 'الأحد');
  const [selectedTime, setSelectedTime] = useState(classInfo?.time || '08:30 - 10:00');
  
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const times = ['08:30 - 10:00', '10:15 - 11:45', '13:00 - 14:30', '14:45 - 16:15'];

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomDetailsModal, setShowRoomDetailsModal] = useState(false);
  
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const reasonsList = [
    "الإضاءة معطلة", "جهاز العرض (Data Show) غير متوفر", "كابل HDMI مفقود",
    "مآخذ التيار الكهربائي تالفة", "القاعة محجوزة", "ضعف في شبكة الإنترنت داخل القاعة", "سبب آخر"
  ];

  const currentDay = showTimeOptions ? selectedDay : classInfo?.day;
  const currentTime = showTimeOptions ? selectedTime : classInfo?.time;

  const getEndTimeStamp = (dayString, timeString) => {
  const daysMap = {
    'الأحد': 0,
    'الاثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6
  };

  const now = new Date();

  // استخراج وقت نهاية الحصة
  const endTimePart = timeString.split(' - ')[1].trim();
  const [endHour, endMinute] = endTimePart
    .replace('.', ':')
    .split(':')
    .map(Number);

  const targetDay = daysMap[dayString];
  const currentDay = now.getDay();

  let dayDiff = targetDay - currentDay;

  if (dayDiff < 0) {
    dayDiff += 7;
  }

  // إذا كان نفس اليوم
  if (dayDiff === 0) {
    const todayEnd = new Date(now);
    todayEnd.setHours(endHour, endMinute, 0, 0);

    // إذا انتهت الحصة بالفعل انتقل للأسبوع القادم
    if (now.getTime() >= todayEnd.getTime()) {
      dayDiff = 7;
    }
  }

  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + dayDiff);
  targetDate.setHours(endHour, endMinute, 0, 0);
  console.log("Date.now():", Date.now());
console.log("Current date:", new Date().toString());
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);

  return targetDate.getTime();
};



  const sendNotificationToStudents = (classData, notificationBody) => {
    const studentsRef = ref(database, 'students');
    get(studentsRef).then((snapshot) => {
      const allStudents = snapshot.val();
      if (!allStudents) return;
      
      Object.keys(allStudents).forEach(regId => {
        const student = allStudents[regId];
        let isMatch = student.specialty === classData.specialty && student.level === classData.level;
        if (classData.group && student.group !== classData.group) isMatch = false;
        
        if (isMatch) {
          const studentNotifRef = ref(database, `student_notifications/${regId}`);
          push(studentNotifRef, {
            title: "تنبيه دراسي",
            body: notificationBody,
            timestamp: Date.now(),
            isRead: false
          });
        }
      });
    });
  };

  const handleCancelClass = () => {
    Alert.alert("تأكيد الإلغاء", "هل أنت متأكد من إلغاء هذه الحصة؟ سيتم إعلام الطلبة وتفريغ القاعة.", [
      { text: "لا" },
      { text: "نعم، إلغاء", style: "destructive", onPress: () => {
        const safeSubject = classInfo.subject || classInfo.subjectName;
        const keyId = `${safeSubject}_${classInfo.id}`;
        
        // 1. تسجيل الإلغاء في قاعدة البيانات
        set(ref(database, `cancelled_schedules/${keyId}`), {
          subjectName: safeSubject,
          originalRoomId: classInfo.room,
          day: classInfo.day,
          time: classInfo.time,
          timestamp: Date.now(),
          endTime: getEndTimeStamp(currentDay, currentTime),
        });

        // 2. حذف أي تعديل سابق لهذه الحصة إن وجد
        Object.keys(activeSchedules).forEach(key => {
          if (key.includes(keyId)) remove(ref(database, `active_schedules/${key}`));
        });

        sendNotificationToStudents({
          specialty: classInfo.specialty,
          level: classInfo.level,
          group: classInfo.group || null
        }, `تنبيه: تم إلغاء حصة ${safeSubject} المقررة يوم ${currentDay}.`);

        Alert.alert("تم", "تم إلغاء الحصة وأصبحت القاعة متاحة.");
        navigation.goBack();
      }}
    ]);
  };

  useEffect(() => {
    const roomsRef = ref(database, 'all_classrooms');
    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setClassrooms(list);
      }
      setLoading(false);
    });

    const schedulesRef = ref(database, 'schedules');
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const flattened = [];
        Object.keys(data).forEach(teacher => {
          Object.keys(data[teacher]).forEach(subject => {
            Object.keys(data[teacher][subject]).forEach(type => {
              Object.keys(data[teacher][subject][type]).forEach(id => {
                flattened.push({ ...data[teacher][subject][type][id], teacher, subject, id: id });
              });
            });
          });
        });
        setAllSchedules(flattened);
      }
    });

    const activeRef = ref(database, 'active_schedules');
    onValue(activeRef, (snapshot) => {
      setActiveSchedules(snapshot.val() || {});
    });

    const cancelledRef = ref(database, 'cancelled_schedules');
    onValue(cancelledRef, (snapshot) => {
      setCancelledSchedules(snapshot.val() || {});
    });
  }, []);

  const handleSave = async () => {
    const isCustomReasonValid = showCustomInput && customReason.trim().length > 0;
    const isReasonSelected = selectedReasons.length > 0;

    if (!isReasonSelected && !isCustomReasonValid) {
      Alert.alert("تنبيه", "يرجى اختيار سبب التغيير.");
      return;
    }

    // --- الحل الذكي: البحث عن الأستاذ داخل قائمة الحصص ---
    const foundSchedule = allSchedules.find(s => s.id === classInfo.id && s.subject === classInfo.subjectName);
    const teacherId = foundSchedule ? foundSchedule.teacher : "t1"; // استخدام المعرف الموجود في الجدول أو افتراضي
    
    // جلب الاسم
    const teacherName = await fetchTeacherName(teacherId);
    // ----------------------------------------------------

    const safeSubject = classInfo.subject || classInfo.subjectName || "GeneralSubject";
    const safeId = classInfo.id || "000";
    const keyId = `${safeSubject}_${safeId}`;
    
    remove(ref(database, `cancelled_schedules/${keyId}`));
    const finalReason = isCustomReasonValid ? customReason : selectedReasons.join(', ');

    Object.keys(activeSchedules).forEach(key => {
      if (key.includes(keyId)) {
        remove(ref(database, `active_schedules/${key}`));
      }
    });

    const scheduleRef = ref(database, `active_schedules/${keyId}_${Date.now()}`); 
    set(scheduleRef, {
      subjectName: safeSubject,
      originalRoomId: classInfo.room, 
      newRoomId: selectedRoom.name,
      day: currentDay,
      time: currentTime,
      reason: finalReason,
      timestamp: Date.now(),
      endTime: getEndTimeStamp(currentDay, currentTime),
      teacherName: teacherName, 
      teacherId: teacherId,     
      subjectIdKey: keyId
    }).then(() => {
      sendNotificationToStudents({
        specialty: classInfo.specialty,
        level: classInfo.level,
        group: classInfo.group || null
      }, `تم تغيير حصة ${safeSubject} الساعة ${currentTime} في ال${selectedRoom.name}`);
      
      Alert.alert("تم", "تم تحديث القاعة بنجاح!");
      setShowRoomDetailsModal(false);
      navigation.goBack();
    }).catch(error => {
      Alert.alert("خطأ", "حدث خطأ: " + error.message);
    });
  };

  const toggleReason = (reason) => {
    if (reason === "سبب آخر") {
      setShowCustomInput(!showCustomInput);
    } else {
      setSelectedReasons(prev => 
        prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
      );
    }
  };

  const getAvailableRooms = () => {
    // استخدم Date.now() فهي دائماً تعيد الوقت بتنسيق UTC عالمياً
    const now = Date.now(); 

    const activeEntries = Object.values(activeSchedules).filter(a => a.endTime > now);
    const modifiedKeys = activeEntries.map(a => a.subjectIdKey);
    
    // 2. الإلغاءات النشطة (بناءً على الوقت والتاريخ الكامل)
    const cancelledKeys = Object.keys(cancelledSchedules).filter(key => cancelledSchedules[key].endTime > now);

    // 3. تحديد القاعات المشغولة من الجدول الأصلي
    const busyRooms = allSchedules
      .filter(s => {
        const sKeyId = `${s.subject}_${s.id}`;
        // استثناء الحصص التي تم تعديلها أو إلغاؤها (إذا كان التعديل/الإلغاء لا يزال سارياً)
        if (modifiedKeys.includes(sKeyId) || cancelledKeys.includes(sKeyId)) return false; 
        return s.day === currentDay && s.time === currentTime;
      })
      .map(s => s.room);

    // 4. تحديد القاعات المشغولة بسبب التعديلات الجديدة
    const modifiedBusyRooms = activeEntries
      .filter(a => a.day === currentDay && a.time === currentTime)
      .map(a => a.newRoomId);

    const allBusyRooms = [...new Set([...busyRooms, ...modifiedBusyRooms])];
    
    // إرجاع القاعات غير المشغولة
    return classrooms.filter(room => !allBusyRooms.includes(room.name));
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#2563eb" />;
  const availableRooms = getAvailableRooms();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>➔ إلغاء</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل القاعة والتوقيت</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.currentClassCard}>
          <Text style={styles.classSubject}>📋 الحصة: {classInfo?.subjectName || classInfo?.subject || 'غير محدد'}</Text>
          <Text style={styles.classDetails}>القاعة الحالية: {classInfo?.room || 'غير محدد'} | التوقيت: {classInfo?.time || 'غير محدد'}</Text>
        </View>

        <TouchableOpacity style={styles.cancelMainBtn} onPress={handleCancelClass}>
          <Text style={styles.cancelMainText}>إلغاء الحصة بالكامل ❌</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setShowTimeOptions(!showTimeOptions)}>
          <View style={[styles.checkbox, showTimeOptions && styles.checkboxActive]}>
            {showTimeOptions && <Text style={{color: '#fff', fontSize: 12}}>✓</Text>}
          </View>
          <Text style={styles.sectionLabel}>هل تريد تغيير التوقيت؟</Text>
        </TouchableOpacity>

        {showTimeOptions && (
          <View>
            <Text style={styles.sectionLabel}>اختر اليوم:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
              {days.map(day => (
                <TouchableOpacity key={day} style={[styles.filterBtn, selectedDay === day && styles.activeFilterBtn]} onPress={() => setSelectedDay(day)}>
                  <Text style={selectedDay === day ? {color:'#fff', fontWeight:'bold'} : {}}>{day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>اختر التوقيت:</Text>
            <View style={styles.timeGrid}>
              {times.map(time => (
                <TouchableOpacity key={time} style={[styles.timeBtn, selectedTime === time && styles.activeFilterBtn]} onPress={() => setSelectedTime(time)}>
                  <Text style={selectedTime === time ? {color:'#fff', fontWeight:'bold'} : {}}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>🏢 القاعات المتاحة يوم {currentDay} ({currentTime}):</Text>
        {availableRooms.length > 0 ? availableRooms.map(room => (
          <TouchableOpacity key={room.id} style={[styles.roomItemButton, selectedRoom?.id === room.id && styles.activeRoomItem]} onPress={() => { setSelectedRoom(room); setShowRoomDetailsModal(true); }}>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.roomItemText}>{room.name}</Text>
              {room.problems && <Text style={{fontSize: 10, color: '#f59e0b'}}>⚠️ بها مشاكل تقنية</Text>}
            </View>
            <Text style={styles.roomSelectHint}>معاينة 🔍</Text>
          </TouchableOpacity>
        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#ef4444'}}>لا توجد قاعات متاحة في هذا التوقيت</Text>}
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={showRoomDetailsModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>حالة القاعة</Text>
            <Text style={styles.modalRoomName}>{selectedRoom?.name}</Text>

{selectedRoom?.problems ? (
  <View style={styles.problemBox}>
    <Text style={styles.problemTitle}>⚠️ مشاكل تقنية مسجلة:</Text>
    <Text style={styles.problemText}>
      {typeof selectedRoom.problems === 'object' 
        ? Object.values(selectedRoom.problems).join(', ') 
        : selectedRoom.problems}
    </Text>
  </View>
) : (
  <Text style={styles.noProblemText}>✅ القاعة لا تحتوي على مشاكل تقنية.</Text>
)}

            <Text style={styles.sectionLabel}>اختر سبب التغيير:</Text>
            {reasonsList.map(reason => (
              <TouchableOpacity key={reason} style={[styles.reasonBtn, (selectedReasons.includes(reason) || (reason === "سبب آخر" && showCustomInput)) && styles.activeReasonBtn]} onPress={() => toggleReason(reason)}>
                <Text style={(selectedReasons.includes(reason) || (reason === "سبب آخر" && showCustomInput)) ? {color:'#fff'} : {}}>{reason}</Text>
              </TouchableOpacity>
            ))}
            {showCustomInput && (
              <TextInput style={styles.textArea} placeholder="اكتب السبب بالتفصيل..." value={customReason} onChangeText={setCustomReason} multiline />
            )}
            <View style={styles.modalActionsRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRoomDetailsModal(false)}><Text style={styles.modalCancelText}>إلغاء</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSave}>
                    <Text style={styles.modalConfirmText}>حفظ وتأكيد</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 8 },
  backButtonText: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { padding: 16 },
  currentClassCard: { backgroundColor: '#eff6ff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 20, alignItems: 'flex-end' },
  classSubject: { fontSize: 15, fontWeight: 'bold', color: '#1e3a8a' },
  classDetails: { fontSize: 13, color: '#1d4ed8', marginTop: 4 },
  cancelMainBtn: { backgroundColor: '#fee2e2', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#fecaca' },
  cancelMainText: { color: '#ef4444', fontWeight: 'bold' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', textAlign: 'right', marginBottom: 8 },
  roomItemButton: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  activeRoomItem: { borderColor: '#1e3a8a', backgroundColor: '#eff6ff', borderWidth: 2 },
  roomItemText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  roomSelectHint: { fontSize: 11, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 15 },
  modalRoomName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 15 },
  reasonBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6, alignItems: 'flex-end' },
  activeReasonBtn: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  textArea: { width: '100%', height: 80, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, textAlign: 'right', writingDirection: 'rtl', textAlignVertical: 'top', marginBottom: 15 },
  modalActionsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 10 },
  modalConfirmBtn: { flex: 1, backgroundColor: '#10b981', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  modalConfirmText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalCancelBtn: { flex: 1, backgroundColor: '#f1f5f9', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  modalCancelText: { color: '#475569', fontSize: 14, fontWeight: 'bold' },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  timeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', margin: 4, alignItems: 'center' },
  activeFilterBtn: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#1e3a8a', marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#1e3a8a' },
  problemBox: { backgroundColor: '#fff7ed', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fdba74', marginVertical: 10 },
  problemTitle: { color: '#c2410c', fontWeight: 'bold', fontSize: 13, marginBottom: 5 },
  problemText: { color: '#9a3412', fontSize: 13 },
  noProblemText: { color: '#16a34a', textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },

});