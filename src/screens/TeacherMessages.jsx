import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ref, onValue, push } from "firebase/database";
import { database } from '../firebaseConfig'; 

export default function TeacherMessages({ navigation, route }) {
  // استقبال الـ teacherId من خلال الـ route
  const { teacherId } = route.params || {};

  const [activeTab, setActiveTab] = useState('send');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [focusedStudent, setFocusedStudent] = useState(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [institutionData, setInstitutionData] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]); // تم إضافته لاستقبال رسائل الإدارة
  const [loading, setLoading] = useState(true);
  
  // حالة اسم الأستاذ الافتراضية
  const [teacherName, setTeacherName] = useState("جاري التحميل...");

  useEffect(() => {
    if (teacherId) {
      const teacherRef = ref(database, `users/teachers/${teacherId}`);
      onValue(teacherRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.name) {
          setTeacherName(data.name);
        } else {
          setTeacherName(`خطأ في ID: ${teacherId}`);
        }
      });

      // إضافة مستمع لرسائل الإدارة الخاصة بهذا الأستاذ
      const inboxRef = ref(database, `teacher_notifications/${teacherId}`);
      onValue(inboxRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          setAdminMessages(list);
        } else {
          setAdminMessages([]);
        }
      });
    } else {
      setTeacherName("لم يتم استقبال ID الأستاذ");
    }

    // 2. جلب بيانات الطلاب
    const studentsRef = ref(database, 'students');
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key, 
          ...data[key],
          type: 'student',
          info: `${data[key].level || ''} - ${data[key].specialty || ''} - ${data[key].group || ''}`
        }));
        setInstitutionData(list);
      }
      setLoading(false);
    });
  }, [teacherId]);

  const groupOptions = useMemo(() => {
    const groups = new Map();
    institutionData.forEach(s => {
      const g1 = `${s.level} - ${s.specialty}`;
      const g2 = `${s.level} - ${s.specialty} - ${s.group}`;
      if (!groups.has(g1)) groups.set(g1, { id: `grp-lvl-${g1}`, name: g1, info: 'إرسال جماعي لكل التخصص', type: 'group' });
      if (!groups.has(g2)) groups.set(g2, { id: `grp-grp-${g2}`, name: g2, info: 'إرسال جماعي للفوج', type: 'group' });
    });
    return Array.from(groups.values());
  }, [institutionData]);

  const normalizeArabic = (str) => {
    return str.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[-]/g, ' ').trim();
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const query = normalizeArabic(text);
    const queryParts = query.split(/\s+/).filter(Boolean);
    const allItems = [...groupOptions, ...institutionData];
    const filtered = allItems.filter(item => {
      if (selectedRecipients.some(r => r.id === item.id)) return false;
      const searchableText = normalizeArabic(item.name + " " + (item.info || ""));
      return queryParts.every(part => searchableText.includes(part));
    });
    setSearchResults(filtered);
  };

  const selectRecipient = (item) => { 
    if(item.type === 'group') {
        addRecipientToBadgeList(item);
    } else {
        setFocusedStudent(item); 
    }
  };

  const addRecipientToBadgeList = (item) => {
    if (!selectedRecipients.find(r => r.id === item.id)) {
      setSelectedRecipients([...selectedRecipients, item]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setFocusedStudent(null);
  };

  const removeRecipient = (id) => setSelectedRecipients(selectedRecipients.filter(r => r.id !== id));

  const handleSendMessage = () => {
    if (selectedRecipients.length === 0 || !messageTitle || !messageBody) {
      Alert.alert("تنبيه", "الرجاء تحديد مستلم واحد على الأقل وملء الحقول.");
      return;
    }
    
    const notificationData = {
      title: messageTitle,
      body: messageBody,
      sender: teacherName, 
      timestamp: Date.now(),
      isRead: false
    };

    Alert.alert("تأكيد البث", `إرسال الرسالة باسم (${teacherName})؟`, [
      { text: "تراجع" },
      { text: "إرسال الآن", onPress: () => {
        selectedRecipients.forEach(recipient => {
          if (recipient.type === 'student') {
            push(ref(database, `student_notifications/${recipient.id}`), notificationData);
          } else {
            institutionData.forEach(s => {
              const studentCriteria = normalizeArabic(`${s.level} - ${s.specialty} - ${s.group}`);
              const recipientName = normalizeArabic(recipient.name);
              if (studentCriteria.includes(recipientName)) {
                push(ref(database, `student_notifications/${s.id}`), notificationData);
              }
            });
          }
        });
        Alert.alert("نجاح", "تم الإرسال بنجاح! 🚀");
        setSelectedRecipients([]); setMessageTitle(''); setMessageBody('');
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>➔ عودة</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>المراسلات - {teacherName}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'inbox' && styles.activeTabButton]} onPress={() => setActiveTab('inbox')}><Text style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>📬 بريد الإدارة</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'send' && styles.activeTabButton]} onPress={() => setActiveTab('send')}><Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>📣 إرسال ذكي</Text></TouchableOpacity>
      </View>

      <View style={{flex: 1}}>
        <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
          {activeTab === 'send' ? (
            <View style={styles.formWrapper}>
              <Text style={styles.sectionLabel}>إلى (طالب، فوج، أو تخصص):</Text>
              {selectedRecipients.length > 0 && (
                <View style={styles.tokenContainer}>
                  {selectedRecipients.map(r => (
                    <TouchableOpacity key={r.id} style={[styles.tokenBadge, r.type === 'group' && {backgroundColor: '#dcfce7', borderColor: '#86efac'}]} onPress={() => removeRecipient(r.id)}>
                      <Text style={styles.tokenCross}>✕</Text>
                      <Text style={styles.tokenText}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TextInput style={styles.input} placeholder="ابحث باسم الطالب أو المجموعة..." value={searchQuery} onChangeText={handleSearchChange} />
              
              <View style={{marginTop: searchResults.length > 0 ? 210 : 0}}>
                <TextInput style={styles.input} placeholder="عنوان التنبيه" value={messageTitle} onChangeText={setMessageTitle} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="نص الرسالة..." multiline value={messageBody} onChangeText={setMessageBody} />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}><Text style={styles.sendButtonText}>📢 بث التنبيه الفوري</Text></TouchableOpacity>
              </View>
              
              {focusedStudent && (
                <View style={styles.focusCard}>
                  <Text style={styles.focusTitle}>🔐 بطاقة التحقق من هوية الطالب</Text>
                  <Text style={styles.focusName}>{focusedStudent.name}</Text>
                  <Text style={styles.focusDetail}>🆔 رقم التسجيل: {focusedStudent.id}</Text>
                  <Text style={styles.focusDetail}>🏫 {focusedStudent.level} | {focusedStudent.specialty} | {focusedStudent.group}</Text>
                  <View style={styles.focusActions}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => addRecipientToBadgeList(focusedStudent)}><Text style={styles.confirmBtnText}>تأكيد وإضافة</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setFocusedStudent(null)}><Text style={styles.cancelBtnText}>إلغاء</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            adminMessages.length > 0 ? (
              adminMessages.map(msg => (
                <View key={msg.id} style={styles.adminMsgCard}>
                  <Text style={{fontWeight: 'bold', marginBottom: 5, textAlign: 'right'}}>{msg.title}</Text>
                  <Text style={styles.msgBody}>{msg.body}</Text>
                </View>
              ))
            ) : (
              <View style={styles.adminMsgCard}><Text style={styles.msgBody}>لا توجد رسائل إدارية جديدة.</Text></View>
            )
          )}
        </ScrollView>

        {searchResults.length > 0 && (
          <View style={styles.floatingSuggestionsBox}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((item) => (
                <TouchableOpacity key={item.id} style={styles.suggestionItem} onPress={() => selectRecipient(item)}>
                  <Text style={styles.suggestionName}>{item.type === 'group' ? '👥 ' : '👤 '}{item.name}</Text>
                  <Text style={styles.suggestionInfo}>{item.info}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', margin: 16, borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTabButton: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#1e3a8a' },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  formWrapper: { backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', marginBottom: 30 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, textAlign: 'right' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, textAlign: 'right', backgroundColor: '#f8fafc', fontSize: 15, color: '#334155' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  sendButton: { width: '100%', height: 52, backgroundColor: '#1e3a8a', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tokenContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 10 },
  tokenBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, marginLeft: 6, marginBottom: 6 },
  tokenText: { fontSize: 13, color: '#1e4ed8', fontWeight: '600' },
  tokenCross: { fontSize: 12, color: '#ef4444', marginRight: 6, fontWeight: 'bold' },
  floatingSuggestionsBox: { position: 'absolute', top: 125, left: 30, right: 30, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, zIndex: 9999, elevation: 20, maxHeight: 200 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  suggestionInfo: { fontSize: 11, color: '#64748b', marginTop: 2, textAlign: 'right' },
  focusCard: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#10b981', marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  focusTitle: { fontSize: 14, fontWeight: 'bold', color: '#166534', textAlign: 'right', marginBottom: 8 },
  focusName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', textAlign: 'right', marginBottom: 4 },
  focusDetail: { fontSize: 12, color: '#374151', textAlign: 'right', marginBottom: 4 },
  focusActions: { flexDirection: 'row-reverse', marginTop: 12, justifyContent: 'flex-start' },
  confirmBtn: { backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 },
  confirmBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#cbd5e1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtnText: { color: '#334155', fontSize: 12, fontWeight: 'bold' },
  adminMsgCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 4, borderRightColor: '#3b82f6' },
  msgBody: { fontSize: 13, color: '#475569', textAlign: 'right' }
});