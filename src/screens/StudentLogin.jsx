import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
// تأكد من ضبط مسار استيراد Firebase حسب مشروعك
import { database } from '../firebaseConfig'; 
import { ref, get, child } from "firebase/database";

export default function StudentLogin({ navigation }) {
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. التحقق من ملء الحقول
    if (!registrationId.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم التسجيل وكلمة المرور.');
      return;
    }

    setLoading(true);

    try {
      // 2. الوصول لقاعدة بيانات Firebase
      const dbRef = ref(database);
      // البحث في المسار المخصص للطلاب باستخدام رقم التسجيل
      const snapshot = await get(child(dbRef, `students/${registrationId.trim()}`));

      if (snapshot.exists()) {
        const studentData = snapshot.val();

        // 3. التحقق من كلمة السر
        if (studentData.password.toString().trim() === password.trim()) {
          // نجاح الدخول: تمرير بيانات الطالب إلى الشاشة التالية
          // نستخدم replace لمنع الطالب من الرجوع لصفحة الدخول
          navigation.replace('StudentHome', { studentData, registrationId: registrationId });
        } else {
          Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
        }
      } else {
        Alert.alert('خطأ', 'رقم التسجيل غير موجود في النظام.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدثت مشكلة في الاتصال، تأكد من الإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.loginCard}>
        {/* الشعار */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🎓</Text>
        </View>

        <Text style={styles.mainTitle}>بوابة الطالب الرقمية</Text>
        <Text style={styles.subTitle}>نظام التحضير الآلي والمراسلات البيداغوجية</Text>

        {/* حقل رقم التسجيل */}
        <Text style={styles.inputLabel}>رقم التسجيل الجامعي:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="مثال: 232338445918" 
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={registrationId}
          onChangeText={setRegistrationId}
        />

        {/* حقل كلمة المرور */}
        <Text style={styles.inputLabel}>كلمة المرور:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="••••••••" 
          placeholderTextColor="#94a3b8"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />

        {/* زر الدخول */}
        <TouchableOpacity 
          style={[styles.loginButton, loading && { backgroundColor: '#94a3b8' }]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>الدخول للفضاء الرقمي ➔</Text>
          )}
        </TouchableOpacity>

        {/* روابط بوابات أخرى */}
        <View style={styles.switchContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherLogin')}>
            <Text style={styles.switchText}>بوابة الأستاذ</Text>
          </TouchableOpacity>
          <Text style={styles.switchDivider}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={styles.switchText}>لوحة تحكم الإدارة</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { backgroundColor: '#fff', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', elevation: 4, alignItems: 'center' },
  logoBadge: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  logoIcon: { fontSize: 36 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6, textAlign: 'center' },
  subTitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  inputLabel: { width: '100%', fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, textAlign: 'right' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, textAlign: 'right', backgroundColor: '#f8fafc', fontSize: 15, color: '#334155' },
  loginButton: { width: '100%', height: 52, backgroundColor: '#2563eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 2 },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  switchContainer: { flexDirection: 'row', marginTop: 24, justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 13, color: '#64748b', fontWeight: '600', paddingHorizontal: 5 },
  switchDivider: { color: '#cbd5e1', fontSize: 12 }
});