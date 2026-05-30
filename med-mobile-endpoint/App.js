import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, Vibration, Dimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
// NOTE: This project intentionally runs without `react-native-gesture-handler`.
import {
  MEDICATION_ACTION_MISSED,
  MEDICATION_ACTION_TAKEN,
  claimDeviceLinkAsync,
  configureAndroidChannel,
  registerForPushNotificationsAsync,
  subscribeToNotificationEvents,
} from './src/notifications';
import { appointmentAPI, authAPI, userAPI, scheduleAPI, trackingAPI, pushAPI, setMobileApiAuthToken, unwrapApiData, saveMobileAuthSession, resolveApiBaseUrl } from './src/api/api';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './src/authSession';

const { width } = Dimensions.get('window');

const COLORS = {
  brand: '#10b981',
  brandDark: '#064e3b',
  brandLight: '#ecfdf5',
  brandAccent: '#34d399',
  surface: '#f9fafb',
  white: '#ffffff',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate600: '#475569',
  emerald500: '#10b981',
  emerald900: '#064e3b',
  emerald100: '#d1fae5',
  rose500: '#f43f5e',
  rose700: '#be123c',
  black60: 'rgba(0,0,0,0.6)',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pushStatus, setPushStatus] = useState('Checking local session...');
  const [alerts, setAlerts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmPayload, setAlarmPayload] = useState(null);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [sound, setSound] = useState(null);

  const hasSignedInUser = useMemo(() => Boolean(currentUser?._id), [currentUser]);
  const isCaretaker = useMemo(() => String(currentUser?.role || '').toLowerCase() === 'caretaker', [currentUser]);

  useEffect(() => {
    configureAndroidChannel().catch(() => { });
  }, []);

  const buildAlarmPayload = (content) => {
    const data = content?.data || {};
    const type = data?.type;
    const isReminder = type === 'SCHEDULED_REMINDER' || type === 'FINAL_REMINDER' || type === 'MISSED_DOSE' || data?.isTest;
    if (!isReminder) return null;

    return {
      medicationId: data?.medicationId || '',
      trackingLogId: data?.trackingLogId || '',
      medicationName: data?.medicationName || content?.title || 'Medication',
      scheduledTime: data?.scheduledTime || new Date().toISOString(),
      type,
      title: content?.title || 'Medication reminder',
      body: content?.body || 'It is time to take your medication.',
      customMessage: data?.customMessage || null,
      customAudio: data?.customAudio || null,
    };
  };

  const playAlarmSound = async (audioPath) => {
    if (!audioPath) return;
    try {
      const baseUrl = resolveApiBaseUrl().replace('/api', '');
      const fullUrl = audioPath.startsWith('http') ? audioPath : `${baseUrl}/${audioPath}`;
      console.log('Loading Sound', fullUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true, isLooping: false }
      );
      setSound(newSound);
    } catch (err) {
      console.error('Failed to play sound', err);
    }
  };

  const stopAlarmSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const showAlarm = (payload) => {
    if (!payload) return;
    setAlarmPayload(payload);
    setAlarmVisible(true);
    Vibration.vibrate([0, 400, 250, 400]);
    if (payload.customAudio) {
      playAlarmSound(payload.customAudio);
    }
  };

  const addIncomingAlert = (content, fallbackTitle, fallbackBody) => {
    setAlerts((prev) => [
      {
        title: content.title || fallbackTitle,
        body: content.body || fallbackBody,
        type: content.data?.type,
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const openReminderFromNotification = (content) => {
    const payload = buildAlarmPayload(content);
    if (!payload) return false;
    setActiveScreen('actionCenter');
    showAlarm(payload);
    return true;
  };

  const openAppointmentFromNotification = (content) => {
    const type = content?.data?.type;
    if (type !== 'APPOINTMENT_REMINDER') return false;
    setActiveScreen('appointments');
    return true;
  };

  const submitAlarmAction = async (status, payload = alarmPayload) => {
    if (!payload?.medicationId) {
      setAlarmVisible(false);
      return;
    }

    try {
      await trackingAPI.recordIntake({
        medicationId: payload.medicationId,
        trackingLogId: payload.trackingLogId || '',
        medicationName: payload.medicationName || 'Medication',
        scheduledTime: payload.scheduledTime || new Date().toISOString(),
        takenTime: new Date().toISOString(),
        status,
        patientId: currentUser?._id,
      });
      await refreshSchedules();
      setAlarmVisible(false);
      setAlarmPayload(null);
      await stopAlarmSound();
    } catch (error) {
      Alert.alert('Unable to update dose', error?.response?.data?.message || error?.message || 'Please try again.');
    }
  };

  useEffect(() => subscribeToNotificationEvents(
    (notification) => {
      const content = notification?.request?.content || {};
      addIncomingAlert(content, 'Medication alert', 'You have a new reminder.');
      if (!openAppointmentFromNotification(content)) {
        openReminderFromNotification(content);
      }
    },
    (response) => {
      const content = response?.notification?.request?.content || {};
      const actionId = response?.actionIdentifier;
      const payload = buildAlarmPayload(content);

      addIncomingAlert(content, 'Opened notification', 'You opened a medication alert.');

      if (actionId === MEDICATION_ACTION_TAKEN) {
        submitAlarmAction('Taken', payload).catch(() => { });
        return;
      }
      if (actionId === MEDICATION_ACTION_MISSED) {
        submitAlarmAction('Missed', payload).catch(() => { });
        return;
      }

      if (!openAppointmentFromNotification(content) && !openReminderFromNotification(content)) {
        setActiveScreen('actionCenter');
      }
    }
  ), [currentUser, alarmPayload]);

  useEffect(() => {
    const bootstrapNotificationOpen = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        const content = lastResponse?.notification?.request?.content || null;
        if (!content) return;
        if (!openAppointmentFromNotification(content)) {
          openReminderFromNotification(content);
        }
      } catch {
        // Ignore last-response bootstrap failures.
      }
    };

    bootstrapNotificationOpen();
  }, []);

  const normalizeScheduleData = (payload) => (Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);

  const loadReminderData = async (user) => {
    const role = String(user?.role || '').toLowerCase();
    const caretakerView = role === 'caretaker';

    if (!caretakerView) {
      const scheduleResponse = await scheduleAPI.getPatientMeds(user._id);
      const scheduleData = unwrapApiData(scheduleResponse);
      setSchedules(normalizeScheduleData(scheduleData));
      return;
    }

    try {
      const allMedsResponse = await scheduleAPI.getCaretakerMeds();
      const allMedsData = unwrapApiData(allMedsResponse);
      const allMeds = Array.isArray(allMedsData?.medications) ? allMedsData.medications : [];
      setSchedules(allMeds);
      return;
    } catch {
      // Fallback to per-patient requests for compatibility with older backend versions.
    }

    const patientsResponse = await userAPI.getMyPatients();
    const patientsData = unwrapApiData(patientsResponse);
    const patients = Array.isArray(patientsData?.patients) ? patientsData.patients : [];

    if (!patients.length) {
      setSchedules([]);
      return;
    }

    const patientSchedules = await Promise.all(
      patients.map(async (patient) => {
        try {
          const response = await scheduleAPI.getPatientMeds(patient._id);
          const data = unwrapApiData(response);
          return normalizeScheduleData(data).map((schedule) => ({
            ...schedule,
            patientId: schedule.patientId || patient._id,
            patientName: schedule.patientName || patient.name || 'Assigned patient',
          }));
        } catch {
          return [];
        }
      })
    );

    setSchedules(patientSchedules.flat());
  };

  const loadAppointmentData = async (user) => {
    const role = String(user?.role || '').toLowerCase();
    const caretakerView = role === 'caretaker';

    if (!caretakerView) {
      const response = await appointmentAPI.getAppointments(user._id);
      const data = unwrapApiData(response);
      const list = Array.isArray(data?.appointments) ? data.appointments : [];
      setAppointments(list);
      return;
    }

    const patientsResponse = await userAPI.getMyPatients();
    const patientsData = unwrapApiData(patientsResponse);
    const patients = Array.isArray(patientsData?.patients) ? patientsData.patients : [];
    if (!patients.length) {
      setAppointments([]);
      return;
    }

    const patientAppointments = await Promise.all(
      patients.map(async (patient) => {
        try {
          const response = await appointmentAPI.getAppointments(patient._id);
          const data = unwrapApiData(response);
          const list = Array.isArray(data?.appointments) ? data.appointments : [];
          return list.map((item) => ({
            ...item,
            patientId: patient._id,
            patientName: patient.name || item.patientName || 'Assigned patient',
          }));
        } catch {
          return [];
        }
      })
    );

    setAppointments(patientAppointments.flat());
  };

  const registerPushAndLoad = async (user, token, shouldPersist = true) => {
    if (!user?._id || !token) return false;

    setCurrentUser(user);
    setMobileApiAuthToken(token);

    if (shouldPersist) {
      await saveAuthSession({ token, user });
      await saveMobileAuthSession({ token, user });
    }

    let pushReady = true;
    try {
      const pushResult = await registerForPushNotificationsAsync(user);
      setPushStatus(pushResult.message || 'Push ready');
    } catch (error) {
      pushReady = false;
      const message = error?.message || '';
      if (/network\s*error|network request failed/i.test(message)) {
        setPushStatus('Linked successfully. Push registration failed, retrying in background.');
      } else {
        setPushStatus(`Linked successfully. Push setup warning: ${message || 'Unknown issue'}`);
      }
    }

    try {
      // Load primary medication dashboard data first for faster first paint.
      await loadReminderData(user);
    } catch (error) {
      // Keep linked session active even if initial schedule fetch fails once.
      const message = error?.response?.data?.message || error?.message || '';
      setPushStatus(`Linked successfully. Schedule sync pending: ${message || 'temporary network issue'}`);
      setSchedules([]);
    }

    setAppointments([]);
    if (pushReady) {
      setPushStatus((prev) => (prev?.includes('Linked successfully') ? 'Device linked and reminders are ready.' : prev));
    }
    return true;
  };

  const bootstrapFromSavedSession = async () => {
    const storedSession = await loadAuthSession();
    if (!storedSession?.token || !storedSession?.user?._id) return false;
    return registerPushAndLoad(storedSession.user, storedSession.token, false);
  };

  const bootstrapFromServerSession = async () => {
    try {
      const sessionResponse = await authAPI.isAuthenticated();
      const sessionData = unwrapApiData(sessionResponse);
      if (!sessionData?.success || !sessionData?.token || !sessionData?.user?._id) return false;
      return registerPushAndLoad(sessionData.user, sessionData.token, true);
    } catch {
      // Not authenticated (or transient failure) should not block fallback bootstrap paths.
      return false;
    }
  };

  const bootstrapFromExchangeSession = async () => {
    try {
      const exchangeResponse = await authAPI.exchangeSession();
      const exchangeData = unwrapApiData(exchangeResponse);
      if (!exchangeData?.success || !exchangeData?.token || !exchangeData?.user?._id) return false;
      return registerPushAndLoad(exchangeData.user, exchangeData.token, true);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);

        if (await bootstrapFromSavedSession()) {
          return;
        }

        if (await bootstrapFromServerSession()) {
          return;
        }

        if (await bootstrapFromExchangeSession()) {
          return;
        }

        await clearAuthSession();
        setCurrentUser(null);
        setSchedules([]);
        setAppointments([]);
        setPushStatus('No saved session found. Sign in on the web portal first.');
      } catch (error) {
        await clearAuthSession();
        setCurrentUser(null);
        setSchedules([]);
        setAppointments([]);
        setPushStatus('No saved session found. Sign in on the web portal first.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const refreshSchedules = async () => {
    if (!hasSignedInUser) return;
    await loadReminderData(currentUser);
  };

  const refreshAppointments = async () => {
    if (!hasSignedInUser) return;
    await loadAppointmentData(currentUser);
  };

  useEffect(() => {
    if (!hasSignedInUser || activeScreen !== 'appointments') return;
    refreshAppointments().catch(() => { });
  }, [activeScreen, hasSignedInUser, currentUser]);

  const markReminder = async (item, status) => {
    if (!item?._id) return;

    try {
      await trackingAPI.recordIntake({
        medicationId: item._id,
        trackingLogId: item.trackingLogId || '',
        medicationName: item.medicationName || item.name || 'Medication',
        scheduledTime: item.scheduledTime || item.time,
        takenTime: new Date().toISOString(),
        status: status === 'Taken' ? 'Taken' : 'Missed',
        patientId: item.patientId || currentUser?._id,
      });

      if (status === 'Taken') {
        await scheduleAPI.confirmTaken(item._id);
      }

      await refreshSchedules();
      setAlerts((prev) => [
        {
          title: `${item.medicationName || 'Medication'} ${status.toLowerCase()}`,
          body: status === 'Taken' ? 'Dose recorded as taken.' : 'Dose recorded as missed.',
          type: status,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    } catch (error) {
      Alert.alert('Unable to update dose', error?.response?.data?.message || error?.message || 'Please try again.');
    }
  };

  const claimLinkCode = async () => {
    const trimmedCode = linkCode.trim().toUpperCase();
    if (!trimmedCode) {
      Alert.alert('Link code required', 'Enter the link code shown on the web portal.');
      return;
    }

    try {
      setLinking(true);
      const claimResult = await claimDeviceLinkAsync({ linkCode: trimmedCode });
      if (!claimResult.success || !claimResult.token || !claimResult.user?._id) {
        throw new Error(claimResult.message || 'Unable to link this device');
      }

      await registerPushAndLoad(claimResult.user, claimResult.token, true);
      setPushStatus('Device linked and reminders are ready.');
      setLinkCode('');
    } catch (error) {
      Alert.alert('Link failed', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const triggerTestNotification = async () => {
    if (!hasSignedInUser || sendingTestPush) return;

    try {
      setSendingTestPush(true);
      const response = await pushAPI.sendTestNotification({
        title: 'Medication test alert',
        body: `Instant test for ${currentUser?.name || 'user'}`,
      });
      const payload = unwrapApiData(response);
      Alert.alert('Test notification sent', payload?.message || 'Check your phone notification tray.');
    } catch (error) {
      const apiPayload = error?.response?.data || {};
      const firstTicketError = apiPayload?.result?.ticketErrors?.[0];
      const detailText = firstTicketError
        ? `${firstTicketError.error}: ${firstTicketError.message}`
        : '';
      const baseMessage = apiPayload?.message || error?.message || 'Please try again.';
      Alert.alert('Test notification failed', detailText ? `${baseMessage}\n${detailText}` : baseMessage);
    } finally {
      setSendingTestPush(false);
    }
  };

  const handleDeepLink = async (url) => {
    if (!url) return;
    const codeFromUrl = (() => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get('code') || '';
      } catch {
        return '';
      }
    })();
    if (!codeFromUrl || hasSignedInUser || linking) return;
    const normalizedCode = String(codeFromUrl).toUpperCase();
    setLinkCode(normalizedCode);
    try {
      setLinking(true);
      const claimResult = await claimDeviceLinkAsync({ linkCode: normalizedCode });
      if (!claimResult.success || !claimResult.token || !claimResult.user?._id) {
        throw new Error(claimResult.message || 'Unable to link this device');
      }

      await registerPushAndLoad(claimResult.user, claimResult.token, true);
      setPushStatus('Device linked and reminders are ready.');
      setLinkCode('');
    } catch (error) {
      Alert.alert('Link failed', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally {
      setLinking(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const readInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (isMounted) {
          await handleDeepLink(initialUrl);
        }
      } catch {
        // Ignore deep-link bootstrap errors.
      }
    };

    readInitialUrl();

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url).catch(() => { });
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [hasSignedInUser, linking]);

  const getTodayDoseCount = () => {
    const today = new Date();
    return schedules.filter((item) => {
      const val = item.scheduledTime || item.time;
      if (!val) return false;
      const dt = new Date(val);
      if (Number.isNaN(dt.getTime())) return true;
      return (
        dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate()
      );
    }).length;
  };

  const DashboardScreen = () => (
    <SafeAreaView style={styles.dashboardRoot}>
      <View style={styles.dashboardContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTextLight}>Good Morning,</Text>
            <Text style={styles.headerTextBrand}>{currentUser?.name || 'Care Partner'}!</Text>
          </View>
        </View>

        {/* Daily Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Summary</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
              {getTodayDoseCount()} <Text style={styles.progressLabel}>doses left</Text>
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>In Progress</Text>
            </View>
          </View>
        </View>

        {/* Status Widget */}
        <View style={styles.statusWidget}>
          <View style={styles.statusHeader}>
            <View style={styles.statusDot} />
            <Text style={styles.statusTitle}>System Active</Text>
          </View>
          <Text style={styles.statusText}>Device: {currentUser?._id || 'Not linked'}</Text>
          <Text style={styles.statusSubtext}>{pushStatus}</Text>

          {__DEV__ && hasSignedInUser && (
            <Pressable
              style={({ pressed }) => [styles.testButton, pressed && styles.pressedOpacity]}
              onPress={triggerTestNotification}
              disabled={sendingTestPush}
            >
              <Text style={styles.testButtonText}>{sendingTestPush ? 'Sending...' : 'Send test notification'}</Text>
            </Pressable>
          )}
        </View>

        {!hasSignedInUser && (
          <View style={styles.linkCard}>
            <Text style={styles.linkTitle}>Link Device</Text>
            <Text style={styles.linkDescription}>Enter the code from the web portal to sync your medications.</Text>
            <TextInput
              style={styles.linkInput}
              value={linkCode}
              onChangeText={setLinkCode}
              placeholder="A1B2C3D4"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!linking}
            />
            <Pressable
              style={({ pressed }) => [styles.linkButton, linking && styles.disabledButton, pressed && styles.pressedOpacity]}
              onPress={claimLinkCode}
              disabled={linking}
            >
              <Text style={styles.linkButtonText}>{linking ? 'Linking...' : 'Link Now'}</Text>
            </Pressable>
          </View>
        )}

        {/* Navigation Actions */}
        <View style={styles.navActions}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.pressedScale]}
            onPress={() => {
              Vibration.vibrate(30);
              setActiveScreen('actionCenter');
            }}
          >
            <Text style={styles.navButtonText}>MY SCHEDULE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.pressedScale]}
            onPress={() => {
              Vibration.vibrate(20);
              setActiveScreen('appointments');
            }}
          >
            <Text style={styles.navButtonText}>DOCTORS</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderMedicationCard = ({ item }) => (
    <View style={styles.medCard}>
      <View style={styles.medCardHeader}>
        <View style={styles.flex1}>
          <Text style={styles.medName}>{item.medicationName || item.name || 'Medication'}</Text>
          <Text style={styles.medTime}>{item.scheduledTime || item.time || 'Not set'}</Text>
        </View>
        <View style={styles.dosageBadge}>
          <Text style={styles.dosageBadgeText}>{item.dosage || '1 Dose'}</Text>
        </View>
      </View>

      <Text style={styles.patientName}>Patient: {item.patientName || currentUser?.name || 'Assigned patient'}</Text>

      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.takenButton, pressed && styles.pressedOpacity]}
          onPress={() => markReminder(item, 'Taken')}
        >
          <Text style={styles.buttonTextWhite}>TAKEN</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.missedButton, pressed && styles.pressedOpacity]}
          onPress={() => markReminder(item, 'Missed')}
        >
          <Text style={styles.missedButtonText}>MISSED</Text>
        </Pressable>
      </View>
    </View>
  );

  const ActionCenterScreen = () => (
    <SafeAreaView style={styles.screenRoot}>
      <View style={styles.screenContainer}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Active Alerts</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => setActiveScreen('dashboard')}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No active reminders at the moment.</Text>
          </View>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={(item, index) => `${item._id || item.medicationName || 'schedule'}-${index}`}
            renderItem={renderMedicationCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );

  const renderAppointmentCard = ({ item }) => (
    <View style={styles.appointmentCard}>
      <Text style={styles.doctorName}>Dr. {item.doctor || 'Unknown'}</Text>
      <Text style={styles.appointmentTime}>{item.date ? new Date(item.date).toLocaleString() : 'Not set'}</Text>

      <View style={styles.infoRow}>
        <View style={styles.infoDot} />
        <Text style={styles.infoText}>Specialty: {item.doctorSpecialty || 'General'}</Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoDot} />
        <Text style={styles.infoText}>Hospital: {item.hospitalName || 'Health Center'}</Text>
      </View>

      {!!item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>Note: {item.notes}</Text>
        </View>
      )}
    </View>
  );

  const AppointmentScreen = () => (
    <SafeAreaView style={styles.screenRoot}>
      <View style={styles.screenContainer}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Doctors</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setActiveScreen('dashboard');
            }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyText}>
              {isCaretaker ? 'Patient appointments will appear here.' : 'Your appointments will appear here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item, index) => `${item._id || item.doctor || 'appointment'}-${index}`}
            renderItem={renderAppointmentCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {activeScreen === 'actionCenter' ? <ActionCenterScreen /> : null}
      {activeScreen === 'appointments' ? <AppointmentScreen /> : null}
      {activeScreen === 'dashboard' ? <DashboardScreen /> : null}

      <Modal visible={alarmVisible} transparent animationType="slide" onRequestClose={() => setAlarmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{alarmPayload?.title || 'Medication reminder'}</Text>
            <Text style={styles.modalBody}>{alarmPayload?.customMessage || alarmPayload?.body || 'Please confirm this dose.'}</Text>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalActionButton, styles.modalActionTaken, pressed && styles.pressedOpacity]}
                onPress={() => submitAlarmAction('Taken')}
              >
                <Text style={styles.modalActionText}>TAKEN</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalActionButton, styles.modalActionMissed, pressed && styles.pressedOpacity]}
                onPress={() => submitAlarmAction('Missed')}
              >
                <Text style={styles.modalActionText}>MISSED</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.modalDismiss, pressed && styles.pressedOpacity]}
              onPress={() => { setAlarmVisible(false); stopAlarmSound(); }}
            >
              <Text style={styles.dismissText}>Dismiss for now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  dashboardRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  dashboardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    itemsCenter: 'center',
    marginBottom: 32,
  },
  headerTextLight: {
    color: COLORS.brandDark,
    fontSize: 30,
    fontWeight: '800',
  },
  headerTextBrand: {
    color: COLORS.brand,
    fontSize: 30,
    fontWeight: '800',
  },
  progressCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.brandAccent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  progressTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressCount: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
  },
  progressLabel: {
    color: COLORS.brandLight,
    fontSize: 18,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusWidget: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
    marginRight: 8,
  },
  statusTitle: {
    color: COLORS.brandDark,
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusText: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 4,
  },
  statusSubtext: {
    color: COLORS.brandDark,
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.brand,
    fontWeight: 'bold',
  },
  linkCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.brandLight,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  linkTitle: {
    color: COLORS.brandDark,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linkDescription: {
    color: COLORS.slate500,
    fontSize: 14,
    marginBottom: 16,
  },
  linkInput: {
    backgroundColor: COLORS.brandLight,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.brandDark,
    marginBottom: 16,
  },
  linkButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.brandAccent,
  },
  linkButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  navActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
    marginBottom: 32,
  },
  navButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  navButtonText: {
    color: COLORS.brand,
    fontWeight: '900',
    textAlign: 'center',
  },
  screenRoot: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  screenTitle: {
    color: COLORS.brandDark,
    fontSize: 24,
    fontWeight: '900',
  },
  backButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
  },
  backButtonText: {
    color: COLORS.brand,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brandLight,
  },
  emptyTitle: {
    color: COLORS.brandDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  medCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  medName: {
    color: COLORS.brandDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  medTime: {
    color: COLORS.brand,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  dosageBadge: {
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dosageBadgeText: {
    color: COLORS.brandDark,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  patientName: {
    color: COLORS.slate500,
    fontSize: 14,
    marginBottom: 24,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  takenButton: {
    flex: 1,
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.brandAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  missedButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#ffe4e6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonTextWhite: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  missedButtonText: {
    color: COLORS.rose500,
    fontWeight: 'bold',
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.brandLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  doctorName: {
    color: COLORS.brandDark,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appointmentTime: {
    color: COLORS.brand,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandAccent,
  },
  infoText: {
    color: COLORS.slate500,
    fontSize: 14,
  },
  notesContainer: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  notesText: {
    color: COLORS.slate600,
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.black60,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 40,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHandle: {
    width: 64,
    height: 6,
    backgroundColor: COLORS.brandLight,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.brandDark,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalBody: {
    color: COLORS.slate500,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalActionTaken: {
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brandAccent,
  },
  modalActionMissed: {
    backgroundColor: COLORS.rose500,
    shadowColor: COLORS.rose700,
  },
  modalActionText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 18,
  },
  modalDismiss: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissText: {
    color: COLORS.slate400,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  pressedScale: {
    transform: [{ scale: 0.95 }],
  },
});
