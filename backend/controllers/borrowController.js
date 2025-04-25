
const Borrow = require('../models/Borrow');


const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);


exports.getAllBorrows = asyncHandler(async (req, res, next) => {
    const options = {
        page: req.query.page,
        limit: req.query.limit
    };
    Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);

    const borrows = await Borrow.findAll(options);
    
    res.status(200).json(borrows);
});

exports.getBorrowById = asyncHandler(async (req, res, next) => {
    const borrow = await Borrow.findById(req.params.borrow_id);
    if (!borrow) {
        return res.status(404).json({ message: "Borrow record not found" });
    }
    res.status(200).json(borrow);
});


exports.createBorrow = asyncHandler(async (req, res, next) => {
    
    const borrowData = req.body;
    
    const newBorrow = await Borrow.create(borrowData);
    res.status(201).json(newBorrow);
});

exports.returnBook = asyncHandler(async (req, res, next) => {
    const { borrow_id } = req.params;
    
    const { return_date } = req.body;

    const returnedBorrow = await Borrow.returnBook(borrow_id, return_date);
    
    res.status(200).json({ message: "Book returned successfully", data: returnedBorrow });
});
