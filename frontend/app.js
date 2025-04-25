

document.addEventListener('DOMContentLoaded', () => {
    
    const API_BASE_URL = 'http://localhost:3000/api'; 
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = { 
        search: '',
        category: '',
        status: '',
        sort: 'title_asc' 
    };

    
    const bookListBody = document.getElementById('book-list');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfoSpan = document.getElementById('page-info');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');

    
    const searchInput = document.getElementById('search-input');
    const categoryFilterSelect = document.getElementById('category-filter');
    const statusFilterSelect = document.getElementById('status-filter');
    const sortFilterSelect = document.getElementById('sort-filter');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');

    
    const addBookBtn = document.getElementById('add-book-btn');
    const bookModal = document.getElementById('book-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const closeModalBtn = bookModal.querySelector('.close-btn');
    const bookIdInput = document.getElementById('book-id'); 
    const formErrorDiv = document.getElementById('form-error');
    const modalCategorySelect = document.getElementById('category'); 

    
    const showLoading = () => {
        if(loadingIndicator) loadingIndicator.style.display = 'flex';
        if(bookListBody) bookListBody.style.display = 'none'; 
         clearError(); 
    };

    const hideLoading = () => {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if(bookListBody) bookListBody.style.display = ''; 
    };

    const displayError = (message, target = errorMessageDiv) => {
        if (target) {
            target.textContent = `Erreur: ${message}`;
            target.style.display = 'block';
        }
        console.error(message); 
        hideLoading(); 
    };

    const clearError = (target = errorMessageDiv) => {
        if (target) {
            target.textContent = '';
            target.style.display = 'none';
        }
    };

    

    /** Fetches books from the API with pagination, filtering, sorting */
    const fetchBooks = async (page = 1, options = {}) => {
        showLoading();
        
        const queryParams = {
            page,
            limit: 10, 
            ...currentFilters, 
            ...options 
        };

        
        Object.keys(queryParams).forEach(key => {
            if (!queryParams[key]) delete queryParams[key];
        });

        const queryString = new URLSearchParams(queryParams).toString();
        const url = `${API_BASE_URL}/books?${queryString}`;
        console.log(`Fetching: ${url}`); 

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json(); 
            renderBookList(result.data || []);
            renderPagination(result.meta || { currentPage: 1, totalPages: 1 });
            currentPage = result.meta.currentPage; 
            totalPages = result.meta.totalPages;   
        } catch (error) {
            displayError(`Impossible de charger les livres. ${error.message}`);
            renderBookList([]); 
            renderPagination({ currentPage: 1, totalPages: 1 }); 
        } finally {
            hideLoading();
        }
    };

    /** Fetches categories for dropdowns */
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categories = await response.json();
            populateCategoryDropdowns(categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
            
            displayError(`Impossible de charger les catégories. ${error.message}`);
        }
    };

    /** Adds a new book */
    const addBook = async (bookData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            hideModal();
            fetchBooks(1); 
        } catch (error) {
            displayError(`Erreur lors de l'ajout: ${error.message}`, formErrorDiv);
        }
    };

    /** Updates an existing book */
    const updateBook = async (bookId, bookData) => {
         try {
            const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            hideModal();
            fetchBooks(currentPage); 
        } catch (error) {
             displayError(`Erreur lors de la mise à jour: ${error.message}`, formErrorDiv);
        }
    };

     /** Deletes a book */
    const deleteBook = async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok && response.status !== 204) {
                 const errorData = await response.json().catch(() => ({})); 
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
             
             
             const booksOnCurrentPage = bookListBody.querySelectorAll('tr').length;
             let pageToFetch = currentPage;
             if (booksOnCurrentPage <= 1 && currentPage > 1) {
                 pageToFetch = currentPage - 1;
             }
             fetchBooks(pageToFetch); 
        } catch (error) {
            displayError(`Erreur lors de la suppression: ${error.message}`);
        }
    };


    

    /** Renders the list of books in the table */
    const renderBookList = (books) => {
        if (!bookListBody) return;
        bookListBody.innerHTML = ''; 

        if (!books || books.length === 0) {
            const row = bookListBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; 
            cell.textContent = 'Aucun livre trouvé.';
            cell.style.textAlign = 'center';
            return;
        }

        books.forEach(book => {
            const row = bookListBody.insertRow();

            
            const titleCell = row.insertCell();
            titleCell.textContent = book.title;
            titleCell.setAttribute('data-label', 'Titre');

            const authorCell = row.insertCell();
            authorCell.textContent = book.author || '-';
            authorCell.setAttribute('data-label', 'Auteur');

            const categoryCell = row.insertCell();
            categoryCell.textContent = book.category_name || 'N/A'; 
            categoryCell.setAttribute('data-label', 'Catégorie');

            const statusCell = row.insertCell();
            statusCell.textContent = book.read_status || 'N/A';
            statusCell.setAttribute('data-label', 'Statut');
            
             statusCell.classList.add(`status-${book.read_status?.replace(' ', '-') || 'na'}`);

            
            const actionsCell = row.insertCell();
            actionsCell.className = 'action-buttons';
            actionsCell.setAttribute('data-label', 'Actions'); 

            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Modifier';
            editBtn.className = 'edit-btn btn-sm'; 
            editBtn.dataset.id = book.book_id;
            editBtn.addEventListener('click', handleEditClick);
            actionsCell.appendChild(editBtn);

            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.className = 'delete-btn btn-sm';
            deleteBtn.dataset.id = book.book_id;
            deleteBtn.addEventListener('click', handleDeleteClick);
            actionsCell.appendChild(deleteBtn);
        });
    };

    /** Updates pagination controls */
    const renderPagination = (meta) => {
         if (!meta || !pageInfoSpan || !prevPageBtn || !nextPageBtn) return;

        pageInfoSpan.textContent = `Page ${meta.currentPage} sur ${meta.totalPages}`;
        prevPageBtn.disabled = meta.currentPage <= 1;
        nextPageBtn.disabled = meta.currentPage >= meta.totalPages;

        
         prevPageBtn.dataset.page = meta.currentPage - 1;
         nextPageBtn.dataset.page = meta.currentPage + 1;
    };

     /** Populates category dropdowns */
     const populateCategoryDropdowns = (categories) => {
         if (!categories || !categoryFilterSelect || !modalCategorySelect) return;

         
         categoryFilterSelect.length = 1; 
         modalCategorySelect.length = 1; 

         categories.forEach(cat => {
             const optionFilter = new Option(cat.name, cat.category_id);
             const optionModal = new Option(cat.name, cat.category_id);
             categoryFilterSelect.add(optionFilter);
             modalCategorySelect.add(optionModal);
         });
     };

    
    const showModal = (isEdit = false, book = null) => {
        if (!bookModal || !bookForm || !modalTitle) return;
        bookForm.reset(); 
        clearError(formErrorDiv); 
        bookIdInput.value = ''; 

        if (isEdit && book) {
            modalTitle.textContent = 'Modifier le Livre';
            
            bookIdInput.value = book.book_id;
            document.getElementById('title').value = book.title || '';
            document.getElementById('author').value = book.author || '';
            document.getElementById('isbn').value = book.isbn || '';
            document.getElementById('description').value = book.description || '';
            document.getElementById('category').value = book.category_id || '';
            document.getElementById('read_status').value = book.read_status || 'à lire';
        } else {
            modalTitle.textContent = 'Ajouter un Livre';
        }
        bookModal.classList.add('show'); 
        bookModal.style.display = 'flex';
    };

    const hideModal = () => {
        if (!bookModal) return;
        bookModal.classList.remove('show');
        
        
        bookModal.style.display = 'none'; 
    };

    

    /** Handles click on Edit button */
    const handleEditClick = async (event) => {
        const bookId = event.target.dataset.id;
        if (!bookId) return;

        
        try {
            const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const book = await response.json();
            showModal(true, book);
        } catch (error) {
            displayError(`Impossible de charger les détails du livre: ${error.message}`);
        }
    };

    /** Handles click on Delete button */
    const handleDeleteClick = (event) => {
        const bookId = event.target.dataset.id;
        if (!bookId) return;

        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.')) {
            deleteBook(bookId);
        }
    };

    /** Handles form submission for add/edit */
    const handleFormSubmit = (event) => {
        event.preventDefault(); 
        clearError(formErrorDiv); 

        const bookId = bookIdInput.value;
        const bookData = {
            title: document.getElementById('title').value.trim(),
            author: document.getElementById('author').value.trim(),
            isbn: document.getElementById('isbn').value.trim(),
            description: document.getElementById('description').value.trim(),
            
            category_id: document.getElementById('category').value ? parseInt(document.getElementById('category').value) : null,
            read_status: document.getElementById('read_status').value,
        };

         
        if (!bookData.title) {
            displayError("Le titre est obligatoire.", formErrorDiv);
            return;
        }

        if (bookId) {
            
            updateBook(bookId, bookData);
        } else {
            
            addBook(bookData);
        }
    };

     /** Handles filter/sort application */
     const handleApplyFilters = () => {
         currentFilters.search = searchInput.value.trim();
         currentFilters.category = categoryFilterSelect.value;
         currentFilters.status = statusFilterSelect.value;
         currentFilters.sort = sortFilterSelect.value;
         fetchBooks(1, currentFilters); 
     };


    

    
    fetchCategories(); 
    fetchBooks(currentPage, currentFilters); 

    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
             if (currentPage > 1) fetchBooks(currentPage - 1, currentFilters);
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
             if (currentPage < totalPages) fetchBooks(currentPage + 1, currentFilters);
        });
    }

    if (addBookBtn) addBookBtn.addEventListener('click', () => showModal(false));
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (bookModal) { 
        bookModal.addEventListener('click', (event) => {
            if (event.target === bookModal) {
                hideModal();
            }
        });
    }
    if (bookForm) bookForm.addEventListener('submit', handleFormSubmit);

    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', handleApplyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                 event.preventDefault(); 
                handleApplyFilters();
            }
        });
    }

}); 