-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema BookStore
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema BookStore
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `BookStore` DEFAULT CHARACTER SET utf8 ;
USE `BookStore` ;

-- -----------------------------------------------------
-- Table `BookStore`.`Book`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Book` (
  `ISBN` CHAR(13) NOT NULL,
  `Title` CHAR(25) NOT NULL,
  `Year` YEAR NOT NULL,
  `Category` VARCHAR(50) NOT NULL,
  `Price` INT NOT NULL,
  PRIMARY KEY (`ISBN`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Author`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Author` (
  `Name` CHAR(25) NOT NULL,
  `Address` TEXT NULL,
  `URL` VARCHAR(200) NULL,
  `AuthorID` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`AuthorID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Award`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Award` (
  `Name` CHAR(30) NOT NULL,
  `Year` YEAR NOT NULL,
  `ISBN` CHAR(13) NOT NULL,
  INDEX `fk_Award_Book1_idx` (`ISBN` ASC) VISIBLE,
  PRIMARY KEY (`Name`, `Year`),
  CONSTRAINT `fk_Award_Book1`
    FOREIGN KEY (`ISBN`)
    REFERENCES `BookStore`.`Book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Warehouse`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Warehouse` (
  `Code` CHAR(30) NOT NULL,
  `Address` TEXT NOT NULL,
  `Phone` VARCHAR(15) NULL,
  PRIMARY KEY (`Code`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Customer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Customer` (
  `Email` CHAR(25) NOT NULL,
  `Name` CHAR(25) NOT NULL,
  `Address` TEXT NULL,
  `Phone` VARCHAR(15) NULL,
  `Role` ENUM('Customer', 'Admin') NOT NULL,
  `Password` VARCHAR(256) NOT NULL,
  PRIMARY KEY (`Email`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Reservation` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `Reservation_date` DATETIME NOT NULL,
  `Pickup_time` DATETIME NOT NULL,
  `ISBN` CHAR(13) NOT NULL,
  `Email` CHAR(25) NOT NULL,
  PRIMARY KEY (`ID`),
  INDEX `fk_Reservation_Book1_idx` (`ISBN` ASC) VISIBLE,
  INDEX `fk_Reservation_Customer1_idx` (`Email` ASC) VISIBLE,
  CONSTRAINT `fk_Reservation_Book1`
    FOREIGN KEY (`ISBN`)
    REFERENCES `BookStore`.`Book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Reservation_Customer1`
    FOREIGN KEY (`Email`)
    REFERENCES `BookStore`.`Customer` (`Email`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Shopping_basket`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Shopping_basket` (
  `BasketID` INT NOT NULL AUTO_INCREMENT,
  `Order_date` DATETIME NULL,
  `Email` CHAR(25) NOT NULL,
  PRIMARY KEY (`BasketID`),
  INDEX `fk_Shopping_basket_Customer1_idx` (`Email` ASC) VISIBLE,
  CONSTRAINT `fk_Shopping_basket_Customer1`
    FOREIGN KEY (`Email`)
    REFERENCES `BookStore`.`Customer` (`Email`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Contains`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Contains` (
  `ISBN` CHAR(13) NOT NULL,
  `BasketID` INT NOT NULL,
  `Number` INT NOT NULL,
  PRIMARY KEY (`ISBN`, `BasketID`),
  INDEX `fk_Book_has_Shopping_basket_Shopping_basket1_idx` (`BasketID` ASC) VISIBLE,
  INDEX `fk_Book_has_Shopping_basket_Book_idx` (`ISBN` ASC) VISIBLE,
  CONSTRAINT `fk_Book_has_Shopping_basket_Book`
    FOREIGN KEY (`ISBN`)
    REFERENCES `BookStore`.`Book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Book_has_Shopping_basket_Shopping_basket1`
    FOREIGN KEY (`BasketID`)
    REFERENCES `BookStore`.`Shopping_basket` (`BasketID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Inventory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Inventory` (
  `Code` CHAR(30) NOT NULL,
  `ISBN` CHAR(13) NOT NULL,
  `Number` INT NOT NULL,
  PRIMARY KEY (`Code`, `ISBN`),
  INDEX `fk_Warehouse_has_Book_Book1_idx` (`ISBN` ASC) VISIBLE,
  INDEX `fk_Warehouse_has_Book_Warehouse1_idx` (`Code` ASC) VISIBLE,
  CONSTRAINT `fk_Warehouse_has_Book_Warehouse1`
    FOREIGN KEY (`Code`)
    REFERENCES `BookStore`.`Warehouse` (`Code`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Warehouse_has_Book_Book1`
    FOREIGN KEY (`ISBN`)
    REFERENCES `BookStore`.`Book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `BookStore`.`Written_by`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `BookStore`.`Written_by` (
  `ISBN` CHAR(13) NOT NULL,
  `AuthorID` INT NOT NULL,
  INDEX `fk_Book_has_Author_Author1_idx` (`AuthorID` ASC) VISIBLE,
  INDEX `fk_Book_has_Author_Book1_idx` (`ISBN` ASC) VISIBLE,
  PRIMARY KEY (`ISBN`, `AuthorID`),
  CONSTRAINT `fk_Book_has_Author_Book1`
    FOREIGN KEY (`ISBN`)
    REFERENCES `BookStore`.`Book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Book_has_Author_Author1`
    FOREIGN KEY (`AuthorID`)
    REFERENCES `BookStore`.`Author` (`AuthorID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;


-- -----------------------------------------------------
-- 제약조건
-- -----------------------------------------------------

-- CHECK를 통한 값 체크
ALTER TABLE Book
ADD CONSTRAINT chk_price_positive
CHECK (Price >= 0);

ALTER TABLE Contains
ADD CONSTRAINT chk_number_positive
CHECK (Number >= 0);

ALTER TABLE Inventory
ADD CONSTRAINT chk_inventory_positive
CHECK (Number >= 0);


