
const { getDb } = require('../database');


const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);


const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        try {
            const db = getDb(); 
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error("SQL Error:", err.message, "\nSQL:", sql, "\nParams:", params);
                    
                    const queryError = new Error(`Database query failed: ${err.message}`);
                    queryError.status = 500; 
                    queryError.sql = sql;
                    queryError.params = params;
                    reject(queryError);
                } else {
                    resolve(rows);
                }
            });
        } catch (dbErr) {
             
             console.error("Failed to get DB connection:", dbErr.message);
             const connectionError = new Error(`Database connection error: ${dbErr.message}`);
             connectionError.status = 503; 
             reject(connectionError);
        }
    });
};


exports.getBookBorrowers = asyncHandler(async (req, res, next) => {
    const { bookId } = req.params;
    if (!/^\d+$/.test(bookId)) {
         return res.status(400).json({ message: "Invalid Book ID format." });
    }
    const sql = `
        SELECT u.user_id, u.username, COUNT(br.borrow_id) as borrow_count, MAX(br.borrow_date) as last_borrow_date
        FROM Borrows br
        JOIN Users u ON br.user_id = u.user_id
        WHERE br.book_id = ?
        GROUP BY u.user_id, u.username
        ORDER BY last_borrow_date DESC
    `;
    const results = await runQuery(sql, [bookId]);
    res.status(200).json(results);
});


exports.getOverdueBooks = asyncHandler(async (req, res, next) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
        SELECT b.title, b.book_id, u.username, u.user_id, br.borrow_id, br.borrow_date, br.due_date
        FROM Borrows br
        JOIN Books b ON br.book_id = b.book_id
        JOIN Users u ON br.user_id = u.user_id
        WHERE br.return_date IS NULL AND br.due_date < date('now', 'localtime') -- Use SQLite date function for safety
        ORDER BY br.due_date ASC
    `;
    const results = await runQuery(sql); 
    res.status(200).json(results);
});


exports.getCategoryCounts = asyncHandler(async (req, res, next) => {
    const sql = `
        SELECT c.category_id, c.name, COUNT(b.book_id) as book_count
        FROM Categories c
        LEFT JOIN Books b ON c.category_id = b.category_id
        GROUP BY c.category_id, c.name
        ORDER BY c.name
    `;
    const results = await runQuery(sql);
    res.status(200).json(results);
});


exports.getMostBorrowedCategories = asyncHandler(async (req, res, next) => {
    
    const sql = `
        SELECT c.category_id, c.name, COUNT(br.borrow_id) as total_borrows
        FROM Categories c
        JOIN Books b ON c.category_id = b.category_id -- INNER JOIN excludes books with NULL category_id
        JOIN Borrows br ON b.book_id = br.book_id
        GROUP BY c.category_id, c.name
        ORDER BY total_borrows DESC, c.name ASC -- Added secondary sort by name
    `;
    const results = await runQuery(sql);
    res.status(200).json(results);
});


exports.getBorrowsByDate = asyncHandler(async (req, res, next) => {
    const { date } = req.query; 
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
         return res.status(400).json({ message: "Valid date parameter (YYYY-MM-DD) is required." });
    }
    const sql = `
        SELECT br.*, b.title as book_title, u.username as user_name
        FROM Borrows br
        LEFT JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Users u ON br.user_id = u.user_id
        WHERE date(br.borrow_date) = ?
        ORDER BY br.borrow_id
    `;
    const results = await runQuery(sql, [date]);
    res.status(200).json(results);
});


exports.getTopBorrowedBooksByMonth = asyncHandler(async (req, res, next) => {
    const { month } = req.query; 
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
         return res.status(400).json({ message: "Valid month parameter (YYYY-MM) is required." });
    }
    const sql = `
        SELECT b.book_id, b.title, COUNT(br.borrow_id) as borrow_count
        FROM Books b
        JOIN Borrows br ON b.book_id = br.book_id
        WHERE strftime('%Y-%m', br.borrow_date) = ?
        GROUP BY b.book_id, b.title
        ORDER BY borrow_count DESC, b.title ASC -- Added secondary sort by title
        LIMIT 10
    `;
    const results = await runQuery(sql, [month]);
    res.status(200).json(results);
});
