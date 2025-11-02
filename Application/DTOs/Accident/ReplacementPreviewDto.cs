namespace PublicCarRental.Application.DTOs.Accident
{
    public class ReplacementPreviewDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int AccidentId { get; set; }
        public int TotalContracts { get; set; }
        public int CanBeReplaced { get; set; }
        public int CannotBeReplaced { get; set; }
        public List<ContractReplacementPreview> PreviewResults { get; set; } = new();
    }
}