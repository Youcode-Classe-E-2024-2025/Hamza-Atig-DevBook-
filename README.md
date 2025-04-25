# DevBook Project

Web application for managing technical books, implemented with Node.js, Express, SQLite, and vanilla JavaScript.

## Project Structure

-   `backend/`: Node.js/Express server code
    -   `controllers/`: Request handling logic
    -   `models/`: Data representation classes (Book, Category, User, Borrow)
    -   `routes/`: API route definitions
    -   `database.js`: SQLite database connection and initialization
    -   `server.js`: Main Express server setup
-   `frontend/`: Client-side HTML, CSS, JavaScript
    -   `index.html`: Main application page
    -   `style.css`: Stylesheet
    -   `app.js`: Client-side JavaScript logic
-   `uml/`: UML diagrams (Use Case, Class Diagram)
-   `devbook.db`: SQLite database file (created on first run)

## Setup & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run Backend Server:**
    ```bash
    node backend/server.js
    ```
    The server will start, usually on `http://localhost:3000`, and initialize the `devbook.db` database file if it doesn't exist.
3.  **Access Frontend:**
    Open `frontend/index.html` in your web browser. Using a simple HTTP server (like VS Code Live Server or `python -m http.server`) in the `frontend` directory might be necessary for proper API interaction depending on browser security settings (CORS is enabled on the backend).

## API Endpoints (Implemented in Days 1-3)

-   **Categories:**
    -   `GET /api/categories`: Get all categories
    -   `POST /api/categories`: Create a new category (`{ "name": "..." }`)
    -   `GET /api/categories/:id`: Get category by ID
    -   `PUT /api/categories/:id`: Update category (`{ "name": "..." }`)
    -   `DELETE /api/categories/:id`: Delete category
-   **Books:**
    -   `GET /api/books`: Get all books (supports query params: `page`, `limit`, `sort`, `category`, `status`, `search`)
    -   `POST /api/books`: Create a new book (JSON body with book details)
    -   `GET /api/books/:id`: Get book by ID
    -   `PUT /api/books/:id`: Update book (JSON body with book details)
    -   `DELETE /api/books/:id`: Delete book
-   **Borrows:**
    -   `GET /api/borrows`: Get all borrow records
    -   `POST /api/borrows`: Create a borrow record (`{ "book_id": ..., "user_id": ..., "due_date": "YYYY-MM-DD" }`)
    -   `PUT /api/borrows/:borrow_id/return`: Mark a book as returned (optional `return_date` in body)
-   **Reports:**
    -   `GET /api/reports/book/:bookId/borrowers`: Users who borrowed a specific book
    -   `GET /api/reports/overdue-books`: Overdue books not yet returned
    -   `GET /api/reports/category-counts`: Number of books per category
    -   `GET /api/reports/most-borrowed-categories`: Categories sorted by borrow count
    -   `GET /api/reports/borrows-by-date?date=YYYY-MM-DD`: Borrows on a specific date
    -   `GET /api/reports/top-borrowed-books?month=YYYY-MM`: Top 10 borrowed books in a specific month
