// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Token is ERC721 {
    address public owner;
    uint256 public totalOccasions;
    uint256 public totalSupply;

    mapping(uint256 => Occasion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public bookedSeats;
    mapping(uint256 => uint256[]) public unavailableSeats;

    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        owner = msg.sender;
    }

    function addOccasion(
        string memory name,
        uint256 cost,
        uint256 maxTickets,
        string memory date,
        string memory time,
        string memory location
    ) public onlyOwner {
        // require(msg.sender == owner, "Only owner can call this function");
        // totalOccasions = totalOccasions + 1;
        totalOccasions++;

        occasions[totalOccasions] = Occasion(
            totalOccasions,
            name,
            cost,
            maxTickets,
            maxTickets,
            date,
            time,
            location
        );
    }

    function mint(uint256 id, uint256 seat) public payable {
        require(occasions[id].id == id, "Occassion doesn't exist");

        require(
            msg.value >= occasions[id].cost,
            "Sent eth is less than required cost"
        );

        require(bookedSeats[id][seat] == address(0), "Seat is already booked");
        require(seat <= occasions[id].maxTickets, "Seat is unavailable");

        occasions[id].tickets -= 1;

        hasBought[id][msg.sender] = true;
        bookedSeats[id][seat] = msg.sender; // Reserve seat

        unavailableSeats[id].push(seat); // Lock seats

        totalSupply++;
        _safeMint(msg.sender, totalSupply);
    }

    function getOccasion(uint256 id) public view returns (Occasion memory) {
        return occasions[id];
    }

    function getBookedSeats(uint256 id) public view returns (uint256[] memory) {
        return unavailableSeats[id];
    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}
