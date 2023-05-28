import { ethers } from "hardhat";

export async function main() {   
    const BooksLibrary_Factory = await ethers.getContractFactory("BooksLibrary");
    const booksLibrary = await BooksLibrary_Factory.deploy();
    await booksLibrary.deployed();
    console.log(`The BooksLibrary contract is deployed to ${booksLibrary.address}`);
   
    const owner = await booksLibrary.owner();
    console.log(`The BooksLibrary contract owner is ${owner}`);
}