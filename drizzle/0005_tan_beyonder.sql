CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'hyperpay',
	`checkoutId` varchar(160),
	`resourcePath` varchar(500),
	`paymentId` varchar(160),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('created','pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'created',
	`resultCode` varchar(40),
	`resultDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
