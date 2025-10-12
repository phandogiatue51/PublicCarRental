import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';

class SignalRService {
    constructor() {
        this.connection = null;
        this.notificationHandlers = [];
    }

    getBackendUrl() {
        if (window.location.hostname === 'localhost') {
            return 'https://localhost:7230';
        } else {
            return 'https://publiccarrental-production-b7c5.up.railway.app';
        }
    }

    // NEW: Get user data from JWT token (same as your useAuth hook)
    getCurrentUser() {
        const token = localStorage.getItem("jwtToken");
        if (!token) return null;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            const userData = JSON.parse(jsonPayload);
            
            return {
                accountId: userData.AccountId,
                email: userData.Email,
                role: userData.Role, // 0=EVRenter, 1=Staff, 2=Admin
                renterId: userData.RenterId,
                staffId: userData.StaffId,
                stationId: userData.StationId,
                isAdmin: userData.IsAdmin === "true"
            };
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    }

    async startConnection() {
        try {
            this.connection = new HubConnectionBuilder()
                .withUrl(`${this.getBackendUrl()}/notificationHub`, {
                    skipNegotiation: true,
                    transport: HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            // Setup handlers
            this.connection.on('ReceiveBookingNotification', (notification) => {
                this.notifyHandlers({
                    type: 'NewBooking',
                    message: notification.Message,
                    timestamp: new Date(),
                    booking: notification,
                    stationId: notification.StationId
                });
            });

            this.connection.on('ReceiveAccidentNotification', (notification) => {
                this.notifyHandlers({
                    type: 'AccidentReported',
                    message: notification.Message,
                    timestamp: new Date(),
                    accident: notification
                });
            });

            this.connection.on('ReceiveBookingConfirmation', (notification) => {
                this.notifyHandlers({
                    type: 'BookingConfirmed',
                    message: notification.Message,
                    timestamp: new Date(),
                    booking: notification
                });
            });

            await this.connection.start();
            
            // FIXED: Join correct group based on user role from JWT
            await this.joinUserGroup();
            
            console.log('✅ Connected to SignalR via service');
        } catch (err) {
            console.error('❌ SignalR connection failed: ', err);
        }
    }

    async joinUserGroup() {
        const user = this.getCurrentUser();
        
        if (!user) {
            console.warn('No user logged in, skipping SignalR group join');
            return;
        }

        console.log('Current user for SignalR:', user); // Debug log

        try {
            // Convert role to string for comparison, handle both string and number
            const userRole = user.role?.toString();
            
            switch (userRole) {
                case "2": // Admin
                    await this.connection.invoke('JoinAdminGroup');
                    console.log('✅ Joined admin group');
                    break;
                    
                case "1": // Staff
                    if (user.stationId) {
                        await this.connection.invoke('JoinStationGroup', parseInt(user.stationId));
                        console.log(`✅ Joined station group: ${user.stationId}`);
                    } else {
                        console.warn('Staff user has no stationId assigned');
                    }
                    break;
                    
                case "0": // EVRenter
                    if (user.renterId) {
                        await this.connection.invoke('JoinUserGroup', parseInt(user.renterId));
                        console.log(`✅ Joined user group: ${user.renterId}`);
                    } else {
                        console.warn('Renter user has no renterId');
                    }
                    break;
                    
                default:
                    console.warn('Unknown user role:', user.role, 'type:', typeof user.role);
                    break;
            }
        } catch (error) {
            console.error('Error joining SignalR group:', error);
        }
    }

    registerNotificationHandler(handler) {
        this.notificationHandlers.push(handler);
    }

    notifyHandlers(notification) {
        this.notificationHandlers.forEach(handler => handler(notification));
    }

    async stopConnection() {
        if (this.connection) {
            await this.connection.stop();
        }
    }
}

const signalRService = new SignalRService();
export default signalRService;