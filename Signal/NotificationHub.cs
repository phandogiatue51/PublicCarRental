using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace PublicCarRental.Signal
{
    public class NotificationHub : Hub
    {
        public async Task JoinStationGroup(string stationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"station-{stationId}");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
        }

    }
}
