import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// استيراد شاشات الأساتذة والطلاب
import TeacherLogin from './src/screens/TeacherLogin';
import StudentLogin from './src/screens/StudentLogin';
import TeacherHome from './src/screens/TeacherHome';
import TeacherCategories from './src/screens/TeacherCategories';
import TeacherSchedule from './src/screens/TeacherSchedule';
import TeacherAttendance from './src/screens/TeacherAttendance';
import TeacherMessages from './src/screens/TeacherMessages';
import TeacherReschedule from './src/screens/TeacherReschedule';
import TeacherSubjects from './src/screens/TeacherSubjects';
import StudentHome from './src/screens/StudentHome';
import ArchiveSelection from './src/screens/ArchiveSelection';
import ArchiveSessionsList from './src/screens/ArchiveSessionsList.jsx';
import ArchiveDetail from './src/screens/ArchiveDetail';
import StudentAttendanceList from './src/screens/StudentAttendanceList';


// استيراد شاشات لوحة تحكم الإدارة
import AdminLogin from './src/screens/AdminLogin';
import AdminDashboard from './src/screens/AdminDashboard';
import AdminAddStudent from './src/screens/AdminAddStudent';
import AdminAddTeacher from './src/screens/AdminAddTeacher';
import AdminManageSessions from './src/screens/AdminManageSessions';
import AdminRoomStatus from './src/screens/AdminRoomStatus';
import AdminRoomChange from './src/screens/AdminRoomChange';
import AdminMessagingCenter from './src/screens/AdminMessagingCenter';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TeacherLogin" screenOptions={{ headerShown: false }}>
        {/* بوابات الدخول */}
        <Stack.Screen name="TeacherLogin" component={TeacherLogin} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        
        {/* واجهات الأستاذ */}
        <Stack.Screen name="TeacherHome" component={TeacherHome} />
        <Stack.Screen name="TeacherCategories" component={TeacherCategories} />
        <Stack.Screen name="TeacherSchedule" component={TeacherSchedule} />
        <Stack.Screen name="TeacherAttendance" component={TeacherAttendance} />
        <Stack.Screen name="TeacherMessages" component={TeacherMessages} />
        <Stack.Screen name="TeacherReschedule" component={TeacherReschedule} />
        <Stack.Screen name="TeacherSubjects" component={TeacherSubjects} />
        <Stack.Screen name="ArchiveSessionsList" component={ArchiveSessionsList} />
        <Stack.Screen name="StudentAttendanceList" component={StudentAttendanceList} />

        {/* واجهات الطالب */}
        <Stack.Screen name="StudentHome" component={StudentHome} />

        {/* واجهات الإدارة (Admin Dashboard) */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ArchiveSelection" component={ArchiveSelection} options={{ title: 'اختيار المقياس' }} />
        <Stack.Screen name="ArchiveDetail" component={ArchiveDetail} />
        <Stack.Screen name="AdminAddStudent" component={AdminAddStudent} />
        <Stack.Screen name="AdminAddTeacher" component={AdminAddTeacher} />
        <Stack.Screen name="AdminManageSessions" component={AdminManageSessions} />
        <Stack.Screen name="AdminRoomStatus" component={AdminRoomStatus} />
        <Stack.Screen name="AdminRoomChange" component={AdminRoomChange} />
        <Stack.Screen name="AdminMessagingCenter" component={AdminMessagingCenter} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}