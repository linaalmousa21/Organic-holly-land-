ALTER TABLE `users` ADD `clerkUserId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_clerkUserId_unique` UNIQUE(`clerkUserId`);