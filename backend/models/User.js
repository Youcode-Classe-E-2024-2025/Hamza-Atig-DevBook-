
const { getDb } = require('../database');

class User {
    constructor(id, username, email) {
        this.user_id = id;
        this.username = username;
        this.email = email;
    }

    static findAll() {
         return new Promise((resolve, reject) => {
            const db = getDb();
            db.all("SELECT * FROM Users ORDER BY username", [], (err, rows) => {
                if (err) {
                     console.error("Error in User.findAll:", err.message);
                     reject(err);
                 } else resolve(rows.map(row => new User(row.user_id, row.username, row.email)));
            });
        });
    }

    static findById(id) {
         return new Promise((resolve, reject) => {
            const db = getDb();
            db.get("SELECT * FROM Users WHERE user_id = ?", [id], (err, row) => {
                if (err) {
                    console.error(`Error in User.findById (${id}):`, err.message);
                    reject(err);
                } else resolve(row ? new User(row.user_id, row.username, row.email) : null);
            });
        });
    }

    static create(userData) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const { username, email } = userData;
             if (!username || username.trim() === '') {
                 return reject(new Error("Username cannot be empty."));
             }
             
             if (email && !/.+@.+\..+/.test(email)) {
                 return reject(new Error("Invalid email format."));
             }

            db.run("INSERT INTO Users (username, email) VALUES (?, ?)",
             [username.trim(), email?.trim()], function (err) {
                if (err) {
                    console.error("Error in User.create:", err.message);
                    reject(err);
                } else {
                    
                    User.findById(this.lastID)
                        .then(newUser => resolve(newUser))
                        .catch(fetchErr => reject(fetchErr));
                }
            });
        });
    }

     static update(id, userData) {
         return new Promise((resolve, reject) => {
             const db = getDb();
             const { username, email } = userData;
             if (!username || username.trim() === '') {
                 return reject(new Error("Username cannot be empty for update."));
             }
              if (email && !/.+@.+\..+/.test(email)) {
                 return reject(new Error("Invalid email format for update."));
             }
             db.run("UPDATE Users SET username = ?, email = ? WHERE user_id = ?",
                 [username.trim(), email?.trim(), id],
                 function (err) {
                     if (err) {
                         console.error(`Error in User.update (${id}):`, err.message);
                         reject(err);
                     } else if (this.changes === 0) resolve(null); 
                     else {
                         
                         User.findById(id)
                             .then(updatedUser => resolve(updatedUser))
                             .catch(fetchErr => reject(fetchErr));
                     }
                 });
         });
     }

     static delete(id) {
         return new Promise((resolve, reject) => {
             const db = getDb();
              
             db.run("DELETE FROM Users WHERE user_id = ?", [id], function (err) {
                 if (err) {
                    console.error(`Error in User.delete (${id}):`, err.message);
                    reject(err);
                 } else if (this.changes === 0) resolve(false); 
                 else resolve(true); 
             });
         });
     }
}
module.exports = User;
