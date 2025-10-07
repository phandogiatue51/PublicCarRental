import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.onNotificationReceived = null;
  }

  startConnection = async () => {
    try {
      this.connection = new HubConnectionBuilder()
        // .withUrl('https://publiccarrental-production-b7c5.up.railway.app/notificationHub', {
        //   withCredentials: false
        // })
        .withUrl('https://localhost:7230/notificationHub', { 
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
      console.log('SignalR Connected');
      
      await this.joinGroups();
      
      return true;
    } catch (error) {
      console.error('SignalR Connection Error: ', error);
      return false;
    }
  };

joinGroups = async () => {
  if (!this.connection) {
    console.log('❌ No connection available for joining groups');
    return;
  }

  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    console.log('👤 Current user for groups:', user);

    if (user?.role === 'Admin') {
      console.log('👑 Joining admin group...');
      await this.connection.invoke('JoinAdminGroup');
      console.log('✅ Joined admin group');
    }
    
    if (user?.stationId) {
      console.log(`🏢 Joining station group ${user.stationId}...`);
      await this.connection.invoke('JoinStationGroup', user.stationId.toString());
      console.log(`✅ Joined station group ${user.stationId}`);
    }

    if (!user?.role && !user?.stationId) {
      console.log('🔧 No user role found, joining admin group for testing...');
      await this.connection.invoke('JoinAdminGroup');
      console.log('✅ Joined admin group (fallback)');
    }
    } catch (error) {
      console.error('❌ Error joining groups:', error);
    }
  };

  registerNotificationHandler = (callback) => {
    this.onNotificationReceived = callback;
  };

  stopConnection = async () => {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR Disconnected');
    }
  };
}

export default new SignalRService();