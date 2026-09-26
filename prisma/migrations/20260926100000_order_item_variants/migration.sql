-- Allow the same product to appear on an order in different sizes/colours.
DROP INDEX `OrderItem_orderId_productId_key` ON `OrderItem`;
