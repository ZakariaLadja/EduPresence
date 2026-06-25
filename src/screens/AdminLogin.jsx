import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { getDatabase, ref, get, child } from 'firebase/database';

export default function AdminLogin({ navigation }) {
  const [adminCode, setAdminCode] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleAdminLogin = async () => {
    const db = getDatabase();
    const dbRef = ref(db);

    try {
      // الوصول إلى مسار الإداريين في قاعدة البيانات
      const snapshot = await get(child(dbRef, `users/admins/${adminCode.trim()}`));

      if (snapshot.exists()) {
        const adminData = snapshot.val();

        // التحقق من كلمة المرور (تأكد أنها مخزنة كـ String أو Number حسب بياناتك)
        if (String(adminData.password) === password.trim()) {
          // تسجيل دخول ناجح، نمرر بيانات الـ institution للداشبورد
          navigation.navigate('AdminDashboard', { adminData });
        } else {
          Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
        }
      } else {
        Alert.alert('خطأ', 'رمز المسؤول غير موجود.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال بقاعدة البيانات.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.card}>
        <Text style={styles.title}>بوابة الإدارة المركزية</Text>
        <Text style={styles.subTitle}>نظام إدارة EduPresence+</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="رمز المسؤول" 
          placeholderTextColor="#94a3b8"
          value={adminCode} 
          onChangeText={setAdminCode}
          autoCapitalize="characters"
        />

        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput} 
            placeholder="كلمة المرور" 
            placeholderTextColor="#94a3b8"
            secureTextEntry={secureText}
            value={password} 
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Text style={styles.toggleButtonText}>{secureText ? 'إظهار' : 'إخفاء'}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.loginBtn} onPress={handleAdminLogin}>
          <Text style={styles.btnText}>دخول لوحة التحكم</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 24, elevation: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  subTitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 25 },
  input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 15, textAlign: 'right', borderWidth: 1, borderColor: '#e2e8f0' },
  passwordContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, paddingVertical: 16, textAlign: 'right', color: '#1e293b' },
  toggleButtonText: { fontSize: 13, color: '#2563eb', fontWeight: 'bold', marginLeft: 10 },
  loginBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backBtnText: { color: '#64748b', fontSize: 13, textDecorationLine: 'underline' }
});