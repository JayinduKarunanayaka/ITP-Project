import React from 'react';
import { FlatList, Pressable, SectionList, Text, View } from 'react-native';

const AlertScreen = ({ notifications = [], schedules = [], onMarkTaken, onMarkMissed }) => {
    const renderNotification = ({ item }) => (
        <View className="flex-row items-start bg-white rounded-3xl p-4 mb-3 border border-emerald-50 shadow-sm">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 mr-3 shadow-lg shadow-emerald-500" />
            <View className="flex-1">
                <Text className="text-brand-dark text-base font-bold">{item.title || 'Medication alert'}</Text>
                <Text className="text-emerald-800/70 text-sm mt-1 leading-5">{item.body || 'No alert details provided.'}</Text>
                <View className="flex-row items-center mt-2">
                    {!!item.type && (
                        <View className="bg-emerald-50 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-brand text-[10px] font-bold uppercase">{item.type}</Text>
                        </View>
                    )}
                    {!!item.time && <Text className="text-slate-400 text-[10px]">{item.time}</Text>}
                </View>
            </View>
        </View>
    );

    const renderSchedule = ({ item }) => {
        const status = String(item.status || (item.notificationSent ? 'alerted' : 'scheduled')).toLowerCase();
        
        const statusStyles = {
            taken: "bg-emerald-100 text-emerald-700",
            missed: "bg-rose-100 text-rose-700",
            pending: "bg-amber-100 text-amber-700",
            alerted: "bg-brand-light text-brand",
            scheduled: "bg-slate-100 text-slate-600"
        };

        const currentStatusStyle = statusStyles[status] || statusStyles.scheduled;

        return (
            <View className="bg-white rounded-[32px] p-6 mb-4 border border-emerald-50 shadow-sm">
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-2">
                        <Text className="text-brand-dark text-xl font-black leading-6">
                            {item.medicationName || item.name || 'Medication'}
                        </Text>
                        <Text className="text-slate-400 text-xs font-medium mt-1">
                            Patient: {item.patientName || 'Assigned patient'}
                        </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${currentStatusStyle.split(' ')[0]}`}>
                        <Text className={`text-[10px] font-bold uppercase ${currentStatusStyle.split(' ')[1]}`}>
                            {status}
                        </Text>
                    </View>
                </View>

                <View className="space-y-1 mb-6">
                    <View className="flex-row items-center">
                        <Text className="text-brand text-sm font-bold">Reminder: </Text>
                        <Text className="text-slate-600 text-sm">{item.scheduledTime || item.time || 'Not set'}</Text>
                    </View>
                    {!!item.dosage && (
                        <View className="flex-row items-center">
                            <Text className="text-brand text-sm font-bold">Dosage: </Text>
                            <Text className="text-slate-600 text-sm">{item.dosage}</Text>
                        </View>
                    )}
                </View>

                <View className="flex-row gap-3">
                    <Pressable 
                        className="flex-1 bg-brand py-4 rounded-2xl items-center shadow-md shadow-emerald-100 active:scale-95 transition-all" 
                        onPress={() => onMarkTaken?.(item)}
                    >
                        <Text className="text-white font-black text-xs uppercase tracking-widest">Mark Taken</Text>
                    </Pressable>
                    <Pressable 
                        className="flex-1 bg-white border border-rose-100 py-4 rounded-2xl items-center active:bg-rose-50 active:scale-95 transition-all" 
                        onPress={() => onMarkMissed?.(item)}
                    >
                        <Text className="text-rose-500 font-black text-xs uppercase tracking-widest">Mark Missed</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    const groupedScheduleSections = Object.entries(
        schedules.reduce((acc, schedule) => {
            const key = schedule.patientName || 'Assigned patient';
            if (!acc[key]) acc[key] = [];
            acc[key].push(schedule);
            return acc;
        }, {})
    ).map(([title, data]) => ({ title, data }));

    return (
        <View className="flex-1 bg-white px-6">
            <View className="pt-8 mb-6">
                <Text className="text-brand-dark text-3xl font-black">Alerts</Text>
                <Text className="text-emerald-800/50 text-sm font-medium mt-1">Manage your medication intake</Text>
            </View>

            <Text className="text-brand-dark text-lg font-bold mb-4 uppercase tracking-tighter">Live notifications</Text>
            {notifications.length === 0 ? (
                <View className="bg-surface rounded-3xl p-8 items-center border border-emerald-50 mb-8">
                    <Text className="text-brand-dark font-bold">No new alerts</Text>
                    <Text className="text-slate-400 text-xs text-center mt-2">New reminders will appear here in real-time.</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item, index) => `${item.title || 'alert'}-${index}`}
                    renderItem={renderNotification}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Text className="text-brand-dark text-lg font-bold mb-4 uppercase tracking-tighter mt-4">Schedules</Text>
            {schedules.length === 0 ? (
                <View className="bg-surface rounded-3xl p-8 items-center border border-emerald-50">
                    <Text className="text-brand-dark font-bold">No schedules</Text>
                    <Text className="text-slate-400 text-xs text-center mt-2">Your medication plan will be loaded automatically.</Text>
                </View>
            ) : (
                groupedScheduleSections.length > 1 ? (
                    <SectionList
                        sections={groupedScheduleSections}
                        keyExtractor={(item, index) => `${item._id || item.medicationName || 'schedule'}-${index}`}
                        renderItem={renderSchedule}
                        renderSectionHeader={({ section: { title } }) => (
                            <View className="bg-emerald-50 self-start px-4 py-1.5 rounded-full mb-3 mt-2">
                                <Text className="text-brand-dark text-[10px] font-black uppercase tracking-widest">{title}</Text>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={false}
                    />
                ) : (
                    <FlatList
                        data={schedules}
                        keyExtractor={(item, index) => `${item._id || item.medicationName || 'schedule'}-${index}`}
                        renderItem={renderSchedule}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    />
                )
            )}
        </View>
    );
};

export default AlertScreen;
