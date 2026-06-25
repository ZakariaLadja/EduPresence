import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch } from 'react-native';

const INITIAL_ROOMS = [
  { id: '1', name: 'القاعة 102', status: 'متاحة', issues: 'لا يوجد' },
  { id: '2', name: 'المدرج ب', status: 'قيد الصيانة', issues: 'عطل في الداتاشو' },
  { id: '3', name: 'المخبر 03', status: 'متاحة', issues: 'لا يوجد' },
];

export default function RoomManagement() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);

  const toggleRoomStatus = (id) => {
    setRooms(rooms.map(room => 
      room.id === id ? { ...room, status: room.status === 'متاحة' ? 'مغلقة' : 'متاحة' } : room
    ));
    Alert.alert("تحديث", "تم تغيير حالة القاعة بنجاح.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>إدارة حالة القاعات</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.roomCard}>
            <View>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomIssues}>تنبيه: {item.issues}</Text>
            </View>
            <View style={styles.statusSection}>
              <Text style={[styles.statusText, { color: item.status === 'متاحة' ? '#10b981' : '#ef4444' }]}>
                {item.status}
              </Text>
              <Switch 
                value={item.status === 'متاحة'} 
                onValueChange={() => toggleRoomStatus(item.id)} 
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  roomCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  roomName: { fontSize: 16, fontWeight: 'bold' },
  roomIssues: { fontSize: 12, color: '#64748b', marginTop: 4 },
  statusSection: { alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 }
});