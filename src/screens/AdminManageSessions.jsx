import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { ref, onValue, update, remove } from "firebase/database";
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function AdminManageSessions() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const dayOrder = { "الأحد": 1, "الإثنين": 2, "الثلاثاء": 3, "الأربعاء": 4, "الخميس": 5 };

  useEffect(() => {
    const schedRef = ref(database, 'schedules');
    onValue(schedRef, (snapshot) => {
      const data = snapshot.val();
      const tempSessions = [];
      if (data) {
        Object.keys(data).forEach(teacher => {
          Object.keys(data[teacher]).forEach(subject => {
            Object.keys(data[teacher][subject]).forEach(type => {
              Object.keys(data[teacher][subject][type]).forEach(id => {
                tempSessions.push({
                  key: `${teacher}_${subject}_${type}_${id}`,
                  teacher, subject, type, id,
                  ...data[teacher][subject][type][id]
                });
              });
            });
          });
        });
      }
      tempSessions.sort((a, b) => {
        if (dayOrder[a.day] !== dayOrder[b.day]) return (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9);
        if (a.time !== b.time) return (a.time || '').localeCompare(b.time || '');
        return (a.room || '').localeCompare(b.room || '');
      });
      setSessions(tempSessions);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    if (!formData.email || !formData.subject || !formData.type || !formData.id) {
      return Alert.alert('خطأ', 'يرجى تعبئة الحقول الأساسية (الإيميل، المادة، النوع، المعرف)');
    }

    const path = `schedules/${formData.email}/${formData.subject}/${formData.type}/${formData.id}`;
    
    const cleanData = Object.fromEntries(
      Object.entries({
        day: formData.day,
        group: formData.group,
        level: formData.level,
        room: formData.room,
        specialty: formData.specialty,
        time: formData.time
      }).filter(([_, value]) => value && value.trim() !== '')
    );

    update(ref(database, path), cleanData).then(() => { 
      setModalVisible(false); 
      setFormData({});
      Alert.alert('تم', 'تم حفظ البيانات بنجاح'); 
    }).catch(e => Alert.alert('خطأ', e.message));
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backHomeText}>← رجوع للداشبورد</Text>
      </TouchableOpacity>
      
      <FlatList 
        data={sessions}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.day || 'غير محدد'} - {item.time || 'غير محدد'}</Text>
            <Text style={styles.info}>{item.subject} ({item.type}) | {item.level || ''} | {item.room || 'غير محدد'}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => { 
                setFormData({ 
                  email: item.teacher, subject: item.subject, type: item.type, id: item.id, 
                  day: item.day, time: item.time, group: item.group, room: item.room, 
                  level: item.level, specialty: item.specialty 
                }); 
                setIsEditing(true); 
                setModalVisible(true); 
              }}>
                <Text style={{color:'#fff'}}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => remove(ref(database, `schedules/${item.teacher}/${item.subject}/${item.type}/${item.id}`))}>
                <Text style={{color:'#fff'}}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => { setFormData({}); setIsEditing(false); setModalVisible(true); }}>
        <Text style={styles.btnText}>+ إضافة حصة جديدة</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={{fontWeight: 'bold', fontSize: 16}}>إضافة حصة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{fontSize: 20, color: 'red'}}>X</Text></TouchableOpacity>
            </View>
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews={Platform.OS === 'android'}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {isEditing ? (
                <View style={styles.staticContainer}>
                  <Text style={styles.staticText}>الأستاذ: {formData.email}</Text>
                  <Text style={styles.staticText}>المادة: {formData.subject}</Text>
                  <Text style={styles.staticText}>النوع: {formData.type}</Text>
                  <Text style={styles.staticText}>المعرف: {formData.id}</Text>
                </View>
              ) : (
                <>
                  <TextInput style={styles.input} placeholder="إيميل الأستاذ (يتحول تلقائياً)" value={formData.email || ''} onChangeText={(t) => setFormData({...formData, email: t.replace(/[@.]/g, '_')})} />
                  <TextInput style={styles.input} placeholder="المادة" value={formData.subject || ''} onChangeText={(t) => setFormData({...formData, subject: t})} />
                  <TextInput style={styles.input} placeholder="النوع (Cour/Td)" value={formData.type || ''} onChangeText={(t) => setFormData({...formData, type: t})} />
                  <TextInput style={styles.input} placeholder="معرف الحصة" value={formData.id || ''} onChangeText={(t) => setFormData({...formData, id: t})} />
                </>
              )}
              
              <TextInput style={styles.input} placeholder="المستوى الدراسي (اختياري)" value={formData.level || ''} onChangeText={(t) => setFormData({...formData, level: t})} />
              <TextInput style={styles.input} placeholder="التخصص (اختياري)" value={formData.specialty || ''} onChangeText={(t) => setFormData({...formData, specialty: t})} />
              <TextInput style={styles.input} placeholder="اليوم (اختياري)" value={formData.day || ''} onChangeText={(t) => setFormData({...formData, day: t})} />
              <TextInput style={styles.input} placeholder="التوقيت (اختياري)" value={formData.time || ''} onChangeText={(t) => setFormData({...formData, time: t})} />
              <TextInput style={styles.input} placeholder="الفوج (اختياري)" value={formData.group || ''} onChangeText={(t) => setFormData({...formData, group: t})} />
              <TextInput style={styles.input} placeholder="القاعة (اختياري)" value={formData.room || ''} onChangeText={(t) => setFormData({...formData, room: t})} />
              
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠️ تنبيه: يرجى كتابة البيانات بدقة متناهية.</Text>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={handleSave}><Text style={styles.btnText}>حفظ البيانات</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontWeight: 'bold', fontSize: 15 },
  info: { color: '#64748b', fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 10 },
  editBtn: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 6, marginRight: 5 },
  delBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 6 },
  addBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10, textAlign: 'right' },
  staticContainer: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  staticText: { fontSize: 14, color: '#475569', marginBottom: 5, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  backHomeText: { color: '#2563eb', fontWeight: 'bold', marginBottom: 10 },
  warningBox: { backgroundColor: '#fff7ed', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#fed7aa' },
  warningText: { color: '#9a3412', fontSize: 12, textAlign: 'center' }
});