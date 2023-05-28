// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BooksLibrary is Ownable {
    struct Book {
        string title;
        uint8 copies;
        address[] bookBorrowedAddresses;
    }


    bytes32[] public bookId;
    uint8 private availableBooksCount;
    mapping(bytes32 => bool) public availableBooks;
    mapping(bytes32 => Book) public books;
    mapping(address => mapping(bytes32 => bool)) public borrowedBook;
    

    event LogAddedBook(bytes32 id, string title, uint8 copies);
    event LogBorrowedBook(address borrowerAddress, bytes32 bookId);
    event LogReturnedBook(address returnerAddress, bytes32 bookId);


    modifier validBookData(string memory _title, uint8 _copies) {
        bytes memory tempTitle = bytes(_title);
        require(tempTitle.length > 0 && _copies > 0, "Book data is not valid!");
        _;
    }
    modifier bookDoesNotExist(bytes32 _bookId) {
        require(bookExists(_bookId), "Book with such Id does not exist");
        _;
    }


    function addBook(string memory _title, uint8 _copies) public onlyOwner validBookData(_title, _copies) {
        bytes32 _bookId = keccak256(abi.encodePacked(_title));

        if(!bookExists(_bookId)) {
            address[] memory borrowed;
            books[_bookId] = Book(_title, 0, borrowed);
            bookId.push(_bookId);
        }

        books[_bookId].copies += _copies;
        availableBooks[_bookId] = true;
        availableBooksCount++;

        emit LogAddedBook(_bookId, _title, _copies);
    }

    function borrowBook(bytes32 _bookId) bookDoesNotExist(_bookId)  public {
        require(!(borrowedBook[msg.sender][_bookId]), "You have already borrowed this book!");
        require(availableBooks[_bookId], "There are no available copies of this book right now!");
       
        Book storage book = books[_bookId];
        book.bookBorrowedAddresses.push(msg.sender);
        book.copies--;

        if (book.copies == 0) {
            availableBooks[_bookId] = false;
            availableBooksCount--;
        }     

        borrowedBook[msg.sender][_bookId] = true;

        emit LogBorrowedBook(msg.sender, _bookId);
    }

    function returnBook(bytes32 _bookId) bookDoesNotExist(_bookId)  public {
        require(borrowedBook[msg.sender][_bookId], "You cannot return a book that you have not borrowed!");
        
        books[_bookId].copies++;
        borrowedBook[msg.sender][_bookId] = false;
        
        if(!availableBooks[_bookId]) {
            availableBooks[_bookId] = true;
            availableBooksCount++;
        }

        emit LogReturnedBook(msg.sender, _bookId);
    }

    function getAllAddressesThatBorrowedBook(bytes32 _bookId) bookDoesNotExist(_bookId) public view returns(address[] memory) {
        return books[_bookId].bookBorrowedAddresses;
    }

    function getAllAvailableBooks() public view returns(bytes32[] memory) {
        bytes32[] memory _availableBooks = new bytes32[](availableBooksCount);
        
        uint8 counter = 0;
        for(uint8 i = 0; i < bookId.length; i++) {
            if(availableBooks[bookId[i]]) {
                _availableBooks[counter++] = bookId[i];
            }
        }

        return _availableBooks;
    }

    function bookExists(bytes32 _bookId) private view returns(bool) {
        return(keccak256(abi.encodePacked(books[_bookId].title)) != keccak256(abi.encodePacked("")));
    }
}
