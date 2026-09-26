-- OTP codes are short random numbers and may legitimately collide between users.
DROP INDEX `User_otpCode_key` ON `User`;

-- Track failed OTP attempts to stop brute-force guessing.
ALTER TABLE `User` ADD COLUMN `otpAttempts` INTEGER NOT NULL DEFAULT 0;

-- Indexes for storefront listing queries.
CREATE INDEX `Product_isActive_createdAt_idx` ON `Product`(`isActive`, `createdAt`);
CREATE INDEX `Product_isActive_isFeatured_idx` ON `Product`(`isActive`, `isFeatured`);
CREATE INDEX `Product_isActive_isNewArrival_idx` ON `Product`(`isActive`, `isNewArrival`);
CREATE INDEX `Product_isActive_totalSales_idx` ON `Product`(`isActive`, `totalSales`);
CREATE INDEX `Product_isActive_price_idx` ON `Product`(`isActive`, `price`);
