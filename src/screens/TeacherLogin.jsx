import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, StatusBar, Image } from 'react-native';
import { database } from '../firebaseConfig'; 
import { ref, get, child } from "firebase/database";

import AppLogo from '../../assets/logo.png'; 

export default function TeacherLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("خطأ", "الرجاء ملء جميع الحقول");
      return;
    }

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/teachers`));

      if (snapshot.exists()) {
        const teachers = snapshot.val();
        
        // البحث عن الأستاذ الذي يطابق الإيميل وكلمة السر
        const teacherKey = Object.keys(teachers).find(
          key => teachers[key].email === email && String(teachers[key].password) === password
        );

        if (teacherKey) {
          const teacherData = teachers[teacherKey];
          Alert.alert("نجاح", `أهلاً بك د. ${teacherData.name}`);
          
          // هنا التعديل: نمرر الـ teacherData للترحيب، والـ teacherId للمراسلات
          navigation.navigate('TeacherHome', { 
            teacherData: teacherData, 
            teacherId: teacherKey 
          });
        } else {
          Alert.alert("خطأ", "البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
      } else {
        Alert.alert("خطأ", "لا توجد حسابات أساتذة مسجلة");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث مشكلة في الاتصال بالسيرفر");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.container}>
        
        <View style={styles.brandContainer}>
          <Image source={AppLogo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.sectionTitle}>بوابة الأساتذة والمحاضرين 👨‍🏫</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="البريد الإلكتروني المهني" 
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput 
            style={styles.input} 
            placeholder="كلمة المرور" 
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: '#1e3a8a' }]} onPress={handleLogin}>
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={[styles.switchText, { color: '#475569' }]}>لوحة الإدارة 🏢</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('StudentLogin')}>
            <Text style={[styles.switchText, { color: '#059669' }]}>بوابة الطلاب 🎓</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between', alignItems: 'center' },
  brandContainer: { alignItems: 'center', marginTop: 20, width: '100%' },
  logoImage: { width: 220, height: 220, marginBottom: 5 },
  sectionTitle: { fontSize: 16, color: '#64748b', fontWeight: '600', textAlign: 'center', marginTop: -10 },
  formContainer: { width: '100%', marginVertical: 10 },
  input: { width: '100%', height: 56, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, marginBottom: 16, textAlign: 'right', backgroundColor: '#fff', fontSize: 16, color: '#334155' },
  button: { width: '100%', height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginTop: 8, shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linksContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  linkCard: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  switchText: { fontSize: 14, fontWeight: '700' }
});