TRUNCATE TABLE
  "Vehicles",
  "VehicleModels",
  "VehicleBrands",
  "VehicleTypes",
  "Stations",
  "Accounts",
  "EVRenters",
  "Staffs"
RESTART IDENTITY CASCADE;

-- Stations
INSERT INTO "Stations" ("Name", "Address", "Latitude", "Longitude") VALUES
('District 1 Hub', '123 Le Loi, District 1, HCMC', 10.7769, 106.7009),
('Thu Duc Depot', '456 Vo Van Ngan, Thu Duc, HCMC', 10.8510, 106.7580);

-- Accounts
INSERT INTO "Accounts" ("FullName", "Email", "PasswordHash", "PhoneNumber", "IdentityCardNumber", "Status", "RegisteredAt", "Role", "IsEmailVerified") VALUES
('Nguyen Van A', 'staff1@com', 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=', '0901234567', '012345678', 0, NOW(), 1, false), -- Staff
('Tran Thi B', 'staff2@com', 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=', '0902345678', '023456789', 0, NOW(), 1, false), -- Staff
('Le Quang C', 'admin@com', 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=', '0903456789', '034567890', 0, NOW(), 2, false), -- Admin
('Pham Thi D', 'renter@com', 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=', '0904567890', '045678901', 0, NOW(), 0, false); -- EVRenter

-- Staff Members
INSERT INTO "Staffs" ("AccountId", "StationId") VALUES
(1, 1),
(2, 2);

-- EV Renter
INSERT INTO "EVRenters" ("AccountId", "LicenseNumber") VALUES
(4, 'B123456789');

-- Insert Vehicle Types
INSERT INTO "VehicleTypes" ("Name") VALUES
('Motorcycle'),
('Car');

-- Insert Vehicle Brands
INSERT INTO "VehicleBrands" ("Name") VALUES
('VinFast'),
('Thaco'),
('Dat Bike'),
('Pega'),
('Yadea'),
('Tesla'),
('Hyundai');

-- VINFAST Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('VF e34', 1, 2, '/image/models/vf-e34.png', '10000'),
('VF 8', 1, 2, '/image/models/vf-8.png', '10000'),
('VF 9', 1, 2, '/image/models/vf-9.jpg', '10000');

-- THACO Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Kia EV9', 2, 2, '/image/models/kia-ev9.jpg', '10000');

-- HYUNDAI Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Ioniq 5', 7, 2, '/image/models/ioniq.png', '10000'),
('Kona Electric', 7, 2, '/image/models/kona-electric.jpg', '10000');

-- DAT BIKE Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Weaver++', 3, 1, '/image/models/weaver++.jpg', '10000'),
('Gemini', 3, 1, '/image/models/gemini.png', '10000');

-- PEGA Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('S Series (S2000)', 4, 1, '/image/models/s-series.jpg', '10000');

-- YADEA Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Elegant', 5, 1, '/image/models/elegant.png', '20000'),
('G5', 5, 1, '/image/models/g5.jpg', '20000');

-- VINFAST Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Feliz', 1, 1, '/image/models/feliz.png', '20000');

-- TESLA Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl", "PricePerHour") VALUES
('Model S', 6, 2, '/image/models/model-s.jpg', '20000'),
('Model 3', 6, 2, '/image/models/model-3.jpg', '20000'),
('Model X', 6, 2, '/image/models/model-x.png', '20000'),
('Model Y', 6, 2, '/image/models/model-y.jpg', '20000'),
('Cybertruck', 6, 2, '/image/models/cybertruck.jpg', '20000');

-- VINFAST Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('59A-001.01', 85, 5, 1, 1),
('59A-001.02', 90, 5, 2, 1),
('59A-002.01', 80, 5, 1, 2),
('59A-002.02', 88, 5, 2, 2),
('59A-003.01', 95, 5, 1, 3),
('59A-003.02', 92, 5, 2, 3);

-- THACO Car
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('60A-004.01', 87, 5, 1, 4),
('60A-004.02', 89, 5, 2, 4);

-- HYUNDAI Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('61A-005.01', 93, 5, 1, 5),
('61A-005.02', 91, 5, 2, 5),
('61A-006.01', 85, 5, 1, 6),
('61A-006.02', 88, 5, 2, 6);

-- DAT BIKE Motorcycles
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('62B1-007.01', 95, 5, 1, 7),
('62B1-007.02', 97, 5, 2, 7),
('62B1-008.01', 90, 5, 1, 8),
('62B1-008.02', 92, 5, 2, 8);

-- PEGA Motorcycle
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('63B1-009.01', 85, 5, 1, 9),
('63B1-009.02', 87, 5, 2, 9);

-- YADEA Motorcycles
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('64B1-010.01', 88, 5, 1, 10),
('64B1-010.02', 90, 5, 2, 10),
('64B1-011.01', 93, 5, 1, 11),
('64B1-011.02', 95, 5, 2, 11);

-- VINFAST Motorcycle
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('65B1-012.01', 89, 5, 1, 12),
('65B1-012.02', 91, 5, 2, 12);

-- TESLA Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "StationId", "ModelId") VALUES
('66A-013.01', 96, 5, 1, 13),
('66A-013.02', 94, 5, 2, 13),
('66A-014.01', 92, 5, 1, 14),
('66A-014.02', 93, 5, 2, 14),
('66A-015.01', 95, 5, 1, 15),
('66A-015.02', 97, 5, 2, 15),
('66A-016.01', 90, 5, 1, 16),
('66A-016.02', 89, 5, 2, 16),
('66A-017.01', 98, 5, 1, 17),
('66A-017.02', 96, 5, 2, 17);