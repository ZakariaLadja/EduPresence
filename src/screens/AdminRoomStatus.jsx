import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { ref, onValue, update, set, remove } from "firebase/database";
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function AdminRoomStatus() {
  const navigation = useNavigation();
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [filterDay, setFilterDay] = useState(null);
  const [filterTime, setFilterTime] = useState(null);

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const times = ['08:30 - 10:00', '10:15 - 11:45', '13:00 - 14:30', '14:45 - 16:15'];

  useEffect(() => {
    // 1. الاستماع المستمر للقاعات (هذا يحل مشكلة تحديث الحالة فوراً)
    const roomsRef = ref(database, 'all_classrooms');
    onValue(roomsRef, (snap) => {
      const data = snap.val() || {};
      let tempRooms = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      
      tempRooms.sort((a, b) => {
        const isAAmphi = a.name.includes('مدرج');
        const isBAmphi = b.name.includes('مدرج');
        if (isAAmphi && !isBAmphi) return -1;
        if (!isAAmphi && isBAmphi) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
      setRooms(tempRooms);
    });

    // 2. جلب الجداول
    const schedRef = ref(database, 'schedules');
    const activeRef = ref(database, 'active_schedules');
    const cancelRef = ref(database, 'cancelled_schedules');

    onValue(schedRef, (sSnap) => {
      onValue(activeRef, (aSnap) => {
        onValue(cancelRef, (cSnap) => {
          const originalSchedules = sSnap.val() || {};
          const activeChanges = aSnap.val() || {};
          const cancelled = cSnap.val() || {};
          let allSessions = [];
          
          Object.keys(originalSchedules).forEach(teacher => {
            Object.keys(originalSchedules[teacher]).forEach(subject => {
              Object.keys(originalSchedules[teacher][subject]).forEach(type => {
                Object.keys(originalSchedules[teacher][subject][type]).forEach(id => {
                  const session = originalSchedules[teacher][subject][type][id];
                  const keyId = `${subject}_${id}`;
                  if (cancelled[keyId]) return;
                  const change = Object.values(activeChanges).find(a => a.subjectIdKey === keyId);
                  if (change) {
                    allSessions.push({ ...session, room: change.newRoomId, day: change.day, time: change.time });
                  } else {
                    allSessions.push(session);
                  }
                });
              });
            });
          });
          setSchedules(allSessions);
          setLoading(false);
        });
      });
    });
  }, []);

  const getFilteredRooms = () => {
    if (!filterDay || !filterTime) return rooms;
    const busyRooms = schedules
      .filter(s => s.day === filterDay && s.time === filterTime)
      .map(s => s.room);
    return rooms.filter(room => !busyRooms.includes(room.name) && room.status === 'متاح');
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) return Alert.alert('خطأ', 'يرجى تعبئة رمز القاعة والاسم');
    set(ref(database, `all_classrooms/${formData.id}`), {
      name: formData.name,
      status: formData.status || 'متاح',
      problems: formData.problems || {}
    }).then(() => { setModalVisible(false); });
  };

  const confirmDelete = (id) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه القاعة؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: () => remove(ref(database, `all_classrooms/${id}`)), style: 'destructive' }
    ]);
  };

  const toggleStatus = (item) => {
    // التحديث هنا سيؤدي فوراً لتشغيل onValue في الـ useEffect وتحديث الشاشة
    const newStatus = item.status === 'متاح' ? 'غير متاح' : 'متاح';
    update(ref(database, `all_classrooms/${item.id}`), { status: newStatus });
  };

  const addProblemField = () => {
    const currentProblems = formData.problems || {};
    const count = Object.keys(currentProblems).length + 1;
    setFormData({ ...formData, problems: { ...currentProblems, [`p${count}`]: '' } });
  };

  const updateProblem = (key, value) => {
    setFormData({ ...formData, problems: { ...formData.problems, [key]: value } });
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← رجوع</Text></TouchableOpacity>
      
      <View style={styles.filterContainer}>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={filterDay} onValueChange={(val) => setFilterDay(val)}>
            <Picker.Item label="اليوم (الكل)" value={null} />
            {days.map(d => <Picker.Item key={d} label={d} value={d} />)}
          </Picker>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={filterTime} onValueChange={(val) => setFilterTime(val)}>
            <Picker.Item label="التوقيت (الكل)" value={null} />
            {times.map(t => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>
      </View>

      <FlatList 
        data={getFilteredRooms()}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flex: 1}}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.subText}>الرمز: {item.id}</Text>
              <Text style={[styles.status, { color: item.status === 'متاح' ? 'green' : 'red' }]}>الحالة: {item.status}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => toggleStatus(item)} style={[styles.btn, {backgroundColor: item.status === 'متاح' ? '#64748b' : '#059669'}]}>
                <Text style={{color: '#fff', fontSize: 10}}>{item.status === 'متاح' ? 'تعطيل' : 'تمكين'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFormData(item); setModalVisible(true); }} style={[styles.btn, {backgroundColor: '#f59e0b'}]}><Text style={{color: '#fff', fontSize: 10}}>تعديل</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} style={[styles.btn, {backgroundColor: '#ef4444'}]}><Text style={{color: '#fff', fontSize: 10}}>حذف</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => { setFormData({}); setModalVisible(true); }}><Text style={styles.btnText}>+ إضافة قاعة جديدة</Text></TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <TextInput style={styles.input} placeholder="رمز القاعة (مثال: room_001)" value={formData.id || ''} onChangeText={t => setFormData({...formData, id: t})} />
              <TextInput style={styles.input} placeholder="اسم القاعة" value={formData.name || ''} onChangeText={t => setFormData({...formData, name: t})} />
              <TouchableOpacity style={styles.addProbBtn} onPress={addProblemField}><Text style={{color: '#2563eb'}}>+ إضافة مشكلة</Text></TouchableOpacity>
              {Object.keys(formData.problems || {}).map((key) => (
                <TextInput key={key} style={styles.input} placeholder={key} value={formData.problems[key]} onChangeText={t => updateProblem(key, t)} />
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.btnText}>حفظ القاعة</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{textAlign: 'center', marginTop: 10}}>إلغاء</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f1f5f9' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  pickerWrapper: { flex: 0.48, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', height: 50, justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontWeight: 'bold', fontSize: 14 },
  subText: { fontSize: 11, color: '#94a3b8' },
  status: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  actions: { flexDirection: 'row', width: '38%', justifyContent: 'flex-end' },
  btn: { padding: 6, borderRadius: 4, marginLeft: 4 },
  addBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, alignItems: 'center' },
  addProbBtn: { marginBottom: 15, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, maxHeight: '80%' },
  saveBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 5, alignItems: 'center' },
  back: { color: '#2563eb', marginBottom: 10, fontWeight: 'bold' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});