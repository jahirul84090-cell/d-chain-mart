-- Admin order list: filter by status, newest first.
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);
CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`);
