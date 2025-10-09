using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Acc;
using PublicCarRental.Infrastructure.Data.Repository.Ren;
using PublicCarRental.Infrastructure.Data.Repository.Token;

namespace PublicCarRental.Application.Service.Ren
{
    public class EVRenterService : IEVRenterService
    {
        private readonly IEVRenterRepository _renterRepo;
        private readonly IAccountRepository _accountRepo;
        private readonly ITokenRepository _tokenRepository;
        private readonly EmailProducerService _emailProducer;

        public EVRenterService(IEVRenterRepository renterRepo, IAccountRepository accountRepository,
            ITokenRepository tokenRepository, EmailProducerService emailProducerService)
        {
            _renterRepo = renterRepo;
            _accountRepo = accountRepository;
            _tokenRepository = tokenRepository;
            _emailProducer = emailProducerService;
        }

        public IEnumerable<EVRenterDto> GetAll()
        {
            return _renterRepo.GetAll()
                .Where(r => r.Account != null)
                .Select(r => new EVRenterDto
                {
                    RenterId = r.RenterId,
                    FullName = r.Account.FullName,
                    Email = r.Account.Email,
                    PhoneNumber = r.Account.PhoneNumber,
                    IdentityCardNumber = r.Account.IdentityCardNumber,
                    LicenseNumber = r.LicenseNumber,
                    IsEmailVerified = r.Account.IsEmailVerified,
                    Status = r.Account.Status
                }).ToList();
        }

        public EVRenterDto? GetById(int id)
        {
            var r = _renterRepo.GetById(id);
            if (r == null || r.Account == null) return null;

            return new EVRenterDto
            {
                RenterId = r.RenterId,
                FullName = r.Account.FullName,
                Email = r.Account.Email,
                PhoneNumber = r.Account.PhoneNumber,
                IdentityCardNumber = r.Account.IdentityCardNumber,
                LicenseNumber = r.LicenseNumber,
                Status = r.Account.Status
            };
        }

        public EVRenter? GetEntityById(int id) => _renterRepo.GetById(id);

        public (bool Success, string Message) UpdateRenter(int id, EVRenterUpdateDto renter)
        {
            var existingRenter = _renterRepo.GetById(id);
            if (existingRenter == null || existingRenter.Account == null)
                return (false, "Renter not found");

            if (existingRenter.Account.PhoneNumber != renter.PhoneNumber &&
                _accountRepo.Exists(a => a.AccountId != existingRenter.AccountId && a.PhoneNumber == renter.PhoneNumber))
            {
                return (false, "Phone number is already registered to another account");
            }

            if (existingRenter.Account.IdentityCardNumber != renter.IdentityCardNumber &&
                _accountRepo.Exists(a => a.AccountId != existingRenter.AccountId && a.IdentityCardNumber == renter.IdentityCardNumber))
            {
                return (false, "Identity card number is already registered to another account");
            }

            if (existingRenter.LicenseNumber != renter.LicenseNumber &&
                _renterRepo.Exists(r => r.RenterId != id && r.LicenseNumber == renter.LicenseNumber))
            {
                return (false, "License number is already registered to another renter");
            }

            if (existingRenter.Account.Email != renter.Email)
            {
                existingRenter.Account.IsEmailVerified = false;

                if (_accountRepo.Exists(a => a.AccountId != existingRenter.AccountId && a.Email == renter.Email))
                {
                    return (false, "Email is already registered to another account");
                }
            }

            existingRenter.Account.FullName = renter.FullName;
            existingRenter.Account.Email = renter.Email;
            existingRenter.Account.PhoneNumber = renter.PhoneNumber;
            existingRenter.Account.IdentityCardNumber = renter.IdentityCardNumber;
            existingRenter.LicenseNumber = renter.LicenseNumber;

            try
            {
                _renterRepo.Update(existingRenter);
                return (true, "Renter updated successfully");
            }
            catch (Exception ex)
            {
              
                return (false, "An error occurred while updating the renter");
            }
        }

        public bool DeleteRenter(int id)
        {
        
            var renter = _renterRepo.GetById(id);
            if (renter == null) return false;

            renter.Account.Status = AccountStatus.Inactive;
            _renterRepo.Update(renter);
            return true;
        }

        public async Task<(bool Success, string Message)> CreateRenterAsync (int accountId, string license)
        {
            try
            {
                if (_renterRepo.Exists(a => a.LicenseNumber == license))
                    return (false, "License is already registered.");

                var renter = new EVRenter
                {
                    AccountId = accountId,
                    LicenseNumber = license
                };

                _renterRepo.Create(renter);
                var token = _tokenRepository.GenerateToken(renter.Account, TokenPurpose.EmailVerification);
                await _emailProducer.QueueVerificationEmailAsync(renter.Account.Email, token);

                return (true, "Renter created successfully.");
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while creating the account.");
            }
        }

        public bool ChangeStatus(int renterId)
        {
            _renterRepo.ChangeStatus(renterId);
            return true;
        }


    }
}
