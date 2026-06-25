import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ref, onValue, remove, update, set } from "firebase/database";
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function AdminAddTeacher({ route }) {
  const { adminData } = route.params || {};
  const navigation = useNavigation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', id: '', email: '', subjects: [] });

  useEffect(() => {
    const teachersRef = ref(database, 'users/teachers');
    const unsubscribe = onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => {
          const item = data[key];
          // دمج ذكي: إذا كانت المصفوفة موجودة نستخدمها، إذا لا، نجمع sub1 و sub2
          const subjects = item.subjects || [item.sub1, item.sub2].filter(Boolean);
          return { id: key, ...item, subjects };
        });
        list.sort((a, b) => a.name?.localeCompare(b.name, 'ar'));
        setTeachers(list);
      } else {
        setTeachers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addSubjectField = () => {
    setFormData({...formData, subjects: [...(formData.subjects || []), '']});
  };

  const updateSubject = (text, index) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = text;
    setFormData({...formData, subjects: newSubjects});
  };

  const removeSubject = (index) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({...formData, subjects: newSubjects});
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) return Alert.alert('خطأ', 'يرجى ملء المعرف والاسم');
    
    // تحويل المصفوفة إلى كائن sub1, sub2, ...
    const dataToSave = { ...formData };
    if (dataToSave.subjects) {
      dataToSave.subjects.forEach((sub, index) => {
        dataToSave[`sub${index + 1}`] = sub;
      });
      delete dataToSave.subjects; // حذف المصفوفة بعد التحويل
    }

    update(ref(database, `users/teachers/${formData.id}`), dataToSave)
      .then(() => { 
        setEditModal(null); 
        setAddModal(false); 
        Alert.alert('تم', 'تم حفظ البيانات بنجاح'); 
      })
      .catch((error) => Alert.alert('خطأ', error.message));
  };

  const deleteTeacher = (id) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من حذف هذا الأستاذ؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: () => remove(ref(database, `users/teachers/${id}`)) }
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

      <Text style={styles.headerTitle}>قائمة الأساتذة</Text>
      
      <FlatList 
        data={teachers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.info}> {item.email}</Text>
              <Text style={styles.info}> {item.subjects?.join(' - ') || 'لا توجد'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => { setEditModal(item); setFormData(item); }}>
                <Text style={{color:'#fff'}}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => deleteTeacher(item.id)}>
                <Text style={{color:'#fff'}}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>لا يوجد أساتذة مسجلين.</Text>}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => { setFormData({subjects:[]}); setAddModal(true); }}>
        <Text style={styles.btnText}>+ إضافة أستاذ جديد</Text>
      </TouchableOpacity>

      <Modal visible={!!editModal || addModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{fontWeight:'bold', marginBottom:10}}>{editModal ? 'تعديل بيانات الأستاذ' : 'إضافة أستاذ جديد'}</Text>
              
              <TextInput style={styles.input} placeholder="المعرف (ID)" value={formData.id} editable={!editModal} onChangeText={(t) => setFormData({...formData, id: t})} />
              <TextInput style={styles.input} placeholder="الاسم الكامل" value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} />
              <TextInput style={styles.input} placeholder="البريد الإلكتروني" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} />
              <TextInput style={styles.input} placeholder="كلمة المرور" value={String(formData.password || '')} onChangeText={(t) => setFormData({...formData, password: t})} />
              
              <Text style={{fontWeight:'bold', marginTop:10}}>المواد الدراسية:</Text>
              {formData.subjects?.map((sub, index) => (
                <View key={index} style={styles.subRow}>
                  <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={sub} onChangeText={(t) => updateSubject(t, index)} />
                  <TouchableOpacity onPress={() => removeSubject(index)} style={styles.delSubBtn}><Text style={{color:'#fff'}}>X</Text></TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addSubBtn} onPress={addSubjectField}><Text style={{color:'#fff'}}>+ إضافة مادة</Text></TouchableOpacity>
              
              <TouchableOpacity style={styles.addBtn} onPress={handleSave}><Text style={styles.btnText}>حفظ البيانات</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditModal(null); setAddModal(false); }} style={{marginTop:10, alignItems:'center'}}><Text>إلغاء</Text></TouchableOpacity>
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
  backHomeBtn: { alignSelf: 'flex-start' },
  backHomeText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontWeight: 'bold', fontSize: 15 },
  info: { color: '#64748b', fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 10 },
  editBtn: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 6, marginRight: 5 },
  delBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 6 },
  addBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, maxHeight: '80%' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10, textAlign: 'right' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  delSubBtn: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8, marginLeft: 5 },
  addSubBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 }
});