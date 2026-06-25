import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ref, onValue, remove, update, set } from "firebase/database";
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function AdminAddStudent({ route }) {
  const { adminData } = route.params || {};
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const studentsRef = ref(database, 'students');
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => a.name?.localeCompare(b.name, 'ar'));
        setStudents(list);
      } else {
        setStudents([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = () => {
    update(ref(database, `students/${editModal.id}`), formData)
      .then(() => { 
        setEditModal(null); 
        Alert.alert('تم', 'تم تحديث البيانات بنجاح'); 
      })
      .catch((error) => Alert.alert('خطأ', error.message));
  };

  const handleAdd = () => {
    // التحقق الأساسي: رقم التسجيل والاسم فقط إجباريان
    if (!formData.id || !formData.name) return Alert.alert('خطأ', 'يرجى ملء رقم التسجيل والاسم على الأقل');
    
    // إذا كان rfid_code فارغاً، نضع له قيمة افتراضية أو نتركه كما هو
    const dataToAdd = { ...formData };
    if (!dataToAdd.rfid_code) {
      dataToAdd.rfid_code = "غير محدد"; // أو يمكنك تركها فارغة ""
    }

    set(ref(database, `students/${formData.id}`), dataToAdd)
      .then(() => { 
        setAddModal(false); 
        setFormData({}); 
        Alert.alert('تم', 'تم إضافة الطالب بنجاح'); 
      })
      .catch((error) => Alert.alert('خطأ', error.message));
  };

  const deleteStudent = (id) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من حذف هذا الطالب؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: () => remove(ref(database, `students/${id}`)) }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backHomeText}>← رجوع للداشبورد</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>قائمة طلبة {adminData?.institution || 'جامعة معسكر'}</Text>
      
      <FlatList 
        data={students}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.info}> {item.id} | {item.level}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => { setEditModal(item); setFormData(item); }}>
                <Text style={{color:'#fff'}}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => deleteStudent(item.id)}>
                <Text style={{color:'#fff'}}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>لا يوجد طلبة مسجلين.</Text>}
      />

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>⚠️ تنبيه: تأكد من دقة البيانات.</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => { setFormData({}); setAddModal(true); }}>
        <Text style={styles.btnText}>+ إضافة طالب جديد</Text>
      </TouchableOpacity>

      <Modal visible={!!editModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setEditModal(null)} style={styles.backButton}><Text style={styles.backText}>← إغلاق</Text></TouchableOpacity>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{fontWeight:'bold', marginBottom:10}}>تعديل بيانات: {editModal?.name}</Text>
              <TextInput style={styles.input} placeholder="الاسم" value={formData.name || ''} onChangeText={(t) => setFormData(p => ({...p, name: t}))} />
              <TextInput style={styles.input} placeholder="رقم التسجيل (ID)" value={formData.id || ''} editable={false} />
              <TextInput style={styles.input} placeholder="كلمة المرور" value={String(formData.password || '')} onChangeText={(t) => setFormData(p => ({...p, password: t}))} />
              <TextInput style={styles.input} placeholder="التخصص" value={formData.specialty || ''} onChangeText={(t) => setFormData(p => ({...p, specialty: t}))} />
              <TextInput style={styles.input} placeholder="المستوى" value={formData.level || ''} onChangeText={(t) => setFormData(p => ({...p, level: t}))} />
              <TextInput style={styles.input} placeholder="الفوج" value={formData.group || ''} onChangeText={(t) => setFormData(p => ({...p, group: t}))} />
              <TextInput style={styles.input} placeholder="كود RFID (اختياري)" value={String(formData.rfid_code || '')} onChangeText={(t) => setFormData(p => ({...p, rfid_code: t}))} />
              <TouchableOpacity style={styles.addBtn} onPress={handleUpdate}><Text style={{color:'#fff'}}>حفظ التعديلات</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={addModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setAddModal(false)} style={styles.backButton}><Text style={styles.backText}>← إغلاق</Text></TouchableOpacity>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{fontWeight:'bold', marginBottom:10}}>إضافة طالب جديد</Text>
              <TextInput style={styles.input} placeholder="رقم التسجيل (ID)" onChangeText={(t) => setFormData(p => ({...p, id: t}))} />
              <TextInput style={styles.input} placeholder="الاسم الكامل" onChangeText={(t) => setFormData(p => ({...p, name: t}))} />
              <TextInput style={styles.input} placeholder="كلمة المرور" onChangeText={(t) => setFormData(p => ({...p, password: t}))} />
              <TextInput style={styles.input} placeholder="التخصص" onChangeText={(t) => setFormData(p => ({...p, specialty: t}))} />
              <TextInput style={styles.input} placeholder="المستوى" onChangeText={(t) => setFormData(p => ({...p, level: t}))} />
              <TextInput style={styles.input} placeholder="الفوج" onChangeText={(t) => setFormData(p => ({...p, group: t}))} />
              <TextInput style={styles.input} placeholder="كود RFID (اختياري)" onChangeText={(t) => setFormData(p => ({...p, rfid_code: t}))} />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}><Text style={{color:'#fff'}}>إضافة الطالب</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  topHeader: { marginBottom: 10 },
  backHomeBtn: { padding: 5, alignSelf: 'flex-start' },
  backHomeText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  studentCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontWeight: 'bold', fontSize: 15 },
  info: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 6, marginRight: 5 },
  delBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 6 },
  warningBox: { backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#fecaca' },
  warningText: { color: '#991b1b', fontSize: 12, textAlign: 'center' },
  addBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, maxHeight: '80%' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10, textAlign: 'right' },
  backButton: { marginBottom: 10 },
  backText: { color: '#ef4444', fontWeight: 'bold' }
});