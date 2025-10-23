using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Rate;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;

public interface IRatingService
{
    Task<Rating> GetRatingByIdAsync(int ratingId);
    Task<List<Rating>> GetAllRatingsAsync();
    Task<Rating> CreateRatingAsync(CreateRatingDto createDto);
    Task<Rating> UpdateRatingAsync(int ratingId, UpdateRatingDto updateDto);
    Task<bool> DeleteRatingAsync(int ratingId);

    // Specific queries
    Task<List<Rating>> GetRatingsByContractIdAsync(int contractId);
    Task<List<Rating>> GetRatingsByRenterIdAsync(int renterId);
    Task<List<Rating>> GetRatingsByModelIdAsync(int modelId);
    Task<List<Rating>> GetRatingsByVehicleIdAsync(int vehicleId);

    // Statistics
    Task<RatingStatisticsDto> GetRatingStatisticsByModelIdAsync(int modelId);
    Task<RatingStatisticsDto> GetRatingStatisticsByRenterIdAsync(int renterId);
    Task<List<Rating>> GetRecentRatingsAsync(int count = 10);
    Task<List<Rating>> GetRatingsByStarAsync(RatingLabel starRating);
    Task<List<Rating>> GetRatingsWithCommentsAsync();

    // Validation
    Task<bool> CanRenterRateContractAsync(int contractId, int renterId);
    Task<bool> HasRenterRatedContractAsync(int contractId, int renterId);
}

public class RatingService : IRatingService
{
    private readonly IRatingRepository _ratingRepository;
    private readonly IContractRepository _contractRepository;
    private readonly ILogger<RatingService> _logger;

    public RatingService(
        IRatingRepository ratingRepository,
        IContractRepository contractRepository,
        ILogger<RatingService> logger)
    {
        _ratingRepository = ratingRepository;
        _contractRepository = contractRepository;
        _logger = logger;
    }

    public async Task<Rating> GetRatingByIdAsync(int ratingId)
    {
        try
        {
            var rating = _ratingRepository.GetById(ratingId);
            if (rating == null)
            {
                _logger.LogWarning("Rating {RatingId} not found", ratingId);
                return null;
            }
            return await Task.FromResult(rating);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rating {RatingId}", ratingId);
            throw;
        }
    }

    public async Task<List<Rating>> GetAllRatingsAsync()
    {
        try
        {
            return await _ratingRepository.GetAll().ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all ratings");
            throw;
        }
    }

    public async Task<Rating> CreateRatingAsync(CreateRatingDto createDto)
    {
        try
        {
            // Validate if renter can rate this contract
            if (!await CanRenterRateContractAsync(createDto.ContractId, createDto.RenterId))
            {
                throw new InvalidOperationException("Renter cannot rate this contract");
            }

            var rating = new Rating
            {
                ContractId = createDto.ContractId,
                Stars = createDto.Stars,
                Comment = createDto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _ratingRepository.Add(rating);

            _logger.LogInformation("Rating created for contract {ContractId} by renter {RenterId}",
                createDto.ContractId, createDto.RenterId);

            return rating;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rating for contract {ContractId}", createDto.ContractId);
            throw;
        }
    }

    public async Task<Rating> UpdateRatingAsync(int ratingId, UpdateRatingDto updateDto)
    {
        try
        {
            var rating = _ratingRepository.GetById(ratingId);
            if (rating == null)
            {
                _logger.LogWarning("Rating {RatingId} not found for update", ratingId);
                return null;
            }

            rating.Stars = updateDto.Stars;
            rating.Comment = updateDto.Comment;

            _ratingRepository.Update(rating);

            _logger.LogInformation("Rating {RatingId} updated", ratingId);
            return rating;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rating {RatingId}", ratingId);
            throw;
        }
    }

    public async Task<bool> DeleteRatingAsync(int ratingId)
    {
        try
        {
            var rating = _ratingRepository.GetById(ratingId);
            if (rating == null)
            {
                _logger.LogWarning("Rating {RatingId} not found for deletion", ratingId);
                return false;
            }

            _ratingRepository.Delete(rating);

            _logger.LogInformation("Rating {RatingId} deleted", ratingId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rating {RatingId}", ratingId);
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsByContractIdAsync(int contractId)
    {
        try
        {
            return await _ratingRepository.GetRatingsByContractId(contractId).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings for contract {ContractId}", contractId);
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsByRenterIdAsync(int renterId)
    {
        try
        {
            return await _ratingRepository.GetRatingsByRenterId(renterId).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings by renter {RenterId}", renterId);
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsByModelIdAsync(int modelId)
    {
        try
        {
            return await _ratingRepository.GetRatingsByModelId(modelId).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings for model {ModelId}", modelId);
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsByVehicleIdAsync(int vehicleId)
    {
        try
        {
            return await _ratingRepository.GetRatingsByVehicleId(vehicleId).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings for vehicle {VehicleId}", vehicleId);
            throw;
        }
    }

    public async Task<RatingStatisticsDto> GetRatingStatisticsByModelIdAsync(int modelId)
    {
        try
        {
            var averageRating = _ratingRepository.GetAverageRatingByModelId(modelId);
            var ratingCount = _ratingRepository.GetRatingCountByModelId(modelId);
            var ratings = await _ratingRepository.GetRatingsByModelId(modelId).ToListAsync();

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rating statistics for model {ModelId}", modelId);
            throw;
        }
    }

    public async Task<RatingStatisticsDto> GetRatingStatisticsByRenterIdAsync(int renterId)
    {
        try
        {
            var averageRating = _ratingRepository.GetAverageRatingByRenterId(renterId);
            var ratingCount = _ratingRepository.GetRatingCountByRenterId(renterId);
            var ratings = await _ratingRepository.GetRatingsByRenterId(renterId).ToListAsync();

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rating statistics for renter {RenterId}", renterId);
            throw;
        }
    }

    public async Task<List<Rating>> GetRecentRatingsAsync(int count = 10)
    {
        try
        {
            return await _ratingRepository.GetRecentRatings(count).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent ratings");
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsByStarAsync(RatingLabel starRating)
    {
        try
        {
            return await _ratingRepository.GetRatingsByStar(starRating).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings by star {StarRating}", starRating);
            throw;
        }
    }

    public async Task<List<Rating>> GetRatingsWithCommentsAsync()
    {
        try
        {
            return await _ratingRepository.GetRatingsWithComments().ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ratings with comments");
            throw;
        }
    }

    public async Task<bool> CanRenterRateContractAsync(int contractId, int renterId)
    {
        try
        {
            var contract = _contractRepository.GetById(contractId);

            // Check if contract exists and belongs to renter
            if (contract == null || contract.EVRenterId != renterId)
                return false;

            // Check if contract is completed
            if (contract.Status != RentalStatus.Completed)
                return false;

            // Check if renter hasn't already rated this contract
            var existingRating = await _ratingRepository.GetRatingsByContractId(contractId)
                .FirstOrDefaultAsync();

            return existingRating == null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if renter can rate contract {ContractId}", contractId);
            throw;
        }
    }

    public async Task<bool> HasRenterRatedContractAsync(int contractId, int renterId)
    {
        try
        {
            var rating = await _ratingRepository.GetRatingsByContractId(contractId)
                .FirstOrDefaultAsync();

            return rating != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if renter has rated contract {ContractId}", contractId);
            throw;
        }
    }
}