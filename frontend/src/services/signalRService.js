import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';

class SignalRService {
    constructor() {
        this.connection = null;
        this.notificationHandlers = [];
    }

    getBackendUrl() {
        return 'https://publiccarrental-production-b7c5.up.railway.app';
    }

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
            if (this.connection && (this.connection.state === 'Connected' || this.connection.state === 'Connecting')) {
                await this.joinUserGroup();
                console.log('ℹ️ SignalR connection already active');
                return;
            }

            this.connection = new HubConnectionBuilder()
                .withUrl(`${this.getBackendUrl()}/notificationHub`, {
                    skipNegotiation: true,
                    transport: HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            this.connection.off('ReceiveBookingNotification');
            this.connection.on('ReceiveBookingNotification', (notification) => {
                console.log('📨 Raw booking notification from server:', notification);
                
                this.notifyHandlers({
                    type: 'NewBooking',
                    ...notification 
                });
            });

            this.connection.off('ReceiveAccidentNotification');
            this.connection.on('ReceiveAccidentNotification', (notification) => {
                console.log('🚨 Raw accident notification from server:', notification);
                
                this.notifyHandlers({
                    type: 'AccidentReported',
                    ...notification 
                });
            });

            this.connection.off('ReceiveBookingConfirmation');
            this.connection.on('ReceiveBookingConfirmation', (notification) => {
                console.log('✅ Raw booking confirmation from server:', notification);
                
                this.notifyHandlers({
                    type: 'BookingConfirmed',
                    ...notification 
                });
            });

            this.connection.off('ReceiveVehicleReadyNotification');
            this.connection.on('ReceiveVehicleReadyNotification', (notification) => {
                console.log('🚗 Raw vehicle ready notification from server:', notification);
                this.notifyHandlers({
                    type: 'VehicleReadyForPickup',
                    ...notification 
                });
            });

            await this.connection.start();
            
            await this.joinUserGroup();
            
            console.log('✅ Connected to SignalR via service');
            
            this.connection.on('JoinedGroup', (groupName) => {
                console.log(`Successfully joined group: ${groupName}`);
            });
        } catch (err) {
            console.error('SignalR connection failed: ', err);
        }
    }

    async joinUserGroup() {
        const user = this.getCurrentUser();
        
        if (!user) {
            console.warn('No user logged in, skipping SignalR group join');
            return;
        }

        console.log('Current user for SignalR:', user);

        try {
            const userRole = user.role?.toString().toLowerCase();
            
            console.log('Processing role:', userRole);
            
            switch (userRole) {
                case "2":
                case "admin":
                    await this.connection.invoke('JoinAdminGroup');
                    console.log('✅ Joined admin group');
                    break;
                    
                case "1":
                case "staff":
                    if (user.stationId) {
                        await this.connection.invoke('JoinStationGroup', parseInt(user.stationId));
                        console.log(`✅ Joined station group: ${user.stationId}`);
                    } else {
                        console.warn('Staff user has no stationId assigned');
                    }
                    break;
                    
                case "0":
                case "evrenter":
                case "renter":
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

    unregisterNotificationHandler(handler) {
        this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
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