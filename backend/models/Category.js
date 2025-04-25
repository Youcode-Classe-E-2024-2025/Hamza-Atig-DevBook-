
const { getDb } = require('../database');

class Category {
    constructor(id, name) {
        this.category_id = id;
        this.name = name;
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.all("SELECT * FROM Categories ORDER BY name", [], (err, rows) => {
                if (err) {
                    console.error("Error in Category.findAll:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => new Category(row.category_id, row.name)));
                }
            });
        });
    }

    static findById(id) {
         return new Promise((resolve, reject) => {
            const db = getDb();
            db.get("SELECT * FROM Categories WHERE category_id = ?", [id], (err, row) => {
                if (err) {
                    console.error(`Error in Category.findById (${id}):`, err.message);
                    reject(err);
                } else {
                    resolve(row ? new Category(row.category_id, row.name) : null);
                }
            });
        });
    }

    static create(categoryData) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const { name } = categoryData;
            if (!name || name.trim() === '') {
                return reject(new Error("Category name cannot be empty."));
            }
            db.run("INSERT INTO Categories (name) VALUES (?)", [name.trim()], function (err) { 
                if (err) {
                    console.error("Error in Category.create:", err.message);
                    reject(err);
                } else {
                    
                    Category.findById(this.lastID)
                        .then(newCategory => resolve(newCategory))
                        .catch(fetchErr => reject(fetchErr));
                }
            });
        });
    }

     static update(id, categoryData) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const { name } = categoryData;
             if (!name || name.trim() === '') {
                return reject(new Error("Category name cannot be empty for update."));
            }
            db.run("UPDATE Categories SET name = ? WHERE category_id = ?",
                [name.trim(), id],
                function (err) {
                    if (err) {
                        console.error(`Error in Category.update (${id}):`, err.message);
                        reject(err);
                    } else if (this.changes === 0) {
                        resolve(null); 
                    } else {
                        
                        Category.findById(id)
                            .then(updatedCategory => resolve(updatedCategory))
                            .catch(fetchErr => reject(fetchErr));
                    }
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const db = getDb();
             
            db.run("DELETE FROM Categories WHERE category_id = ?", [id], function (err) {
                if (err) {
                    console.error(`Error in Category.delete (${id}):`, err.message);
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

module.exports = Category;
