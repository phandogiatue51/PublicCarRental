using Microsoft.AspNetCore.SignalR;

namespace PublicCarRental.Infrastructure.Signal
{
    public class NotificationHub : Hub
    {
        public async Task JoinStationGroup(int stationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"station-{stationId}");
            await Clients.Caller.SendAsync("JoinedGroup", $"station-{stationId}");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
            await Clients.Caller.SendAsync("JoinedGroup", "admin");
        }

        public async Task JoinUserGroup(int userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            await Clients.Caller.SendAsync("JoinedGroup", $"user-{userId}");
        }
    }
}