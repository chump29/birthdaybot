CREATE TABLE `birthdays` (
	`day` integer NOT NULL,
	`id` integer PRIMARY KEY,
	`is_updated` integer DEFAULT false,
	`month` integer NOT NULL,
	`user_id` text NOT NULL UNIQUE,
	`user_name` text NOT NULL
);
