
const { getDb } = require('../database');

class Book {
    
    constructor(id, title, author, isbn, description, category_id, read_status, categoryName = null) {
        this.book_id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.description = description;
        this.category_id = category_id;
        this.read_status = read_status;
        this.category_name = categoryName; 
    }

    
    static _fromDBRow(row) {
         if (!row) return null; 
         return new Book(
            row.book_id,
            row.title,
            row.author,
            row.isbn,
            row.description,
            row.category_id,
            row.read_status,
            row.category_name 
        );
    }

    
    static findAll(options = {}) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            let sqlData = `
                SELECT b.*, c.name as category_name
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.category_id
            `;
            let sqlCount = `
                SELECT COUNT(*) as totalItems
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.category_id
            `; 

            const params = [];
            const conditions = [];

            
            if (options.category) {
                conditions.push("b.category_id = ?");
                params.push(options.category);
            }
            if (options.status) {
                conditions.push("b.read_status = ?");
                params.push(options.status);
            }
             if (options.search) {
                conditions.push("(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)");
                const searchTerm = `%${options.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (conditions.length > 0) {
                const whereClause = " WHERE " + conditions.join(" AND ");
                sqlData += whereClause;
                sqlCount += whereClause;
            }

            
            const allowedSorts = {
                 'title': 'b.title',
                 'author': 'b.author',
                 'read_status': 'b.read_status',
                 'category_name': 'c.name'
                 };
            let orderBy = 'b.title ASC'; 
             if (options.sort) {
                 const [column, directionInput] = options.sort.split('_'); 
                 const sortColumn = allowedSorts[column];
                 if (sortColumn) {
                    const sortDirection = directionInput?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
                    orderBy = `${sortColumn} ${sortDirection}`;
                 }
             }
            sqlData += ` ORDER BY ${orderBy}`;


             
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10; 
            const offset = (page - 1) * limit;

            
            db.get(sqlCount, params, (countErr, countRow) => {
                if (countErr) {
                     console.error("Error counting books:", countErr.message);
                     return reject(countErr);
                 }
                 const totalItems = countRow ? countRow.totalItems : 0;
                 const totalPages = Math.ceil(totalItems / limit);

                 
                 sqlData += ` LIMIT ? OFFSET ?`;
                 const dataParams = [...params, limit, offset]; 

                
                db.all(sqlData, dataParams, (err, rows) => {
                    if (err) {
                        console.error("Error fetching books data:", err.message);
                        reject(err);
                    } else {
                         resolve({
                             data: rows.map(Book._fromDBRow), 
                             meta: {
                                 currentPage: page,
                                 totalPages: totalPages,
                                 totalItems: totalItems,
                                 itemsPerPage: limit
                             }
                         });
                    }
                });
             });
        });
    }

    static findById(id) {
         return new Promise((resolve, reject) => {
            const db = getDb();
            const sql = `
                SELECT b.*, c.name as category_name
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.category_id
                WHERE b.book_id = ?
            `;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error(`Error in Book.findById (${id}):`, err.message);
                    reject(err);
                } else {
                    resolve(Book._fromDBRow(row)); 
                }
            });
        });
    }

    static create(bookData) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const { title, author, isbn, description, category_id, read_status } = bookData;
            
             if (!title || title.trim() === '') {
                 return reject(new Error("Book title cannot be empty."));
             }
            
            const catId = (category_id === 0 || category_id === undefined || category_id === null) ? null : Number(category_id);
            const status = read_status || 'à lire'; 

            const sql = `
                INSERT INTO Books (title, author, isbn, description, category_id, read_status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.run(sql, [title.trim(), author?.trim(), isbn?.trim(), description?.trim(), catId, status], function (err) {
                if (err) {
                     console.error("Error in Book.create:", err.message);
                    reject(err); 
                } else {
                    
                     Book.findById(this.lastID)
                         .then(newBook => resolve(newBook))
                         .catch(fetchErr => reject(fetchErr));
                }
            });
        });
    }

    static update(id, bookData) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const { title, author, isbn, description, category_id, read_status } = bookData;
             if (!title || title.trim() === '') {
                 return reject(new Error("Book title cannot be empty for update."));
             }
            const catId = (category_id === 0 || category_id === undefined || category_id === null) ? null : Number(category_id);
            const status = read_status || 'à lire';

            const sql = `
                UPDATE Books SET
                    title = ?, author = ?, isbn = ?, description = ?,
                    category_id = ?, read_status = ?
                WHERE book_id = ?
            `;
            db.run(sql, [title.trim(), author?.trim(), isbn?.trim(), description?.trim(), catId, status, id], function (err) {
                if (err) {
                     console.error(`Error in Book.update (${id}):`, err.message);
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(null); 
                } else {
                     
                    Book.findById(id)
                        .then(updatedBook => resolve(updatedBook))
                        .catch(fetchErr => reject(fetchErr));
                }
            });
        });
    }

     static delete(id) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            
            db.run("DELETE FROM Books WHERE book_id = ?", [id], function (err) {
                if (err) {
                    console.error(`Error in Book.delete (${id}):`, err.message);
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(false); 
                } else {
                    resolve(true); 
                }
            });
        });
    }
}

module.exports = Book;
