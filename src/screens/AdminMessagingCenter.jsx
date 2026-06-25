import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ref, onValue, push } from "firebase/database";
import { database } from '../firebaseConfig'; 

export default function CombinedMessages({ navigation }) {
  const [activeTab, setActiveTab] = useState('teachers'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [focusedRecipient, setFocusedRecipient] = useState(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setFocusedRecipient(null); 
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipients([]);

    const path = activeTab === 'teachers' ? 'users/teachers' : 'students';
    const dataRef = ref(database, path);
    
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key, 
          ...data[key],
          type: activeTab === 'teachers' ? 'teacher' : 'student',
          info: activeTab === 'students' ? `${data[key].level || ''} | ${data[key].specialty || ''} | ${data[key].group || ''}` : 'أستاذ'
        }));
        setAllUsers(list);
      } else {
        setAllUsers([]);
      }
      setLoading(false);
    });
  }, [activeTab]);

  const groupOptions = useMemo(() => {
    if (activeTab === 'students') {
      const groups = new Map();
      allUsers.forEach(s => {
        const g1 = `${s.level} - ${s.specialty}`;
        const g2 = `${s.level} - ${s.specialty} - ${s.group}`;
        if (!groups.has(g1)) groups.set(g1, { id: `grp-lvl-${g1}`, name: g1, info: 'إرسال جماعي للتخصص', type: 'group' });
        if (!groups.has(g2)) groups.set(g2, { id: `grp-grp-${g2}`, name: g2, info: 'إرسال جماعي للفوج', type: 'group' });
      });
      return Array.from(groups.values());
    } else {
      // خيار إضافي لكل الأساتذة
      return [{ id: 'all-teachers', name: 'جميع الأساتذة', info: 'إرسال تعميمي لكافة الأساتذة', type: 'group' }];
    }
  }, [allUsers, activeTab]);

  const normalizeArabic = (str) => str.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[-]/g, ' ').trim();

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (!text.trim()) { setSearchResults([]); return; }
    const query = normalizeArabic(text);
    const allItems = [...groupOptions, ...allUsers];
    const filtered = allItems.filter(item => {
      if (selectedRecipients.some(r => r.id === item.id)) return false;
      return normalizeArabic(item.name + " " + (item.info || "")).includes(query);
    });
    setSearchResults(filtered);
  };

  const selectRecipient = (item) => { 
    if(item.type === 'group') addRecipientToBadgeList(item);
    else setFocusedRecipient(item);
  };

  const addRecipientToBadgeList = (item) => {
    if (!selectedRecipients.find(r => r.id === item.id)) setSelectedRecipients([...selectedRecipients, item]);
    setSearchQuery(''); setSearchResults([]); setFocusedRecipient(null);
  };

  const removeRecipient = (id) => setSelectedRecipients(selectedRecipients.filter(r => r.id !== id));

  const handleSendMessage = () => {
    if (selectedRecipients.length === 0 || !messageTitle || !messageBody) {
      Alert.alert("تنبيه", "الرجاء تحديد مستلم واحد على الأقل وملء الحقول.");
      return;
    }
    
    const notificationData = { title: messageTitle, body: messageBody, sender: "إدارة الكلية", timestamp: Date.now(), isRead: false };
    
    Alert.alert("تأكيد الإرسال", "هل أنت متأكد من إرسال الرسالة؟", [
      { text: "تراجع" },
      { text: "إرسال", onPress: () => {
        selectedRecipients.forEach(r => {
          if (r.id === 'all-teachers') {
            allUsers.forEach(t => push(ref(database, `teacher_notifications/${t.id}`), notificationData));
          } else if (r.type === 'group') {
            // الحل: مطابقة الخصائص مباشرة بدلاً من النصوص
            allUsers.forEach(s => {
              let isMatch = false;
              // إذا كان الخيار يمثل تخصص (level - specialty)
              if (r.name.includes(' - ') && !r.name.split(' - ')[2]) {
                const [lvl, spec] = r.name.split(' - ');
                if (s.level === lvl && s.specialty === spec) isMatch = true;
              } 
              // إذا كان الخيار يمثل فوج (level - specialty - group)
              else {
                const [lvl, spec, grp] = r.name.split(' - ');
                if (s.level === lvl && s.specialty === spec && s.group === grp) isMatch = true;
              }

              if (isMatch) {
                push(ref(database, `student_notifications/${s.id}`), notificationData);
              }
            });
          } else {
            const path = r.type === 'teacher' ? 'teacher_notifications' : 'student_notifications';
            push(ref(database, `${path}/${r.id}`), notificationData);
          }
        });
        Alert.alert("نجاح", "تم الإرسال بنجاح 🚀");
        setSelectedRecipients([]); setMessageTitle(''); setMessageBody('');
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>➔ عودة</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>مركز المراسلات الموحد</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'teachers' && styles.activeTabButton]} onPress={() => setActiveTab('teachers')}><Text style={activeTab === 'teachers' ? styles.activeTabText : styles.tabText}>الأساتذة</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'students' && styles.activeTabButton]} onPress={() => setActiveTab('students')}><Text style={activeTab === 'students' ? styles.activeTabText : styles.tabText}>الطلبة</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formWrapper}>
          <Text style={styles.sectionLabel}>المستلمون:</Text>
          <View style={styles.tokenContainer}>
            {selectedRecipients.map(r => (
              <TouchableOpacity key={r.id} style={styles.tokenBadge} onPress={() => removeRecipient(r.id)}>
                <Text style={styles.tokenCross}>✕</Text><Text style={styles.tokenText}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="ابحث..." value={searchQuery} onChangeText={handleSearchChange} />
          <TextInput style={styles.input} placeholder="عنوان الرسالة" value={messageTitle} onChangeText={setMessageTitle} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="النص..." multiline value={messageBody} onChangeText={setMessageBody} />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}><Text style={styles.sendButtonText}>إرسال 📢</Text></TouchableOpacity>
          
          {focusedRecipient && (
            <View style={styles.focusCard}>
              <Text style={styles.focusName}>{focusedRecipient.name}</Text>
              {activeTab === 'students' ? (
                <>
                  <Text style={styles.focusDetail}>رقم التسجيل: {focusedRecipient.id}</Text>
                  <Text style={styles.focusDetail}>{focusedRecipient.level} | {focusedRecipient.specialty} | {focusedRecipient.group}</Text>
                </>
              ) : (
                <Text style={styles.focusDetail}>البريد الإلكتروني: {focusedRecipient.email || 'غير متوفر'}</Text>
              )}
              <View style={styles.focusActions}>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => addRecipientToBadgeList(focusedRecipient)}><Text style={styles.confirmBtnText}>إضافة</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFocusedRecipient(null)}><Text style={styles.cancelBtnText}>إلغاء</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {searchResults.length > 0 && (
        <View style={styles.floatingBox}>
          <ScrollView>
            {searchResults.map(item => (
              <TouchableOpacity key={item.id} style={styles.suggestionItem} onPress={() => selectRecipient(item)}>
                <Text style={styles.suggestionName}>{item.type === 'group' ? '👥' : '👤'} {item.name}</Text>
                <Text style={styles.suggestionInfo}>{item.info}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', margin: 16, backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  activeTabButton: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#64748b', fontWeight: 'bold' },
  activeTabText: { color: '#1e3a8a', fontWeight: 'bold' },
  contentContainer: { padding: 16 },
  formWrapper: { backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, textAlign: 'right', backgroundColor: '#f8fafc' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  sendButton: { backgroundColor: '#1e3a8a', padding: 16, borderRadius: 12, alignItems: 'center' },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
  tokenContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 10 },
  tokenBadge: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 20, padding: 8, marginLeft: 6, marginBottom: 6 },
  tokenCross: { color: 'red', marginRight: 5 },
  tokenText: { fontWeight: 'bold' },
  floatingBox: { position: 'absolute', top: 250, left: 20, right: 20, backgroundColor: '#fff', elevation: 15, borderRadius: 10, maxHeight: 200, borderWidth: 1, borderColor: '#e2e8f0' },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionName: { fontWeight: 'bold', textAlign: 'right' },
  suggestionInfo: { fontSize: 11, color: '#64748b', textAlign: 'right' },
  focusCard: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: '#10b981' },
  focusName: { fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  focusDetail: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 4 },
  focusActions: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  confirmBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, marginHorizontal: 5 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#cbd5e1', padding: 10, borderRadius: 8, marginHorizontal: 5 },
  cancelBtnText: { color: '#334155', fontWeight: 'bold' },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { fontWeight: 'bold' }
});