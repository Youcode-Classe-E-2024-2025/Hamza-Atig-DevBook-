
const express = require('express');
const cors = require('cors');
const { initializeDb } = require('./database');


const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const reportRoutes = require('./routes/reportRoutes');




const app = express();
const PORT = process.env.PORT || 3000;

initializeDb().then(() => {
    console.log("Database initialized successfully.");

    
    app.use(cors()); 
    app.use(express.json()); 

    
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
        next();
    });

    
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to DevBook API!' }); 
    });

    
    app.use('/api/books', bookRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/borrows', borrowRoutes);
    app.use('/api/reports', reportRoutes);
    

    
    
    app.use((req, res, next) => {
        res.status(404).json({ message: 'Not Found' });
    });

    
    app.use((err, req, res, next) => {
        console.error("Global Error Handler:", err);
        
        const statusCode = err.status || 500; 
        res.status(statusCode).json({
             message: err.message || 'Internal Server Error',
             
             
        });
    });

    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

}).catch(error => {
    console.error("Failed to start server due to DB initialization error:", error);
    process.exit(1); 
});
