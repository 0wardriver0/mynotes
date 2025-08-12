// Wait for DOM ready
window.addEventListener('DOMContentLoaded', () => {

    class NotesApp {
        constructor() {
            this.notes = [];
            this.currentPage = 1;
            this.notesPerPage = 6;
            this.searchQuery = '';

            this.cacheElements();
            this.attachEvents();
            // Load notes from a file or localStorage
            this.loadNotesFromDB();
            this.renderNotes();
        }

        cacheElements() {
            this.notesGrid = document.getElementById('notesGrid');
            this.pagination = document.getElementById('pagination');
            this.addBtn = document.getElementById('addNoteBtn');
            this.exportBtn = document.getElementById('exportBtn');
            this.importBtn = document.getElementById('importBtn');
            this.importFile = document.getElementById('importFile');
            this.searchInput = document.getElementById('searchInput');
            this.noteModal = document.getElementById('noteModal');
            this.modalClose = document.getElementById('noteModalClose');
            this.noteForm = document.getElementById('noteForm');
            this.cancelBtn = document.getElementById('cancelBtn');
            this.modalTitle = document.getElementById('modalTitle');
            this.noteTitle = document.getElementById('noteTitle');
            this.noteContent = document.getElementById('noteContent');
            this.imageInput = document.getElementById('imageInput');
            this.imageModal = document.getElementById('imageModal');
            this.imageModalClose = document.getElementById('imageModalClose');
            this.modalImage = document.getElementById('modalImage');
        }

        attachEvents() {
            // Updated event listeners
            this.addBtn.addEventListener('click', () => this.openAddModal());
            this.modalClose.addEventListener('click', () => this.closeModal());
            this.cancelBtn.addEventListener('click', () => this.closeModal());
            this.noteForm.addEventListener('submit', (e) => this.handleSubmit(e));

            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.currentPage = 1;
                this.renderNotes();
            });

            this.exportBtn.addEventListener('click', () => this.exportNotes());
            this.importBtn.addEventListener('click', () => this.importFile.click());
            this.importFile.addEventListener('change', (e) => this.importNotes(e));

            this.imageModalClose.addEventListener('click', () => this.closeImageModal());
            window.addEventListener('click', (e) => {
                if (e.target === this.noteModal) this.closeModal();
                if (e.target === this.imageModal) this.closeImageModal();
            });

            this.notesGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-edit')) this.openEditModal(e.target.dataset.id);
                if (e.target.classList.contains('btn-delete')) this.deleteNote(e.target.dataset.id);
                if (e.target.classList.contains('note-image')) this.openImageModal(e.target.src);
            });

            this.pagination.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
                    this.currentPage = Number(e.target.textContent) || this.currentPage;
                    if (e.target.textContent === 'Prev') this.currentPage--;
                    if (e.target.textContent === 'Next') this.currentPage++;
                    this.renderNotes();
                }
            });
        }
        
        // This function will fetch data from your 'database.db' if it's a static file
        async loadNotesFromDB() {
            try {
                // If you can't access 'database.db' directly, you will need a backend server
                // to serve this file. For a simple client-side app, we'll assume it's
                // a JSON file and load it.
                // It's more likely that a local database like IndexedDB or localStorage is
                // a better approach for a client-side app.
                // Assuming 'database.db' is a misnomer for a JSON file containing notes
                // and is located in the same directory.
                const response = await fetch('database.db');
                if (!response.ok) {
                    throw new Error('Failed to load notes from database.db. Falling back to localStorage.');
                }
                const savedNotes = await response.json();
                this.notes = Array.isArray(savedNotes) ? savedNotes : [];
                this.renderNotes();
            } catch (error) {
                console.error(error);
                // Fallback to localStorage if the file doesn't exist or can't be fetched.
                this.loadNotes();
                this.renderNotes();
            }
        }

        loadNotes() {
            const saved = localStorage.getItem('notes');
            this.notes = saved ? JSON.parse(saved) : [];
        }

        saveNotes() {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        }

        openAddModal() {
            this.editingId = null;
            this.modalTitle.textContent = 'Add New Note';
            this.noteTitle.value = '';
            this.noteContent.value = '';
            this.imageInput.value = '';
            this.noteModal.style.display = 'flex';
        }

        openEditModal(id) {
            const note = this.notes.find(n => n.id == id);
            if (!note) return;
            this.editingId = id;
            this.modalTitle.textContent = 'Edit Note';
            this.noteTitle.value = note.title;
            this.noteContent.value = note.content;
            this.imageInput.value = ''; // Clear image input for new upload
            this.noteModal.style.display = 'flex';
        }

        closeModal() {
            this.noteModal.style.display = 'none';
            this.editingId = null;
        }

        async handleSubmit(e) {
            e.preventDefault();
            const title = this.noteTitle.value.trim();
            const content = this.noteContent.value.trim();

            if (!title && !content) {
                alert('Please enter a title or content for the note.');
                return;
            }

            let image = null;
            if (this.imageInput.files && this.imageInput.files[0]) {
                image = await this.readFileAsDataURL(this.imageInput.files[0]);
            }

            if (this.editingId) {
                const noteIndex = this.notes.findIndex(n => n.id == this.editingId);
                if (noteIndex !== -1) {
                    const note = this.notes[noteIndex];
                    note.title = title;
                    note.content = content;
                    if (image) note.image = image;
                    note.updatedAt = new Date().toISOString();
                }
            } else {
                this.notes.push({
                    id: Date.now(),
                    title,
                    content,
                    image,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            this.saveNotes();
            this.closeModal();
            this.renderNotes();
        }

        readFileAsDataURL(file) {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        deleteNote(id) {
            if (confirm('Are you sure you want to delete this note?')) {
                this.notes = this.notes.filter(n => n.id != id);
                this.saveNotes();
                this.renderNotes();
            }
        }

        exportNotes() {
            const data = JSON.stringify(this.notes, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notes.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        importNotes(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Array.isArray(data)) {
                        this.notes = data;
                        this.saveNotes();
                        this.renderNotes();
                        alert('Notes imported successfully!');
                    } else {
                        alert('Invalid JSON file format. Please import a file containing an array of notes.');
                    }
                } catch (error) {
                    alert('Invalid JSON file.');
                    console.error('Error importing notes:', error);
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset file input
        }

        openImageModal(src) {
            this.modalImage.src = src;
            this.imageModal.style.display = 'flex';
        }

        closeImageModal() {
            this.imageModal.style.display = 'none';
            this.modalImage.src = '';
        }

        renderNotes() {
            const filtered = this.notes.filter(n =>
                (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
                (n.content && n.content.toLowerCase().includes(this.searchQuery))
            );

            const totalPages = Math.ceil(filtered.length / this.notesPerPage) || 1;
            this.currentPage = Math.min(this.currentPage, totalPages);

            const start = (this.currentPage - 1) * this.notesPerPage;
            const pageNotes = filtered.slice(start, start + this.notesPerPage);

            this.notesGrid.innerHTML = pageNotes.map(n => this.noteToHTML(n)).join('') ||
                '<div class="empty-state"><p>No notes found. Click "Add New Note" to get started! 📝</p></div>';

            this.renderPagination(filtered.length, totalPages);
        }

        noteToHTML(n) {
            return `
                <div class="note-card">
                    <div class="note-header">
                        <h3 class="note-title">${this.escapeHtml(n.title || 'Untitled')}</h3>
                        <span class="note-date">${this.formatDate(n.updatedAt)}</span>
                    </div>
                    ${n.image ? `<img class="note-image" src="${n.image}" alt="Note Image">` : ''}
                    <div class="note-content">${this.escapeHtml(n.content || '')}</div>
                    <div class="note-actions">
                        <button class="btn btn-edit" data-id="${n.id}">Edit</button>
                        <button class="btn btn-delete" data-id="${n.id}">Delete</button>
                    </div>
                </div>`;
        }

        renderPagination(totalNotes, totalPages) {
            this.pagination.innerHTML = '';
            if (totalPages < 2) return;

            // 'Previous' button
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Prev';
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.addEventListener('click', () => {
                this.currentPage--;
                this.renderNotes();
            });
            this.pagination.appendChild(prevBtn);

            // Page number buttons
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.disabled = (i === this.currentPage);
                btn.className = (i === this.currentPage) ? 'active' : '';
                btn.addEventListener('click', () => {
                    this.currentPage = i;
                    this.renderNotes();
                });
                this.pagination.appendChild(btn);
            }

            // 'Next' button
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.disabled = this.currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                this.currentPage++;
                this.renderNotes();
            });
            this.pagination.appendChild(nextBtn);
        }

        escapeHtml(t) {
            const d = document.createElement('div');
            d.textContent = t;
            return d.innerHTML;
        }

        formatDate(ds) {
            const d = new Date(ds);
            return d.toLocaleDateString();
        }
    }

    window.notesApp = new NotesApp();
});
