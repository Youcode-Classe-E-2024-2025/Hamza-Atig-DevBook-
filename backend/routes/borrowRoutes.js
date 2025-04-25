
const express = require('express');
const borrowController = require('../controllers/borrowController');
const router = express.Router();


router.route('/')
    .get(borrowController.getAllBorrows) 
    .post(borrowController.createBorrow); 


router.route('/:borrow_id')
    .get(borrowController.getBorrowById); 


router.put('/:borrow_id/return', borrowController.returnBook); 

module.exports = router;
