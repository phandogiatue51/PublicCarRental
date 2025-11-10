using PublicCarRental.Application.DTOs.Rate;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;

public interface IRatingService
{
    List<RatingReadDto> GetAllRatings();
    RatingReadDto GetRatingById(int ratingId);
    (bool Success, string Message) CreateRating(CreateRatingDto createDto);
    (bool Success, string Message) UpdateRating(int ratingId, UpdateRatingDto updateDto);
    (bool Success, string Message) DeleteRating(int ratingId);

    List<RatingReadDto> GetRatingsByContractId(int contractId);
    List<RatingReadDto> GetRatingsByRenterId(int renterId);
    List<RatingReadDto> GetRatingsByModelId(int modelId);
    List<RatingReadDto> GetRatingsByVehicleId(int vehicleId);

    RatingStatisticsDto GetRatingStatisticsByModelId(int modelId);
    RatingStatisticsDto GetRatingStatisticsByRenterId(int renterId);
    List<RatingReadDto> GetRecentRatings(int count = 10);
    List<RatingReadDto> GetRatingsByStar(RatingLabel starRating);

    bool CanRenterRateContract(int contractId, int renterId);
    bool HasRenterRatedContract(int contractId, int renterId);
    public List<RatingReadDto> GetFilteredRatings(int? modelId = null, int? renterId = null, RatingLabel? starRating = null);

}

public class RatingService : IRatingService
{
    private readonly IRatingRepository _ratingRepository;
    private readonly IContractRepository _contractRepository;
    private readonly ILogger<RatingService> _logger;

    public RatingService(IRatingRepository ratingRepository, IContractRepository contractRepository, ILogger<RatingService> logger)
    {
        _ratingRepository = ratingRepository;
        _contractRepository = contractRepository;
        _logger = logger;
    }

    public List<RatingReadDto> GetAllRatings()
    {
        return _ratingRepository.GetAll()
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public RatingReadDto GetRatingById(int ratingId)
    {
        var rating = _ratingRepository.GetById(ratingId);
        if (rating == null) return null;

        return new RatingReadDto
        {
            RatingId = rating.RatingId,
            ContractId = rating.ContractId,
            Stars = rating.Stars,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt,
            RenterId = rating.Contract.EVRenterId,
            RenterName = rating.Contract.EVRenter.Account.FullName,
            StartDate = rating.Contract.StartTime,
            EndDate = rating.Contract.EndTime
        };
    }

    public (bool Success, string Message) CreateRating(CreateRatingDto createDto)
    {
        try
        {
            if (!CanRenterRateContract(createDto.ContractId, createDto.RenterId))
            {
                return (false, "Renter cannot rate this contract");
            }

            var rating = new Rating
            {
                ContractId = createDto.ContractId,
                Stars = createDto.Stars,
                Comment = createDto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            var contract = _contractRepository.GetById(createDto.ContractId);
            contract.IsRated = true;

            _contractRepository.Update(contract);
            _ratingRepository.Add(rating);
            return (true, "Rating created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rating for contract {ContractId}", createDto.ContractId);
            return (false, "An error occurred while creating the rating");
        }
    }

    public (bool Success, string Message) UpdateRating(int ratingId, UpdateRatingDto updateDto)
    {
        try
        {
            var rating = _ratingRepository.GetById(ratingId);
            if (rating == null)
            {
                return (false, $"Rating with ID {ratingId} not found");
            }

            rating.Stars = updateDto.Stars;
            rating.Comment = updateDto.Comment;

            _ratingRepository.Update(rating);
            return (true, "Rating updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rating {RatingId}", ratingId);
            return (false, "An error occurred while updating the rating");
        }
    }

    public (bool Success, string Message) DeleteRating(int ratingId)
    {
        try
        {
            var rating = _ratingRepository.GetById(ratingId);
            if (rating == null)
            {
                return (false, $"Rating with ID {ratingId} not found");
            }

            _ratingRepository.Delete(rating);
            return (true, "Rating deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rating {RatingId}", ratingId);
            return (false, "An error occurred while deleting the rating");
        }
    }

    public List<RatingReadDto> GetRatingsByContractId(int contractId)
    {
        return _ratingRepository.GetRatingsByContractId(contractId)
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public List<RatingReadDto> GetRatingsByRenterId(int renterId)
    {
        return _ratingRepository.GetRatingsByRenterId(renterId)
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public List<RatingReadDto> GetRatingsByModelId(int modelId)
    {
        return _ratingRepository.GetRatingsByModelId(modelId)
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public List<RatingReadDto> GetRatingsByVehicleId(int vehicleId)
    {
        return _ratingRepository.GetRatingsByVehicleId(vehicleId)
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public RatingStatisticsDto GetRatingStatisticsByModelId(int modelId)
    {
        var averageRating = _ratingRepository.GetAverageRatingByModelId(modelId);
        var ratingCount = _ratingRepository.GetRatingCountByModelId(modelId);
        var ratings = _ratingRepository.GetRatingsByModelId(modelId).ToList();

        var starDistribution = Enum.GetValues(typeof(RatingLabel))
            .Cast<RatingLabel>()
            .ToDictionary(
                star => star,
                star => ratings.Count(r => r.Stars == star)
            );

        return new RatingStatisticsDto
        {
            AverageRating = averageRating,
            TotalRatings = ratingCount,
            StarDistribution = starDistribution,
            ModelId = modelId
        };
    }

    public RatingStatisticsDto GetRatingStatisticsByRenterId(int renterId)
    {
        var averageRating = _ratingRepository.GetAverageRatingByRenterId(renterId);
        var ratingCount = _ratingRepository.GetRatingCountByRenterId(renterId);
        var ratings = _ratingRepository.GetRatingsByRenterId(renterId).ToList();

        var starDistribution = Enum.GetValues(typeof(RatingLabel))
            .Cast<RatingLabel>()
            .ToDictionary(
                star => star,
                star => ratings.Count(r => r.Stars == star)
            );

        return new RatingStatisticsDto
        {
            AverageRating = averageRating,
            TotalRatings = ratingCount,
            StarDistribution = starDistribution,
            RenterId = renterId
        };
    }

    public List<RatingReadDto> GetRecentRatings(int count = 10)
    {
        return _ratingRepository.GetRecentRatings()
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public List<RatingReadDto> GetRatingsByStar(RatingLabel starRating)
    {
        return _ratingRepository.GetRatingsByStar(starRating)
            .Select(r => new RatingReadDto
            {
                RatingId = r.RatingId,
                ContractId = r.ContractId,
                Stars = r.Stars,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterId = r.Contract.EVRenterId,
                RenterName = r.Contract.EVRenter.Account.FullName,
                StartDate = r.Contract.StartTime,
                EndDate = r.Contract.EndTime
            }).ToList();
    }

    public bool CanRenterRateContract(int contractId, int renterId)
    {
        try
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.EVRenterId != renterId)
                return false;

            if (contract.Status != RentalStatus.Completed && contract.Status != RentalStatus.Confirmed)
                return false;

            var existingRating = _ratingRepository.GetRatingsByContractId(contractId)
                .FirstOrDefault();

            return existingRating == null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if renter can rate contract {ContractId}", contractId);
            return false;
        }
    }

    public bool HasRenterRatedContract(int contractId, int renterId)
    {
        var rating = _ratingRepository.GetRatingsByContractId(contractId)
            .FirstOrDefault();
        return rating != null;
    }

    public List<RatingReadDto> GetFilteredRatings(int? modelId = null, int? renterId = null, RatingLabel? starRating = null)
    {
        var query = _ratingRepository.GetAll();

        if (modelId.HasValue)
        {
            query = query.Where(r => r.Contract.Vehicle.ModelId == modelId.Value);
        }

        if (renterId.HasValue)
        {
            query = query.Where(r => r.Contract.EVRenterId == renterId.Value);
        }

        if (starRating.HasValue)
        {
            query = query.Where(r => r.Stars == starRating.Value);
        }

        return query.Select(r => new RatingReadDto
        {
            RatingId = r.RatingId,
            ContractId = r.ContractId,
            Stars = r.Stars,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt,
            RenterId = r.Contract.EVRenterId,
            RenterName = r.Contract.EVRenter.Account.FullName,
            StartDate = r.Contract.StartTime,
            EndDate = r.Contract.EndTime,
        }).ToList();
    }
}