-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `buyingPrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sellingPrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalCost` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalProfit` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalRevenue` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `buyingPrice` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `LoanApplication` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `productPrice` DOUBLE NOT NULL,
    `productBuyingPrice` DOUBLE NOT NULL DEFAULT 0,
    `downPayment` DOUBLE NOT NULL,
    `downPaymentPaid` DOUBLE NOT NULL DEFAULT 0,
    `loanAmount` DOUBLE NOT NULL,
    `interestRate` DOUBLE NOT NULL DEFAULT 0,
    `tenureMonths` INTEGER NOT NULL,
    `monthlyEmi` DOUBLE NOT NULL,
    `totalPayable` DOUBLE NOT NULL,
    `productProfit` DOUBLE NOT NULL DEFAULT 0,
    `interestProfit` DOUBLE NOT NULL DEFAULT 0,
    `expectedProfit` DOUBLE NOT NULL DEFAULT 0,
    `firstEmiDelayDays` INTEGER NOT NULL DEFAULT 30,
    `gracePeriodDays` INTEGER NOT NULL DEFAULT 3,
    `lateFee` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'DOWN_PAYMENT_PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `loanStartDate` DATETIME(3) NULL,
    `firstDueDate` DATETIME(3) NULL,
    `applicantName` VARCHAR(191) NULL,
    `applicantAddress` TEXT NULL,
    `nidNumber` VARCHAR(191) NULL,
    `monthlyIncome` DOUBLE NULL,
    `jobType` VARCHAR(191) NULL,
    `customerNote` TEXT NULL,
    `adminNote` TEXT NULL,
    `nomineeName` VARCHAR(191) NULL,
    `nomineeRelation` VARCHAR(191) NULL,
    `nomineePhone` VARCHAR(191) NULL,
    `nomineeAddress` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoanApplication_orderId_key`(`orderId`),
    INDEX `LoanApplication_userId_idx`(`userId`),
    INDEX `LoanApplication_productId_idx`(`productId`),
    INDEX `LoanApplication_status_idx`(`status`),
    INDEX `LoanApplication_appliedAt_idx`(`appliedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstallmentPayment` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `installmentNo` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `originalDueDate` DATETIME(3) NULL,
    `amount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    `lateFee` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED') NOT NULL DEFAULT 'UNPAID',
    `paidAt` DATETIME(3) NULL,
    `note` TEXT NULL,
    `isDateChanged` BOOLEAN NOT NULL DEFAULT false,
    `dateChangedReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InstallmentPayment_loanApplicationId_idx`(`loanApplicationId`),
    INDEX `InstallmentPayment_dueDate_idx`(`dueDate`),
    INDEX `InstallmentPayment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanPayment` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `installmentId` VARCHAR(191) NULL,
    `paymentType` ENUM('DOWN_PAYMENT', 'INSTALLMENT', 'LATE_FEE', 'REFUND', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `amount` DOUBLE NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `transactionNumber` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `receivedBy` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LoanPayment_loanApplicationId_idx`(`loanApplicationId`),
    INDEX `LoanPayment_installmentId_idx`(`installmentId`),
    INDEX `LoanPayment_paymentType_idx`(`paymentType`),
    INDEX `LoanPayment_status_idx`(`status`),
    INDEX `LoanPayment_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanDocument` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `type` ENUM('NID_FRONT', 'NID_BACK', 'SELFIE', 'NOMINEE_PHOTO', 'SALARY_PROOF', 'BANK_STATEMENT', 'OTHER') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoanDocument_loanApplicationId_idx`(`loanApplicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanSetting` (
    `id` VARCHAR(191) NOT NULL,
    `minDownPaymentPct` DOUBLE NOT NULL DEFAULT 0,
    `defaultInterest` DOUBLE NOT NULL DEFAULT 10,
    `defaultTenure` INTEGER NOT NULL DEFAULT 12,
    `firstEmiDelayDays` INTEGER NOT NULL DEFAULT 30,
    `gracePeriodDays` INTEGER NOT NULL DEFAULT 3,
    `lateFee` DOUBLE NOT NULL DEFAULT 100,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockLedger` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` ENUM('STOCK_IN', 'STOCK_OUT', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockLedger_productId_idx`(`productId`),
    INDEX `StockLedger_type_idx`(`type`),
    INDEX `StockLedger_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `category` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `expenseAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Expense_expenseAt_idx`(`expenseAt`),
    INDEX `Expense_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryProduct` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `brandName` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `variant` VARCHAR(100) NULL,
    `buyPrice` DOUBLE NOT NULL,
    `sellPrice` DOUBLE NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryProduct_ownerId_idx`(`ownerId`),
    INDEX `InventoryProduct_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventorySale` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL,
    `sellPrice` DOUBLE NOT NULL,
    `buyPrice` DOUBLE NOT NULL,
    `profit` DOUBLE NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventorySale_ownerId_idx`(`ownerId`),
    INDEX `InventorySale_productId_idx`(`productId`),
    INDEX `InventorySale_month_year_idx`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstallmentPayment` ADD CONSTRAINT `InstallmentPayment_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanPayment` ADD CONSTRAINT `LoanPayment_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanPayment` ADD CONSTRAINT `LoanPayment_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `InstallmentPayment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDocument` ADD CONSTRAINT `LoanDocument_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLedger` ADD CONSTRAINT `StockLedger_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryProduct` ADD CONSTRAINT `InventoryProduct_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventorySale` ADD CONSTRAINT `InventorySale_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `InventoryProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventorySale` ADD CONSTRAINT `InventorySale_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
