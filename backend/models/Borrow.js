
const { getDb } = require('../database');

class Borrow {
    constructor(id, book_id, user_id, borrow_date, due_date, return_date, bookTitle = null, userName = null) {
        this.borrow_id = id;
        this.book_id = book_id;
        this.user_id = user_id;
        this.borrow_date = borrow_date;
        this.due_date = due_date;
        this.return_date = return_date;
         
        this.book_title = bookTitle;
        this.user_name = userName;
    }

    static _fromDBRow(row) {
         if (!row) return null;
         return new Borrow(
             row.borrow_id,
             row.book_id,
             row.user_id,
             row.borrow_date,
             row.due_date,
             row.return_date,
             row.book_title, 
             row.user_name   
         );
    }

    static create(borrowData) {
        return new Promise(async (resolve, reject) => { 
            const db = getDb();
            
            const { book_id, user_id, due_date } = borrowData;
             let { borrow_date } = borrowData; 

            
            if (!book_id || !user_id || !due_date) {
               return reject(new Error("Missing required fields: book_id, user_id, due_date."));
            }
            if (borrow_date && !/^\d{4}-\d{2}-\d{2}$/.test(borrow_date)) {
                 return reject(new Error("Invalid borrow_date format. Use YYYY-MM-DD."));
            }
             if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
                 return reject(new Error("Invalid due_date format. Use YYYY-MM-DD."));
             }
             
             const effectiveBorrowDate = borrow_date || new Date().toISOString().split('T')[0];
             if (new Date(due_date) < new Date(effectiveBorrowDate)) {
                 return reject(new Error("Due date cannot be before borrow date."));
             }

            try {
                
                 const bookExists = await new Promise((res, rej) => {
                     db.get("SELECT book_id FROM Books WHERE book_id = ?", [book_id], (err, row) => err ? rej(err) : res(!!row));
                 });
                 if (!bookExists) {
                     return reject(new Error(`Book with ID ${book_id} does not exist.`));
                 }

                 
                  const userExists = await new Promise((res, rej) => {
                     db.get("SELECT user_id FROM Users WHERE user_id = ?", [user_id], (err, row) => err ? rej(err) : res(!!row));
                 });
                  if (!userExists) {
                     return reject(new Error(`User with ID ${user_id} does not exist.`));
                 }

                 
                  const isBorrowed = await new Promise((res, rej) => {
                    db.get("SELECT borrow_id FROM Borrows WHERE book_id = ? AND return_date IS NULL", [book_id], (err, row) => err ? rej(err) : res(!!row));
                  });
                 if (isBorrowed) {
                     return reject(new Error(`Book with ID ${book_id} is already currently borrowed.`));
                 }

                 
                 const sql = `INSERT INTO Borrows (book_id, user_id, due_date, borrow_date)
                             VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE))`; 
                 db.run(sql, [book_id, user_id, due_date, borrow_date], function (insertErr) { 
                     if (insertErr) {
                          console.error("Error in Borrow.create:", insertErr.message);
                          reject(insertErr); 
                     } else {
                         
                         Borrow.findById(this.lastID)
                            .then(newBorrow => resolve(newBorrow))
                            .catch(fetchErr => reject(fetchErr));
                     }
                 });

            } catch (error) {
                 console.error("Error during borrow creation checks:", error.message);
                 reject(error);
            }
        });
    }

     static returnBook(borrow_id, return_date = null) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            let effectiveReturnDate = return_date;

            if (!effectiveReturnDate) {
                effectiveReturnDate = new Date().toISOString().split('T')[0]; 
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveReturnDate)) {
                 return reject(new Error("Invalid return_date format. Use YYYY-MM-DD."));
            }

            
            

            const sql = "UPDATE Borrows SET return_date = ? WHERE borrow_id = ? AND return_date IS NULL";
            db.run(sql, [effectiveReturnDate, borrow_id], function (err) {
                if (err) {
                     console.error(`Error in Borrow.returnBook (${borrow_id}):`, err.message);
                    reject(err);
                } else if (this.changes === 0) {
                     
                     
                     db.get("SELECT borrow_id FROM Borrows WHERE borrow_id = ?", [borrow_id], (findErr, row) => {
                         if (findErr) reject(findErr);
                         else if (!row) reject(new Error(`Borrow record with ID ${borrow_id} not found.`));
                         else reject(new Error(`Book for borrow ID ${borrow_id} was already returned.`));
                     });
                } else {
                     
                    Borrow.findById(borrow_id)
                        .then(updatedBorrow => resolve(updatedBorrow))
                        .catch(fetchErr => reject(fetchErr));
                }
            });
        });
    }

     
     static findById(id) {
         return new Promise((resolve, reject) => {
             const db = getDb();
             const sql = `
                 SELECT br.*, b.title as book_title, u.username as user_name
                 FROM Borrows br
                 LEFT JOIN Books b ON br.book_id = b.book_id
                 LEFT JOIN Users u ON br.user_id = u.user_id
                 WHERE br.borrow_id = ?
             `;
             db.get(sql, [id], (err, row) => {
                 if (err) {
                    console.error(`Error in Borrow.findById (${id}):`, err.message);
                    reject(err);
                 } else {
                     resolve(Borrow._fromDBRow(row)); 
                 }
             });
         });
     }


     
     static findAll(options = {}) {
         return new Promise((resolve, reject) => {
             const db = getDb();
             
             let sql = `
                 SELECT br.*, b.title as book_title, u.username as user_name
                 FROM Borrows br
                 LEFT JOIN Books b ON br.book_id = b.book_id
                 LEFT JOIN Users u ON br.user_id = u.user_id
                 ORDER BY br.borrow_date DESC
             `;
             
             const params = [];
              if (options.limit) {
                 const page = parseInt(options.page) || 1;
                 const limit = parseInt(options.limit);
                 const offset = (page - 1) * limit;
                 sql += ` LIMIT ? OFFSET ?`;
                 params.push(limit, offset);
             }

             db.all(sql, params, (err, rows) => {
                 if (err) {
                     console.error("Error in Borrow.findAll:", err.message);
                     reject(err);
                 } else {
                     resolve(rows.map(Borrow._fromDBRow));
                 }
             });
         });
     }
}

module.exports = Borrow;
