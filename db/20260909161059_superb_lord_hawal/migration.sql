CREATE TABLE `birthdays` (
	`day` integer NOT NULL,
	`id` integer PRIMARY KEY,
	`month` integer NOT NULL,
	`user_id` text(19) NOT NULL UNIQUE,
	`user_name` text(32) NOT NULL
);
