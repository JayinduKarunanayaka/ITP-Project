import { registerRootComponent } from 'expo';
import App from './App';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_NOTIFICATION_TASK = 'REMOTE_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
    if (error) {
        console.log('Background notification task error:', error);
        return;
    }
    if (data) {
        console.log('Received Medication Signal:', data);
    }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((err) => {
    console.log('Failed to register background notification task', err);
});

registerRootComponent(App);
