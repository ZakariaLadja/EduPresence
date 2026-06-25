import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ref, onValue } from "firebase/database";
import { database } from '../firebaseConfig';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy'; // استخدام الإصدار المستقر

export default function StudentAttendanceList({ route }) {
  const { students: presentStudentsList = [], date, specialty, level, group } = route.params;
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentsRef = ref(database, 'students');
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ registrationNumber: key, ...data[key] }));
        
        const filtered = list.filter(s => {
          const matchSpecialty = String(s.specialty || "").trim() === String(specialty || "").trim();
          const matchLevel = String(s.level || "").trim() === String(level || "").trim();
          const matchGroup = (group === "غير محدد" || !group) 
            ? true 
            : String(s.group || "").trim() === String(group || "").trim();
          
          return matchSpecialty && matchLevel && matchGroup;
        });

        const combined = filtered.map(student => {
          const isPresent = presentStudentsList.some(p => 
            String(p.registrationNumber).trim() === String(student.registrationNumber).trim()
          );
          return { ...student, status: isPresent ? 'present' : 'absent' };
        });

        setAllStudents(combined);
      }
      setLoading(false);
    });
  }, [specialty, level, group, presentStudentsList]);

  const exportToPDF = async () => {
    try {
      const htmlContent = `
        <html dir="rtl">
          <head><meta charset="utf-8"></head>
          <body>
            <h1>تقرير حضور: ${date}</h1>
            <table border="1" style="width: 100%; border-collapse: collapse;">
              <tr><th>الاسم</th><th>الرقم التسجيلي</th><th>الحالة</th></tr>
              ${allStudents.map(s => `<tr><td>${s.name}</td><td>${s.registrationNumber}</td><td>${s.status === 'present' ? 'حاضر' : 'غائب'}</td></tr>`).join('')}
            </table>
          </body>
        </html>
      `;

      // 1. إنشاء الـ PDF بصيغة Base64 مباشرة (هذا يتجاوز مشكلة القراءة من الـ cache)
      const { uri, base64 } = await Print.printToFileAsync({ 
        html: htmlContent, 
        base64: true 
      });
      
      // 2. تحديد مسار في مجلد المستندات الخاص بالتطبيق
      const fileName = `Attendance_${date.replace(/\//g, '-')}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;

      // 3. كتابة ملف الـ PDF من بيانات الـ base64 مباشرة
      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 4. مشاركة الملف
      await Sharing.shareAsync(newUri);
      
    } catch (e) {
      console.error("خطأ تصدير PDF:", e);
      Alert.alert("خطأ", "فشل التصدير: " + e.message);
    }
  };
  const exportToExcel = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet(allStudents.map(s => ({
        الاسم: s.name,
        الرقم_التسجيلي: s.registrationNumber,
        الحالة: s.status === 'present' ? 'حاضر' : 'غائب'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });
      const uri = FileSystem.documentDirectory + `Attendance_${date.replace(/\//g, '-')}.xlsx`;
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("خطأ", "لم نتمكن من تصدير Excel");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0284c7" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>قائمة الحضور: {date}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.pdfBtn]} onPress={exportToPDF}><Text style={styles.btnText}>📥 PDF</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.xlsBtn]} onPress={exportToExcel}><Text style={styles.btnText}>📊 Excel</Text></TouchableOpacity>
      </View>
      
      <FlatList
        data={allStudents}
        keyExtractor={(item) => item.registrationNumber}
        renderItem={({ item }) => (
          <View style={[styles.card, item.status === 'present' ? styles.presentCard : styles.absentCard]}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.id}>رقم: {item.registrationNumber}</Text>
            </View>
            <Text style={{ fontWeight: 'bold', color: item.status === 'present' ? '#10b981' : '#ef4444' }}>
              {item.status === 'present' ? '✅ حاضر' : '❌ غائب'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  btn: { padding: 12, borderRadius: 10, width: '48%', alignItems: 'center', elevation: 3 },
  pdfBtn: { backgroundColor: '#ef4444' },
  xlsBtn: { backgroundColor: '#10b981' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  presentCard: { borderLeftWidth: 6, borderLeftColor: '#10b981' },
  absentCard: { borderLeftWidth: 6, borderLeftColor: '#ef4444' },
  name: { fontWeight: 'bold', fontSize: 15 },
  id: { fontSize: 12, color: '#666' }
});