
const Book = require('../models/Book');


const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);


exports.getAllBooks = asyncHandler(async (req, res, next) => {
    
    const options = {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort, 
        category: req.query.category, 
        status: req.query.status, 
        search: req.query.search 
    };
    
     Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);

    const result = await Book.findAll(options);
    res.status(200).json(result); 
});

exports.getBookById = asyncHandler(async (req, res, next) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
});

exports.createBook = asyncHandler(async (req, res, next) => {
    
    const { title } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ message: "Book title is required" });
    }
    
    const newBook = await Book.create(req.body);
    res.status(201).json(newBook);
});

exports.updateBook = asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ message: "Book title is required for update" });
    }
    const updatedBook = await Book.update(req.params.id, req.body);
    if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(updatedBook);
});

exports.deleteBook = asyncHandler(async (req, res, next) => {
    const success = await Book.delete(req.params.id);
    if (!success) {
        return res.status(404).json({ message: "Book not found" });
    }
    res.status(204).send(); 
});
