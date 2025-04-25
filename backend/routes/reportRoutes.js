
const express = require('express');
const reportController = require('../controllers/reportController');
const router = express.Router();


router.get('/book/:bookId/borrowers', reportController.getBookBorrowers);
router.get('/overdue-books', reportController.getOverdueBooks);
router.get('/category-counts', reportController.getCategoryCounts);
router.get('/most-borrowed-categories', reportController.getMostBorrowedCategories);
router.get('/borrows-by-date', reportController.getBorrowsByDate); 
router.get('/top-borrowed-books', reportController.getTopBorrowedBooksByMonth); 

module.exports = router;
