document.addEventListener('DOMContentLoaded', () => {
    // Helper to activate dashboard layout
    const activateAdminDashboard = () => {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('manageSection').style.display = 'block';
        document.querySelector('.admin-container').classList.add('wide');
        loadGallery();
    };

    // Helper to show login screen
    const showLoginSection = () => {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'none';
        document.querySelector('.admin-container').classList.remove('wide');
    };

    // Check Supabase session on load
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            activateAdminDashboard();
        } else {
            showLoginSection();
        }
    });

    // Handle Auth State Changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            activateAdminDashboard();
        } else {
            showLoginSection();
        }
    });

    // Handle Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const msg = document.getElementById('loginMsg');
        
        // Authenticate with Supabase Auth using a hidden standard email and entered password
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: 'admin@randijewellers.com',
            password: password
        });

        if (error) {
            msg.textContent = 'Login failed: ' + error.message;
            msg.style.display = 'block';
        } else {
            msg.style.display = 'none';
            activateAdminDashboard();
        }
    });

    // Handle Upload
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('imageFile');
        const category = document.getElementById('category').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const isFeatured = document.getElementById('isFeatured').checked;
        const msg = document.getElementById('uploadMsg');

        if (fileInput.files.length === 0) return;

        msg.className = 'message';
        msg.textContent = 'Uploading to cloud...';
        msg.style.display = 'block';

        try {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;

            // 1. Upload file to Supabase Storage Bucket 'gallery'
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('gallery')
                .upload(fileName, file);

            if (uploadError) throw new Error('File upload to storage failed: ' + uploadError.message);

            // 2. Get Public URL of the uploaded image
            const { data: { publicUrl } } = supabaseClient.storage
                .from('gallery')
                .getPublicUrl(fileName);

            // 3. Insert metadata row into Supabase 'images' database table
            const { error: dbError } = await supabaseClient
                .from('images')
                .insert([{
                    url: publicUrl,
                    category: category,
                    title: title || '',
                    description: description || '',
                    isfeatured: isFeatured
                }]);

            if (dbError) throw new Error('Database registry failed: ' + dbError.message);

            msg.className = 'message success';
            msg.textContent = 'Image uploaded successfully!';
            document.getElementById('uploadForm').reset();
            loadGallery(); // Refresh the list
        } catch (err) {
            console.error(err);
            msg.className = 'message error';
            msg.textContent = err.message || 'Upload failed.';
        }
    });

    // Load Existing Gallery List from Supabase Table
    const loadGallery = async () => {
        const grid = document.getElementById('manageGrid');
        if (!grid) return;

        const { data: images, error } = await supabaseClient
            .from('images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to load gallery for management:', error);
            grid.innerHTML = '<p style="color: #666; font-style: italic; grid-column: 1 / -1;">Failed to load items from database.</p>';
            return;
        }

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
                    <div class="img-category">${img.category} Works ${img.isfeatured ? '⭐' : ''}</div>
                </div>
                <button class="btn-delete" data-id="${img.id}" data-url="${img.url}">Delete</button>
            `;
            grid.appendChild(item);
        });

        // Bind delete event listeners
        grid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const url = e.target.getAttribute('data-url');
                if (confirm('Are you sure you want to delete this image?')) {
                    deleteImage(id, url);
                }
            });
        });
    };

    // Delete Image Handler (Purges from bucket and deletes table metadata row)
    const deleteImage = async (id, url) => {
        try {
            // 1. Delete image from Storage bucket
            if (url.includes('/storage/v1/object/public/gallery/')) {
                const fileName = url.split('/').pop();
                const { error: storageError } = await supabaseClient.storage
                    .from('gallery')
                    .remove([fileName]);
                if (storageError) {
                    console.error('Failed to delete file from storage:', storageError);
                }
            }

            // 2. Delete metadata row from Database Table
            const { error: dbError } = await supabaseClient
                .from('images')
                .delete()
                .eq('id', id);

            if (dbError) throw new Error('Database removal failed: ' + dbError.message);

            loadGallery(); // Refresh the list
        } catch (err) {
            console.error('Delete error:', err);
            alert('Delete failed: ' + err.message);
        }
    };

    // Invalidate Login when clicking "Back to Site"
    const backToSiteBtn = document.getElementById('backToSiteBtn');
    if (backToSiteBtn) {
        backToSiteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
                window.location.href = './'; // Go to homepage
            } catch (err) {
                console.error('Logout failed:', err);
                window.location.href = './'; // Fallback redirect anyway
            }
        });
    }
});
