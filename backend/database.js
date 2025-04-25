
const sqlite3 = require('sqlite3').verbose(); 


const dbFile = './devbook.db';
let db = null; 


function connectDb() {
    return new Promise((resolve, reject) => {
        
        if (db && db.open) { 
            db.close((err) => {
                if (err) {
                    console.error('Error closing existing DB connection:', err.message);
                    
                }
                db = null; 
            });
        }

        db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the SQLite database.');
                
                db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
                    if (pragmaErr) {
                        console.error("Could not enable foreign keys:", pragmaErr.message);
                        reject(pragmaErr);
                    } else {
                        console.log("Foreign key support enabled.");
                        resolve(db); 
                    }
                });
            }
        });
    });
}


async function initializeDb() {
    try {
        const dbInstance = await connectDb(); 

        
        dbInstance.serialize(() => {
            console.log('Initializing database schema...');

            dbInstance.run(`
                CREATE TABLE IF NOT EXISTS Categories (
                    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                )
            `, (err) => { if (err) console.error("Error creating Categories table:", err.message); else console.log("Categories table checked/created."); });

            dbInstance.run(`
                CREATE TABLE IF NOT EXISTS Books (
                    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    author TEXT,
                    isbn TEXT UNIQUE,
                    description TEXT,
                    category_id INTEGER,
                    read_status TEXT CHECK(read_status IN ('lu', 'en cours', 'à lire')) DEFAULT 'à lire',
                    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
                )
            `, (err) => { if (err) console.error("Error creating Books table:", err.message); else console.log("Books table checked/created."); });

            dbInstance.run(`
                CREATE TABLE IF NOT EXISTS Users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT UNIQUE
                )
            `, (err) => { if (err) console.error("Error creating Users table:", err.message); else console.log("Users table checked/created."); });

            dbInstance.run(`
                CREATE TABLE IF NOT EXISTS Borrows (
                    borrow_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    book_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    due_date DATE NOT NULL,
                    return_date DATE,
                    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
                )
            `, (err) => { if (err) console.error("Error creating Borrows table:", err.message); else console.log("Borrows table checked/created."); });

            console.log('Database schema initialization finished.');
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1); 
    }
}


function getDb() {
    if (!db || !db.open) { 
        console.error("Database not connected or closed. Critical error.");
        throw new Error("Database connection is not available.");
        
    }
    return db;
}

module.exports = {
    initializeDb,
    getDb,
    connectDb 
};
