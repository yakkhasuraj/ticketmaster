import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, Token__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const NAME = "Token";
const SYMBOL = "T";

const OCCASION_NAME = "ETH Texas";
const OCCASION_COST = ethers.parseUnits("1", "ether");
const OCCASION_MAX_TICKETS = 100;
const OCCASION_DATE = "Apr 27";
const OCCASION_TIME = "10:00AM CST";
const OCCASION_LOCATION = "Austin, Texas";

describe("Token", () => {
  let Token: Token__factory;
  let token: Token;
  let deployer: HardhatEthersSigner, buyer: HardhatEthersSigner;

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners();

    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(NAME, SYMBOL);
  });

  describe("Deployment", () => {
    it("Should set the right name", async () => {
      expect(await token.name()).to.equal(NAME);
    });

    it("Should set the right symbol", async () => {
      expect(await token.symbol()).to.equal(SYMBOL);
    });

    it("Should set the right owner", async () => {
      expect(await token.owner()).to.equal(deployer.address);
    });
  });

  describe("Occasions", () => {
    beforeEach(async () => {
      const transaction = await token
        .connect(deployer)
        .addOccasion(
          OCCASION_NAME,
          OCCASION_COST,
          OCCASION_MAX_TICKETS,
          OCCASION_DATE,
          OCCASION_TIME,
          OCCASION_LOCATION
        );

      await transaction.wait();
    });

    it("Should update occasions count", async () => {
      expect(await token.totalOccasions()).to.equal(1);
    });

    it("Should return occasion", async () => {
      const occasion = await token.getOccasion(1);

      expect(occasion.id).to.be.equal(1);
      expect(occasion.name).to.be.equal(OCCASION_NAME);
      expect(occasion.cost).to.be.equal(OCCASION_COST);
      expect(occasion.maxTickets).to.be.equal(OCCASION_MAX_TICKETS);
      expect(occasion.date).to.be.equal(OCCASION_DATE);
      expect(occasion.time).to.be.equal(OCCASION_TIME);
      expect(occasion.location).to.be.equal(OCCASION_LOCATION);
    });
  });

  describe("Minting", () => {
    const ID = 1;
    const SEAT = 50;
    const AMOUNT = ethers.parseUnits("1", "ether");

    beforeEach(async () => {
      let transaction = await token
        .connect(deployer)
        .addOccasion(
          OCCASION_NAME,
          OCCASION_COST,
          OCCASION_MAX_TICKETS,
          OCCASION_DATE,
          OCCASION_TIME,
          OCCASION_LOCATION
        );

      await transaction.wait();

      transaction = await token
        .connect(buyer)
        .mint(ID, SEAT, { value: AMOUNT });
      await transaction.wait();
    });

    it("Should update ticket count", async () => {
      const occasion = await token.getOccasion(1);
      expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS - 1);
    });

    it("Should update buy status", async () => {
      const status = await token.hasBought(1, buyer.address);
      expect(status).to.be.equal(true);
    });

    it("Should update booked seats", async () => {
      const owner = await token.bookedSeats(1, SEAT);
      expect(owner).to.be.equal(buyer.address);
    });

    it("Should return booked seats", async () => {
      const bookedSeats = await token.getBookedSeats(ID);
      expect(bookedSeats.length).to.be.equal(1);
      expect(bookedSeats[0]).to.be.equal(SEAT);
    });

    it("Should update contract balance", async () => {
      const address = await token.getAddress();

      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.be.equal(AMOUNT);
    });
  });

  describe("Withdraw", () => {
    const ID = 1;
    const SEAT = 50;
    const AMOUNT = ethers.parseUnits("1", "ether");
    let previousBalance: bigint;

    beforeEach(async () => {
      previousBalance = await ethers.provider.getBalance(deployer.address);

      let transaction = await token
        .connect(deployer)
        .addOccasion(
          OCCASION_NAME,
          OCCASION_COST,
          OCCASION_MAX_TICKETS,
          OCCASION_DATE,
          OCCASION_TIME,
          OCCASION_LOCATION
        );

      await transaction.wait();

      transaction = await token
        .connect(buyer)
        .mint(ID, SEAT, { value: AMOUNT });
      await transaction.wait();

      transaction = await token.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Should update owner balance", async () => {
      const balance = await ethers.provider.getBalance(deployer.address);
      expect(balance).to.be.greaterThan(previousBalance);
    });

    it("Should update contract balance", async () => {
      const address = await token.getAddress();

      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.be.equal(0);
    });
  });
});
