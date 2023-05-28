import { BooksLibrary } from "./../typechain-types/contracts/BooksLibrary";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BooksLibrary", function () {
    let booksLibraryFactory;
    let booksLibrary: BooksLibrary;

    before(async () => {
        booksLibraryFactory = await ethers.getContractFactory("BooksLibrary");

        booksLibrary = await booksLibraryFactory.deploy();

        await booksLibrary.deployed();
    });
    
    it("Should return all available books ", async function () {
        const [owner, addr1] = await ethers.getSigners();

        await booksLibrary.addBook("Book1", 1); //Adding book to library
        await booksLibrary.addBook("Book2", 2); //Adding book to library

        expect((await booksLibrary.getAllAvailableBooks()).length).to.equal(2);

        const bookId1 = ethers.utils.solidityKeccak256(["string"],["Book1"]); //Get bookId
        const bookId2 = ethers.utils.solidityKeccak256(["string"],["Book2"]); //Get bookId

        await booksLibrary.connect(addr1).borrowBook(bookId1);

        expect((await booksLibrary.getAllAvailableBooks()).length).to.equal(1);
        expect((await booksLibrary.getAllAvailableBooks()).includes(bookId2)).true;
        
    });

    it("Should add book and get book by id", async function () {
        await booksLibrary.addBook("Title", 125); //Adding book to library
        const bookId = ethers.utils.solidityKeccak256(["string"],["Title"]); //Get bookId

        expect((await booksLibrary.books(bookId)).title).to.equal("Title"); //Title
        expect((await booksLibrary.books(bookId)).copies).to.equal(125); //125
    });

    it("Should add more copie to existing book", async function () {
        await booksLibrary.addBook("Title", 125); //Adding book to library    
        const bookId = ethers.utils.solidityKeccak256(["string"],["Title"]); //Get bookId

        expect((await booksLibrary.books(bookId)).copies).to.equal(250); //125
    });

    it("Should throw on trying to add book with not the owner", async function () {
        const [owner, addr1] = await ethers.getSigners();

        await expect(booksLibrary.connect(addr1).addBook("Title", 125)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Should throw on trying to add book with not valid arguments", async function () {
        await expect(booksLibrary.addBook("Title", 0)).to.be.revertedWith('Book data is not valid!');
        await expect(booksLibrary.addBook("", 15)).to.be.revertedWith('Book data is not valid!');
        await expect(booksLibrary.addBook("", 0)).to.be.revertedWith('Book data is not valid!');
    });

    it(`Should borrow book and user's address should be marked as true in borrowedBook, 
        book copies should be less with 1 and book's bookBorrowedAddresses should contain user's address`, async function () {
        const [owner, addr1] = await ethers.getSigners();

        await booksLibrary.addBook("Title2", 125); //Adding book to library
        const bookId = ethers.utils.solidityKeccak256(["string"],["Title2"]); //Get bookId
        const copies = (await booksLibrary.books(bookId)).copies;
        await booksLibrary.connect(addr1).borrowBook(bookId);
        expect((await booksLibrary.books(bookId)).copies).to.equal(copies - 1);  //Copies are less with 1
        expect((await booksLibrary.borrowedBook(addr1.address, bookId))).true;     
        expect((await booksLibrary.getAllAddressesThatBorrowedBook(bookId)).includes(addr1.address)).true
    });

    it("Should throw on trying to borrow book from address that have already borrowed the book", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
       
        await booksLibrary.addBook("Harry Potter", 6); //Adding book to library
        
        const bookId = ethers.utils.solidityKeccak256(["string"],["Harry Potter"]);
      
        await booksLibrary.connect(addr1).borrowBook(bookId);
        expect((await booksLibrary.borrowedBook(addr1.address, bookId))).true;     
        
        await expect(booksLibrary.connect(addr1).borrowBook(bookId)).to.be.revertedWith('You have already borrowed this book!');
    });

    it("Should throw on trying to borrow book with no available coppies at the moment", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
       
        await booksLibrary.addBook("Dune", 1); //Adding book to library
        
        const bookId = ethers.utils.solidityKeccak256(["string"],["Dune"]);
      
        await booksLibrary.connect(addr1).borrowBook(bookId);
        expect((await booksLibrary.borrowedBook(addr1.address, bookId))).true;     
        
        await expect(booksLibrary.connect(addr2).borrowBook(bookId)).to.be.revertedWith('There are no available copies of this book right now!');
      
    });

    it("Should throw on trying to borrow or return book that does not exist in the library", async function () {
        const [owner, addr1] = await ethers.getSigners();
        const bookId = ethers.utils.solidityKeccak256(["string"],["FAKE ID"]);
      
        await expect(booksLibrary.connect(addr1).borrowBook(bookId)).to.be.revertedWith('Book with such Id does not exist');
        await expect(booksLibrary.connect(addr1).returnBook(bookId)).to.be.revertedWith('Book with such Id does not exist');
    });

    it(`Should expect address that returns book to be false in borrowedBook and copies of that book to be more with 1 after the return`, async function () {
        const [owner, addr1] = await ethers.getSigners();

        await booksLibrary.addBook("Title3", 2);
        const bookId = ethers.utils.solidityKeccak256(["string"],["Title3"]);
        const copies = (await booksLibrary.books(bookId)).copies;
        
        await booksLibrary.connect(addr1).borrowBook(bookId);
        expect((await booksLibrary.books(bookId)).copies).to.equal(copies - 1);
        
        await booksLibrary.connect(addr1).returnBook(bookId);
        expect((await booksLibrary.books(bookId)).copies).to.equal(copies);  //Copies are more with 1
        expect((await booksLibrary.borrowedBook(addr1.address, bookId))).false;     
    });

    it(`Should expect available books to be more with 1 after address returns book that is not available at the moment`, async function () {
        const [owner, addr1] = await ethers.getSigners();

        await booksLibrary.addBook("Title4", 1);
        const bookId = ethers.utils.solidityKeccak256(["string"],["Title4"]);
        
        await booksLibrary.connect(addr1).borrowBook(bookId);
        const availableBooksCount = (await booksLibrary.getAllAvailableBooks()).length;
        await booksLibrary.connect(addr1).returnBook(bookId);
        
        expect((await booksLibrary.getAllAvailableBooks()).length).to.equal(availableBooksCount + 1);    
    });

    it("Should throw on trying to return a book from address that have not borrowed the book", async function () {
        const [owner, addr1] = await ethers.getSigners();

        await booksLibrary.addBook("Lord of the rings", 100); //Adding book to library
        const bookId = ethers.utils.solidityKeccak256(["string"],["Lord of the rings"]);

        await expect(booksLibrary.connect(addr1).returnBook(bookId)).to.be.revertedWith('You cannot return a book that you have not borrowed!');
    });

    it("Should throw on trying to call getAllAddressesThatBorrowedBook for book that does not exist in the library", async function () {
        const [owner, addr1] = await ethers.getSigners();
        const bookId = ethers.utils.solidityKeccak256(["string"],["FAKE ID"]);
      
        await expect(booksLibrary.connect(addr1).getAllAddressesThatBorrowedBook(bookId)).to.be.revertedWith('Book with such Id does not exist');
    });
});
