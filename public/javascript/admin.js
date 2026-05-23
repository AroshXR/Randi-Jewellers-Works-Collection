document.addEventListener('DOMContentLoaded', () => {
    // Helper to activate dashboard layout
    const activateAdminDashboard = () => {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('manageSection').style.display = 'block';
        document.querySelector('.admin-container').classList.add('wide');
        loadGallery();
    };

    // Check session on load
    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                activateAdminDashboard();
            }
        });

    // Handle Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                activateAdminDashboard();
            } else {
                const msg = document.getElementById('loginMsg');
                msg.textContent = data.message;
                msg.style.display = 'block';
            }
        });
    });

    // Handle Upload
    document.getElementById('uploadForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('imageFile');
        const category = document.getElementById('category').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const isFeatured = document.getElementById('isFeatured').checked;

        if (fileInput.files.length === 0) return;

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('category', category);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('isFeatured', isFeatured);

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            const msg = document.getElementById('uploadMsg');
            msg.style.display = 'block';
            if (data.success) {
                msg.className = 'message success';
                msg.textContent = 'Image uploaded successfully!';
                document.getElementById('uploadForm').reset();
                loadGallery(); // Refresh list on successful upload
            } else {
                msg.className = 'message error';
                msg.textContent = data.message || 'Upload failed.';
            }
        })
        .catch(err => {
            console.error(err);
            const msg = document.getElementById('uploadMsg');
            msg.className = 'message error';
            msg.textContent = 'Upload failed due to network error.';
            msg.style.display = 'block';
        });
    });

    // Load Existing Gallery List
    const loadGallery = () => {
        const grid = document.getElementById('manageGrid');
        if (!grid) return;

        fetch('/api/images')
            .then(res => res.json())
            .then(images => {
                grid.innerHTML = '';
                if (images.length === 0) {
                    grid.innerHTML = '<p style="color: #666; font-style: italic; grid-column: 1 / -1;">No images in gallery yet.</p>';
                    return;
                }

                images.forEach(img => {
                    const item = document.createElement('div');
                    item.className = 'manage-item';
                    item.innerHTML = `
                        <div>
                            <img src="${img.url}" alt="${img.title || 'Gallery Image'}">
                            <div class="img-info" title="${img.title || 'Untitled'}">${img.title || 'Untitled'}</div>
                            <div class="img-category">${img.category} Works ${img.isFeatured ? '⭐' : ''}</div>
                        </div>
                        <button class="btn-delete" data-id="${img.id}">Delete</button>
                    `;
                    grid.appendChild(item);
                });

                // Bind delete event listeners
                grid.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this image?')) {
                            deleteImage(id);
                        }
                    });
                });
            })
            .catch(err => console.error('Failed to load gallery for management:', err));
    };

    // Delete Image Handler
    const deleteImage = (id) => {
        fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadGallery(); // Refresh the list
            } else {
                alert('Failed to delete image: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Delete error:', err);
            alert('Delete failed due to network error.');
        });
    };
});
