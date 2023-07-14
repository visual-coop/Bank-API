-- CreateTable
CREATE TABLE `logtranscimb` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `income_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `log_income` JSON NULL,
    `trans_flag` ENUM('1', '-1') NOT NULL,
    `coop_key` VARCHAR(15) NOT NULL,
    `sigma_key` TEXT NULL,
    `log_response` JSON NULL,

    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
