import {
  HubConnectionBuilder,  LogLevel,  HttpTransportType
} from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.onNotificationReceived = null;
  }

  async startConnection() {
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl('https://publiccarrental-production-b7c5.up.railway.app/notificationHub', {
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
          withCredentials: false
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.connection.on('ReceiveBookingNotification', (notification) => {
        if (this.onNotificationReceived) {
          this.onNotificationReceived(notification);
        }
      });

      await this.connection.start();
      console.log('✅ SignalR connected');

      await this.joinGroups();
      return true;
    } catch (error) {
      console.error('❌ SignalR connection error:', error);
      return false;
    }
  }

  async joinGroups() {
    if (!this.connection) {
      console.warn('⚠️ No active connection to join groups');
      return;
    }

    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      console.log('👤 Joining groups for user:', user);

      if (user?.role === 'Admin') {
        await this.connection.invoke('JoinAdminGroup');
        console.log('✅ Joined Admin group');
      }

      if (user?.stationId) {
        await this.connection.invoke('JoinStationGroup', user.stationId.toString());
        console.log(`✅ Joined Station group ${user.stationId}`);
      }

      if (!user?.role && !user?.stationId) {
        await this.connection.invoke('JoinAdminGroup');
        console.log('✅ Joined Admin group (fallback)');
      }
    } catch (error) {
      console.error('❌ Error joining groups:', error);
    }
  }

  registerNotificationHandler(callback) {
    this.onNotificationReceived = callback;
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      console.log('🛑 SignalR disconnected');
    }
  }
}

const signalRService = new SignalRService();
export default signalRService;