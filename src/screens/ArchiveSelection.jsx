import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ref, onValue } from "firebase/database";
import { database } from '../firebaseConfig';

export default function ArchiveSelection({ route, navigation }) {
  const { teacherData } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = teacherData?.email;

    if (email) {
      // تنسيق الإيميل ليطابق هيكل المسارات في Firebase
      const formattedId = email.replace(/[@.]/g, '_');
      
      console.log("المسار المنسق للبحث:", `schedules/${formattedId}`);

      const path = `schedules/${formattedId}`;
      const subjectsRef = ref(database, path);
      
      onValue(subjectsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const subjectsList = Object.keys(data).map(subjectName => ({
            name: subjectName,
            types: data[subjectName]
          }));
          setSubjects(subjectsList);
        } else {
          console.log("لا توجد بيانات لهذا المسار:", path);
        }
        setLoading(false);
      });
    }
  }, [teacherData]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0284c7" />;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>قائمة المقاييس الدراسية</Text>
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subjectName}>{item.name}</Text>
            <View style={styles.typeContainer}>
              {Object.keys(item.types).map((type) => (
                <TouchableOpacity 
                  key={type}
                  style={styles.btn}
                  onPress={() => {
                    // هنا قمنا بحساب الـ formattedId وتمريره بوضوح
                    const formattedId = teacherData?.email.replace(/[@.]/g, '_');
                    
                    navigation.navigate('ArchiveSessionsList', { 
                      subject: item.name, 
                      type: type, 
                      sessionsData: item.types[type],
                      teacherId: formattedId // <--- هذه الإضافة هي التي ستحل مشكلة الـ undefined
                    });
                  }}
                >
                  <Text style={styles.btnText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3 },
  subjectName: { fontSize: 18, fontWeight: 'bold', color: '#0284c7', marginBottom: 10 },
  typeContainer: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  btnText: { fontWeight: 'bold', color: '#0284c7' }
});