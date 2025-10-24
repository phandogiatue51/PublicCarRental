namespace PublicCarRental.Application.DTOs.BadScenario
{
    public class ChangeVehicleRequest
    {
        public int? NewVehicleId { get; set; } 
        public int? NewModelId { get; set; }    
        public string Reason { get; set; }   
    }

}
