import Appointment from '../model/Appointment.js';
import { sendPushNotificationToUser } from '../services/pushNotificationService.js';

const initAppointmentReminderCron = () => {
    setInterval(async () => {
        try {
            const now = new Date();
            const horizon = new Date(now.getTime() + 60 * 1000);

            const pendingAppointments = await Appointment.find({
                reminderSent: false,
                date: { $gte: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
            }).limit(200);

            for (const appointment of pendingAppointments) {
                const leadMinutes = Number.isFinite(Number(appointment.reminderLeadMinutes))
                    ? Number(appointment.reminderLeadMinutes)
                    : 30;
                const reminderAt = new Date(new Date(appointment.date).getTime() - leadMinutes * 60 * 1000);

                if (reminderAt > horizon) continue;

                await sendPushNotificationToUser({
                    userId: appointment.userId,
                    title: 'Doctor appointment reminder',
                    body: `Upcoming appointment with Dr. ${appointment.doctor} at ${new Date(appointment.date).toLocaleString()}.`,
                    data: {
                        screen: 'appointments',
                        type: 'APPOINTMENT_REMINDER',
                        appointmentId: String(appointment._id),
                        doctor: appointment.doctor,
                        doctorSpecialty: appointment.doctorSpecialty || '',
                        hospitalName: appointment.hospitalName || '',
                        appointmentDate: new Date(appointment.date).toISOString(),
                    },
                });

                appointment.reminderSent = true;
                appointment.reminderSentAt = now;
                await appointment.save();
            }
        } catch (error) {
            console.error('[Appointment Reminder Cron] Error:', error);
        }
    }, 60 * 1000);
};

export default initAppointmentReminderCron;
