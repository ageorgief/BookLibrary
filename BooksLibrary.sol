// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./Ownable.sol";


contract BooksLibrary is Ownable {
    struct Book {
        uint16 id;
        string name;
    }

    string[] bookNames;
    uint8[] availableCopies;

    mapping(uint16 => address[]) private previouslyBorrowed;
    mapping(address => uint16[]) private currentlyBorrows;

    function addBook(string memory _name, uint8 _copies) public onlyOwner {
        bool bookAlreadyExists = false;
        for (uint16 i = 0; i < bookNames.length; i++) {
            if (
                keccak256(abi.encodePacked(bookNames[i])) ==
                keccak256(abi.encodePacked(_name))
            ) {
                availableCopies[i] += _copies;
                bookAlreadyExists = true;
                break;
            }
        }

        if (!bookAlreadyExists) {
            bookNames.push(_name);
            availableCopies.push(_copies);
            previouslyBorrowed[(uint16)(bookNames.length - 1)] = new address[](
                0
            );
        }
    }

    function showAvailableBooks() public view returns (Book[] memory) {
        uint16 availableBooksCount = 0;
        for (uint16 i = 0; i < bookNames.length; i++) {
            if (availableCopies[i] > 0) {
                availableBooksCount++;
            }
        }

        if (availableBooksCount == 0) {
            return new Book[](0);
        }

        Book[] memory availableBooks = new Book[](availableBooksCount);
        uint16 index = 0;
        for (uint16 i = 0; i < bookNames.length; i++) {
            if (availableCopies[i] > 0) {
                Book memory book = Book(i, bookNames[i]);
                availableBooks[index++] = book;
            }
        }

        return availableBooks;
    }

    function borrowBook(uint16 _id) public {
        require(_id < bookNames.length, "There is no book with this id");

        for (uint8 i = 0; i < currentlyBorrows[msg.sender].length; i++) {
            require(
                currentlyBorrows[msg.sender][i] != _id,
                "You already have borrowed a copy of this book"
            );
        }

        require(
            availableCopies[_id] > 0,
            "There are no available copies of this book right now"
        );

        availableCopies[_id]--;
        currentlyBorrows[msg.sender].push(_id);
        previouslyBorrowed[_id].push(msg.sender);
    }

    function returnBook(uint16 _id) public {
        require(_id < bookNames.length, "There is no book with this id");

        bool hasBorrowed = false;
        for (uint8 i = 0; i < currentlyBorrows[msg.sender].length; i++) {
            if (currentlyBorrows[msg.sender][i] == _id) {
                hasBorrowed = true;
                for (
                    uint8 j = i;
                    j < currentlyBorrows[msg.sender].length - 1;
                    j++
                ) {
                    currentlyBorrows[msg.sender][j] = currentlyBorrows[
                        msg.sender
                    ][j + 1];
                }
            }

            if (hasBorrowed == true) break;
        }
        require(
            hasBorrowed,
            "You have not borrowed a copy of this book - so you cannot return one"
        );

        availableCopies[_id]++;
    }

    function getBorrowingHistory(uint16 _id)
        public
        view
        returns (address[] memory)
    {
        return previouslyBorrowed[_id];
    }
}
