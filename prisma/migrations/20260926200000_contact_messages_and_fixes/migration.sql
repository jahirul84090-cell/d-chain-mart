-- Customer phone number on the account profile.
ALTER TABLE `User` ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- Messages from the Contact page.
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessage_isRead_createdAt_idx`(`isRead`, `createdAt`),
    INDEX `ContactMessage_email_createdAt_idx`(`email`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Invoices were saved with a placeholder link; point them at the real PDF.
UPDATE `Invoice` SET `invoiceUrl` = CONCAT('/api/admin/invoices/', `id`, '/pdf')
WHERE `invoiceUrl` LIKE 'https://your-storage-bucket.com/%' OR `invoiceUrl` IN ('', '#');
