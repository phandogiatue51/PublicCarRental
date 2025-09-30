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
INSERT INTO "Accounts" ("FullName", "Email", "PasswordHash", "PhoneNumber", "IdentityCardNumber", "Status", "RegisteredAt", "Role") VALUES
('Nguyen Van A', 'staff1@com', '123', '0901234567', '012345678', 0, NOW(), 1), -- Staff
('Tran Thi B', 'staff2@com', '123', '0902345678', '023456789', 0, NOW(), 1), -- Staff
('Le Quang C', 'admin@com', '123', '0903456789', '034567890', 0, NOW(), 2), -- Admin
('Pham Thi D', 'renter@com', '123', '0904567890', '045678901', 0, NOW(), 0); -- EVRenter

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
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('VF e34', 1, 2, 'vf-e34.png'),
('VF 8', 1, 2, 'vf-8.png'),
('VF 9', 1, 2, 'vf-9.jpg');

-- THACO Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Kia EV9', 2, 2, 'kia-ev9.jpg');

-- HYUNDAI Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Ioniq 5', 7, 2, 'ioniq.png'),
('Kona Electric', 7, 2, 'kona-electric.jpg');

-- DAT BIKE Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Weaver++', 3, 1, 'weaver++.jpg'),
('Gemini', 3, 1, 'gemini.png');

-- PEGA Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('S Series (S2000)', 4, 1, 's-series.jpg');

-- YADEA Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Elegant', 5, 1, 'elegant.png'),
('G5', 5, 1, 'g5.jpg');

-- VINFAST Motorcycles
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Feliz', 1, 1, 'feliz.png');

-- TESLA Cars
INSERT INTO "VehicleModels" ("Name", "BrandId", "TypeId", "ImageUrl") VALUES
('Model S', 6, 2, 'model-s.jpg'),
('Model 3', 6, 2, 'model-3.jpg'),
('Model X', 6, 2, 'model-x.png'),
('Model Y', 6, 2, 'model-y.jpg'),
('Cybertruck', 6, 2, 'cybertruck.jpg');

-- VINFAST Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('59A-001.01', 85, 5, 120000, 1, 1),
('59A-001.02', 90, 5, 120000, 2, 1),
('59A-002.01', 80, 5, 150000, 1, 2),
('59A-002.02', 88, 5, 150000, 2, 2),
('59A-003.01', 95, 5, 180000, 1, 3),
('59A-003.02', 92, 5, 180000, 2, 3);

-- THACO Car
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('60A-004.01', 87, 5, 170000, 1, 4),
('60A-004.02', 89, 5, 170000, 2, 4);

-- HYUNDAI Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('61A-005.01', 93, 5, 160000, 1, 5),
('61A-005.02', 91, 5, 160000, 2, 5),
('61A-006.01', 85, 5, 140000, 1, 6),
('61A-006.02', 88, 5, 140000, 2, 6);

-- DAT BIKE Motorcycles
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('62B1-007.01', 95, 5, 50000, 1, 7),
('62B1-007.02', 97, 5, 50000, 2, 7),
('62B1-008.01', 90, 5, 45000, 1, 8),
('62B1-008.02', 92, 5, 45000, 2, 8);

-- PEGA Motorcycle
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('63B1-009.01', 85, 5, 40000, 1, 9),
('63B1-009.02', 87, 5, 40000, 2, 9);

-- YADEA Motorcycles
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('64B1-010.01', 88, 5, 42000, 1, 10),
('64B1-010.02', 90, 5, 42000, 2, 10),
('64B1-011.01', 93, 5, 46000, 1, 11),
('64B1-011.02', 95, 5, 46000, 2, 11);

-- VINFAST Motorcycle
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('65B1-012.01', 89, 5, 48000, 1, 12),
('65B1-012.02', 91, 5, 48000, 2, 12);

-- TESLA Cars
INSERT INTO "Vehicles" ("LicensePlate", "BatteryLevel", "Status", "PricePerHour", "StationId", "ModelId") VALUES
('66A-013.01', 96, 5, 200000, 1, 13),
('66A-013.02', 94, 5, 200000, 2, 13),
('66A-014.01', 92, 5, 190000, 1, 14),
('66A-014.02', 93, 5, 190000, 2, 14),
('66A-015.01', 95, 5, 210000, 1, 15),
('66A-015.02', 97, 5, 210000, 2, 15),
('66A-016.01', 90, 5, 180000, 1, 16),
('66A-016.02', 89, 5, 180000, 2, 16),
('66A-017.01', 98, 5, 220000, 1, 17),
('66A-017.02', 96, 5, 220000, 2, 17);