const DB_CONFIG = {
    name: 'NexLibDB',
    version: 1,
    storeName: 'state'
};

const db = {
    open: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
                    db.createObjectStore(DB_CONFIG.storeName);
                }
            };

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    get: async (key) => {
        const database = await db.open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(DB_CONFIG.storeName, 'readonly');
            const store = transaction.objectStore(DB_CONFIG.storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    put: async (key, value) => {
        const database = await db.open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(DB_CONFIG.storeName, 'readwrite');
            const store = transaction.objectStore(DB_CONFIG.storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // --- CONSTANTS ---
    const STORAGE_KEYS = {
        THEME: 'theme',
        BOOKS: 'nexlib_books',
        USERS: 'nexlib_users',
        ADMIN: 'nexlib_admin'
    };

    // --- DEFAULT DATA ---
    const DEFAULT_BOOKS = [
        { title: "Harry Potter", author: "J.K. Rowling", genre: "Fantasy", rating: 5, cover: "https://covers.openlibrary.org/b/id/10521270-L.jpg", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { title: "X-MEN", author: "Stan Lee", genre: "Sci-Fi", rating: 4.5, cover: "https://covers.openlibrary.org/b/id/12628969-L.jpg", pdf: "https://www.africau.edu/images/default/sample.pdf" },
        { title: "Wuthering Heights", author: "Emily Bronte", genre: "Romance", rating: 4, cover: "https://covers.openlibrary.org/b/id/12548118-L.jpg", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { title: "Catch-22", author: "Joseph Heller", genre: "Satire", rating: 4.5, cover: "https://covers.openlibrary.org/b/id/12628134-L.jpg", pdf: "https://www.africau.edu/images/default/sample.pdf" },
        { title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", rating: 5, cover: "https://covers.openlibrary.org/b/id/12138135-L.jpg", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
    ];

    const DEFAULT_USERS = [
        { name: "Alice Johnson", role: "Member", date: "10/12/2025", status: "Active", img: "https://randomuser.me/api/portraits/women/11.jpg" },
        { name: "Bob Smith", role: "Editor", date: "05/11/2025", status: "Active", img: "https://randomuser.me/api/portraits/men/11.jpg" },
        { name: "Emma Watson", role: "Editor", date: "14/12/2025", status: "Active", img: "https://randomuser.me/api/portraits/women/35.jpg" },
        { name: "David Lee", role: "Guest", date: "12/12/2025", status: "Pending", badge: "warning", img: "https://randomuser.me/api/portraits/men/32.jpg" },
        { name: "Sarah Connor", role: "Member", date: "01/11/2025", status: "Active", img: "https://randomuser.me/api/portraits/women/65.jpg" },
        { name: "Michael Chen", role: "Editor", date: "25/11/2025", status: "Inactive", badge: "inactive", img: "https://randomuser.me/api/portraits/men/85.jpg" },
        { name: "Jessica Pearson", role: "Guest", date: "05/12/2025", status: "Active", img: "https://randomuser.me/api/portraits/women/44.jpg" }
    ];

    const DEFAULT_ADMIN = {
        username: "Chandrachur",
        fullname: "Chandrachur Mukherjee",
        email: "chandramukh07@gmail.com",
        role: "Super Admin",
        contact: "8540031257",
        img: "admin_profile_pic.jpg",
        password: "password123"
    };

    // --- STATE MANAGEMENT (Async Init) ---
    let booksData = [];
    let usersData = [];
    let adminData = {};

    try {
        // Try initialize from IDB
        booksData = await db.get(STORAGE_KEYS.BOOKS);
        usersData = await db.get(STORAGE_KEYS.USERS);
        adminData = await db.get(STORAGE_KEYS.ADMIN);

        // Fallback: Check LocalStorage (Migration logic)
        if (!booksData) {
            const lsBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
            if (lsBooks) {
                try {
                    booksData = JSON.parse(lsBooks);
                } catch (e) { booksData = DEFAULT_BOOKS; }
                await db.put(STORAGE_KEYS.BOOKS, booksData);
            } else {
                booksData = DEFAULT_BOOKS;
                await db.put(STORAGE_KEYS.BOOKS, booksData);
            }
        }

        if (!usersData) {
            const lsUsers = localStorage.getItem(STORAGE_KEYS.USERS);
            if (lsUsers) {
                try {
                    usersData = JSON.parse(lsUsers);
                } catch (e) { usersData = DEFAULT_USERS; }
                await db.put(STORAGE_KEYS.USERS, usersData);
            } else {
                usersData = DEFAULT_USERS;
                await db.put(STORAGE_KEYS.USERS, usersData);
            }
        }

        if (!adminData) {
            const lsAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN);
            if (lsAdmin) {
                try {
                    adminData = JSON.parse(lsAdmin);
                } catch (e) { adminData = DEFAULT_ADMIN; }
                await db.put(STORAGE_KEYS.ADMIN, adminData);
            } else {
                adminData = DEFAULT_ADMIN;
                await db.put(STORAGE_KEYS.ADMIN, adminData);
            }
        }

    } catch (err) {
        console.error("DB Error:", err);
        // Emergency Fallback
        booksData = DEFAULT_BOOKS;
        usersData = DEFAULT_USERS;
        adminData = DEFAULT_ADMIN;
    }

    // --- CLEANUP: Remove Specific Users (Requested) ---
    if (usersData && usersData.length > 0) {
        const usersToRemove = ["Bapan", "Anuran"];
        const originalLen = usersData.length;
        usersData = usersData.filter(u => !usersToRemove.includes(u.name));

        if (usersData.length !== originalLen) {
            await db.put(STORAGE_KEYS.USERS, usersData);
            console.log("Removed users: Bapan, Anuran");
        }
    }

    // Helper: Save State (Async)
    const saveBooks = async () => await db.put(STORAGE_KEYS.BOOKS, booksData);
    const saveUsers = async () => await db.put(STORAGE_KEYS.USERS, usersData);
    const saveAdmin = async () => await db.put(STORAGE_KEYS.ADMIN, adminData);


    // --- 1. UI RENDERERS ---

    // Render Books
    const homeBookGrid = document.getElementById('home-book-grid');
    const libraryBookGrid = document.getElementById('library-book-grid');

    const getStarsHTML = (rating) => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) stars += '<i class="fa-solid fa-star"></i>';
            else if (i === Math.ceil(rating) && !Number.isInteger(rating)) stars += '<i class="fa-regular fa-star-half-stroke"></i>';
            else stars += '<i class="fa-regular fa-star"></i>';
        }
        return stars;
    };

    const createBookCard = (book) => {
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.setAttribute('data-author', book.author);
        card.setAttribute('data-rating', book.rating);
        if (book.pdf) card.setAttribute('data-pdf', book.pdf);
        if (book.genre) {
            // Store genre in a clean way for filtering
            const genreSpan = document.createElement('span');
        }

        card.innerHTML = `
            <div class="book-cover ${book.pdf ? 'has-pdf' : ''}" style="background-image: url('${book.cover}');"></div>
            <div class="book-details">
                <h4>${book.title}</h4>
                <p class="book-author">by ${book.author}</p>
                <p class="book-genre">${book.genre}</p>
                <div class="book-rating">
                    <span class="stars">${getStarsHTML(book.rating)}</span>
                    <span class="rating-value">(${book.rating})</span>
                </div>
                <div class="book-actions">
                    <button class="btn-sm btn-edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-sm btn-delete"><i class="fa-solid fa-trash"></i></button>
                    ${book.pdf ? '<button class="btn-sm btn-download" title="Download PDF"><i class="fa-solid fa-download"></i></button>' : ''}
                </div>
            </div>
        `;
        return card;
    };

    const renderBooks = () => {
        if (homeBookGrid) homeBookGrid.innerHTML = '';
        if (libraryBookGrid) libraryBookGrid.innerHTML = '';

        booksData.forEach(book => {
            if (homeBookGrid) homeBookGrid.appendChild(createBookCard(book));
            if (libraryBookGrid) libraryBookGrid.appendChild(createBookCard(book));
        });
    };

    // Render Users
    const usersTableBody = document.getElementById('users-table-body');
    const renderUsers = () => {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '';
        usersData.forEach(user => {
            const tr = document.createElement('tr');
            const statusClass = user.badge || 'active';
            const statusBadge = user.status === 'Pending' ? 'warning' : (user.status === 'Inactive' ? 'inactive' : 'active');

            tr.innerHTML = `
                <td>
                    <div class="user-profile-cell">
                        <img src="${user.img}" alt="${user.name}">
                    </div>
                </td>
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${user.date}</td>
                <td><span class="badge ${statusBadge}">${user.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-sm btn-edit-user"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-sm btn-delete-user"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });
    };

    // Render Admin
    const renderAdmin = () => {
        // Form Inputs
        const inputs = {
            'admin-username': adminData.username,
            'admin-fullname': adminData.fullname,
            'admin-email': adminData.email,
            'admin-contact': adminData.contact,
            'admin-role': adminData.role,
            'admin-password': adminData.password || "password123"
        };

        for (const [id, val] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }

        // Sidebar & Profile Images
        const profilePic = document.getElementById('admin-profile-pic');
        const sidebarPic = document.querySelector('.user-mini-profile img');
        const sidebarName = document.querySelector('.user-mini-profile h4');
        const sidebarRole = document.querySelector('.user-mini-profile p');

        if (profilePic) profilePic.src = adminData.img;
        if (sidebarPic) sidebarPic.src = adminData.img;
        if (sidebarName) sidebarName.textContent = adminData.username;
        if (sidebarRole) sidebarRole.textContent = adminData.role;
    };

    // --- INITIAL RENDER ---
    renderBooks();
    renderUsers();
    renderAdmin();


    // --- 2. EVENT LISTENERS ---

    // Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    const titles = {
        'home': 'Dashboard',
        'library': 'Library Management',
        'users': 'User Management',
        'admin': 'System Administration',
        'help': 'Help & Support',
        'account': 'My Account'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            const li = e.target.closest('li');
            li.classList.add('active');

            const targetId = li.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            pageTitle.textContent = titles[targetId] || 'Dashboard';
        });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn.querySelector('i');
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fa-solid fa-sun';
    }

    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem(STORAGE_KEYS.THEME, 'light');
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
            themeIcon.className = 'fa-solid fa-sun';
        }
    });

    // --- User Management Events ---
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const closeUserModal = document.querySelector('.close-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    let editingUserIndex = -1; // Track which user is being edited

    const openUserModal = () => {
        addUserForm.reset();
        editingUserIndex = -1;
        document.querySelector('#add-user-modal h3').innerText = "Add New User";
        document.querySelector('#add-user-form button').innerText = "Add User";
        addUserModal.style.display = 'block';
    };

    if (addUserBtn) addUserBtn.addEventListener('click', openUserModal);
    if (closeUserModal) closeUserModal.addEventListener('click', () => addUserModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target == addUserModal) addUserModal.style.display = 'none'; });

    // Delegated Events for Edit/Delete
    const usersTable = document.getElementById('users-table-body');
    if (usersTable) {
        usersTable.addEventListener('click', (e) => {
            // Delete User
            if (e.target.closest('.btn-delete-user')) {
                if (confirm('Are you sure you want to remove this user?')) {
                    const row = e.target.closest('tr');
                    const userName = row.querySelector('td:nth-child(2)').innerText;

                    usersData = usersData.filter(u => u.name !== userName);
                    saveUsers();
                    renderUsers();
                }
            }

            // Edit User
            if (e.target.closest('.btn-edit-user')) {
                const row = e.target.closest('tr');
                const userName = row.querySelector('td:nth-child(2)').innerText;
                const userIndex = usersData.findIndex(u => u.name === userName);

                if (userIndex !== -1) {
                    const user = usersData[userIndex];
                    editingUserIndex = userIndex;

                    // Populate Form
                    document.getElementById('new-user-name').value = user.name;
                    document.getElementById('new-user-role').value = user.role;

                    // Convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
                    const [d, m, y] = user.date.split('/');
                    const isoDate = `${y}-${m}-${d}`;
                    document.getElementById('new-user-date').value = isoDate;

                    // Update Modal Interface
                    document.querySelector('#add-user-modal h3').innerText = "Edit User Details";
                    document.querySelector('#add-user-form button').innerText = "Update User";
                    addUserModal.style.display = 'block';
                }
            }
        });
    }

    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const imageInput = document.getElementById('new-user-image');

            const processUserSave = (imgUrl) => {
                const name = document.getElementById('new-user-name').value;
                const role = document.getElementById('new-user-role').value;
                const dateRaw = document.getElementById('new-user-date').value;
                const dateFormatted = new Date(dateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

                if (editingUserIndex !== -1) {
                    // Update Existing
                    usersData[editingUserIndex].name = name;
                    usersData[editingUserIndex].role = role;
                    usersData[editingUserIndex].date = dateFormatted;
                    if (imgUrl) usersData[editingUserIndex].img = imgUrl; // Only update image if new one provided
                } else {
                    // Add New
                    if (!imgUrl) return alert("Please select a profile image.");
                    const newUser = {
                        name: name,
                        role: role,
                        date: dateFormatted,
                        status: 'Active',
                        img: imgUrl
                    };
                    usersData.push(newUser);
                }

                saveUsers();
                renderUsers();
                addUserModal.style.display = 'none';
            };

            if (imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (evt) => processUserSave(evt.target.result);
                reader.readAsDataURL(imageInput.files[0]);
            } else {
                // No new file selected
                if (editingUserIndex !== -1) {
                    // If editing, proceed without image update
                    processUserSave(null);
                } else {
                    alert("Please select a profile image.");
                }
            }
        });
    }

    // --- Book Management Events ---
    // (Consolidated logic for Add/Edit/Delete mapped to `booksData`)

    // Grid Listeners (Edit/Delete/View PDF)
    const handleGridAction = (e) => {
        // PDF View
        if (e.target.closest('.book-cover')) {
            const card = e.target.closest('.book-card');
            const pdf = card.getAttribute('data-pdf');
            if (pdf) {
                const win = window.open();
                win.document.write(`<iframe src="${pdf}" style="width:100%;height:100%;border:none;"></iframe>`);
            }
            return;
        }

        // Download PDF
        if (e.target.closest('.btn-download')) {
            const card = e.target.closest('.book-card');
            const pdf = card.getAttribute('data-pdf');
            const title = card.querySelector('h4').innerText;

            if (pdf) {
                const a = document.createElement('a');
                a.href = pdf;
                a.download = `${title}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            return;
        }

        // Delete
        if (e.target.closest('.btn-delete')) {
            if (confirm("Delete this book?")) {
                const card = e.target.closest('.book-card');
                const title = card.querySelector('h4').innerText;

                // Remove from array
                booksData = booksData.filter(b => b.title !== title);
                saveBooks();
                renderBooks();
            }
            return;
        }

        // Edit (Simplified: just refilling form, removing old, adding new on save)
        if (e.target.closest('.btn-edit')) {
            const card = e.target.closest('.book-card');
            const title = card.querySelector('h4').innerText;
            const book = booksData.find(b => b.title === title);

            if (book) {
                // Populate Form
                document.getElementById('new-book-title').value = book.title;
                document.getElementById('new-book-author').value = book.author;
                document.getElementById('new-book-genre').value = book.genre;
                document.getElementById('new-book-rating').value = book.rating;

                // Set a flag to remove old one on save
                addBookForm.setAttribute('data-editing', title);

                document.querySelector('#add-book-modal .modal-header h3').innerText = "Edit Book";
                document.querySelector('#add-book-form button').innerText = "Update Book";
                document.getElementById('add-book-modal').style.display = 'block';
            }
        }
    };

    if (homeBookGrid) homeBookGrid.addEventListener('click', handleGridAction);
    if (libraryBookGrid) libraryBookGrid.addEventListener('click', handleGridAction);

    // Book Form Submit
    const addBookModal = document.getElementById('add-book-modal');
    const addBookForm = document.getElementById('add-book-form');
    const addBookBtnHome = document.getElementById('home-add-book-btn');
    const addBookBtnLib = document.getElementById('library-add-book-btn');
    const closeBookModal = document.querySelector('#add-book-modal .close-modal');

    const openBookModal = () => {
        addBookForm.reset();
        addBookForm.removeAttribute('data-editing');
        document.querySelector('#add-book-modal .modal-header h3').innerText = "Add New Book";
        document.querySelector('#add-book-form button').innerText = "Add Book";
        addBookModal.style.display = 'block';
    };

    if (addBookBtnHome) addBookBtnHome.addEventListener('click', openBookModal);
    if (addBookBtnLib) addBookBtnLib.addEventListener('click', openBookModal);
    if (closeBookModal) closeBookModal.addEventListener('click', () => addBookModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target == addBookModal) addBookModal.style.display = 'none'; });

    if (addBookForm) {
        addBookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const imgInput = document.getElementById('new-book-image');
            const pdfInput = document.getElementById('new-book-pdf');
            const editingTitle = addBookForm.getAttribute('data-editing');

            const processBook = (imgUrl, pdfUrl) => {
                const newBook = {
                    title: document.getElementById('new-book-title').value,
                    author: document.getElementById('new-book-author').value,
                    genre: document.getElementById('new-book-genre').value,
                    rating: parseFloat(document.getElementById('new-book-rating').value),
                    cover: imgUrl,
                    pdf: pdfUrl
                };

                if (editingTitle) {
                    // Update: Remove old, add new (to keep simple)
                    const idx = booksData.findIndex(b => b.title === editingTitle);
                    if (idx !== -1) {
                        // Keep old image/pdf if not provided
                        if (!imgUrl) newBook.cover = booksData[idx].cover;
                        if (!pdfUrl) newBook.pdf = booksData[idx].pdf;
                        booksData[idx] = newBook;
                    }
                } else {
                    // Add
                    if (!imgUrl) return alert("Cover image required");
                    booksData.push(newBook);
                }

                saveBooks();
                renderBooks();
                addBookModal.style.display = 'none';
            };

            // Handling File Reads (Image & PDF)
            // Nested readers to handle both
            const readFiles = () => {
                let imgUrl = null;
                let pdfUrl = null;

                const nextStep = () => {
                    if (pdfInput.files[0]) {
                        const r2 = new FileReader();
                        r2.onload = (ev) => processBook(imgUrl, ev.target.result);
                        r2.readAsDataURL(pdfInput.files[0]);
                    } else {
                        processBook(imgUrl, null);
                    }
                };

                if (imgInput.files[0]) {
                    const r1 = new FileReader();
                    r1.onload = (ev) => {
                        imgUrl = ev.target.result;
                        nextStep();
                    };
                    r1.readAsDataURL(imgInput.files[0]);
                } else {
                    nextStep();
                }
            };

            readFiles();
        });
    }

    // --- Admin Profile Logic ---
    const adminUpload = document.getElementById('admin-profile-upload');
    const adminForm = document.getElementById('admin-profile-form');
    const adminOverlay = document.querySelector('.profile-overlay');

    if (adminOverlay && adminUpload) {
        adminOverlay.addEventListener('click', () => adminUpload.click());
        adminUpload.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const r = new FileReader();
                r.onload = (ev) => {
                    adminData.img = ev.target.result;
                    saveAdmin();
                    renderAdmin();
                };
                r.readAsDataURL(e.target.files[0]);
            }
        });
    }

    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            adminData.username = document.getElementById('admin-username').value;
            adminData.fullname = document.getElementById('admin-fullname').value;
            adminData.email = document.getElementById('admin-email').value;
            adminData.contact = document.getElementById('admin-contact').value;
            adminData.role = document.getElementById('admin-role').value;
            adminData.password = document.getElementById('admin-password').value;

            saveAdmin();
            renderAdmin();
            alert("Profile Updated Successfully!");
        });
    }

    // --- Search & Filter ---
    const searchInput = document.getElementById('library-search-input');
    const categorySelect = document.getElementById('category-filter');

    const filterBooks = () => {
        const q = searchInput ? searchInput.value.toLowerCase() : '';
        const cat = categorySelect ? categorySelect.value : 'All Categories';

        const cards = document.querySelectorAll('#library-book-grid .book-card');
        cards.forEach(card => {
            const title = card.querySelector('h4').innerText.toLowerCase();
            const genre = card.querySelector('.book-genre').innerText;
            const matchesSearch = title.includes(q);
            const matchesCat = cat === 'All Categories' || genre === cat;

            card.style.display = (matchesSearch && matchesCat) ? 'flex' : 'none';
        });
    };

    if (searchInput) searchInput.addEventListener('input', filterBooks);
    if (categorySelect) categorySelect.addEventListener('change', filterBooks);

    // --- Number Animation ---
    document.querySelectorAll('.stat-number').forEach(stat => {
        const final = parseInt(stat.innerText.replace(/,/g, ''));
        let start = 0;
        const step = Math.ceil(final / 50);
        if (!isNaN(final)) {
            const t = setInterval(() => {
                start += step;
                if (start >= final) {
                    stat.innerText = final.toLocaleString();
                    clearInterval(t);
                } else {
                    stat.innerText = start.toLocaleString();
                }
            }, 20);
        }
    });

    // --- Updates Feed (Simple DOM-based, not persisted requested but good to have) ---
    const postUpdBtn = document.getElementById('post-update-btn');
    if (postUpdBtn) {
        postUpdBtn.addEventListener('click', () => {
            const text = document.getElementById('new-update-text').value;
            if (text.trim()) {
                const div = document.createElement('div');
                div.className = 'update-card';
                div.innerHTML = `<div class="update-header"><span class="admin-badge">Admin</span><span class="update-time">Just now</span></div><p class="update-text">${text}</p>`;
                document.getElementById('updates-feed').prepend(div);
                document.getElementById('new-update-text').value = '';
            }
        });
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Optional: Clear session or show confirm
            if (confirm("Are you sure you want to logout?")) {
                window.location.href = 'login.html';
            }
        });
    }
});
