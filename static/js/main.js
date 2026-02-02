document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const camera = document.getElementById('camera');
    const previewArea = document.getElementById('previewArea');
    const previewImage = document.getElementById('previewImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const loadingState = document.getElementById('loadingState');
    const resultsArea = document.getElementById('resultsArea');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    
    // Global variable to store the base64 image
    let currentImageData = null;
    let stream = null;

    // --- Event Listeners ---

    // 1. File Upload Handling
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                showPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // 2. Camera Handling
    cameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            camera.srcObject = stream;
            camera.hidden = false;
            captureBtn.hidden = false;
            uploadArea.querySelector('.upload-buttons').hidden = true;
        } catch (err) {
            alert("Could not access camera. Please upload a file instead.");
        }
    });

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        canvas.getContext('2d').drawImage(camera, 0, 0);
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop());
        camera.hidden = true;
        captureBtn.hidden = true;
        uploadArea.querySelector('.upload-buttons').hidden = false;

        showPreview(canvas.toDataURL('image/jpeg'));
    });

    // 3. UI Navigation
    cancelBtn.addEventListener('click', resetUI);
    newAnalysisBtn.addEventListener('click', resetUI);

    // 4. Analyze Logic
    analyzeBtn.addEventListener('click', async () => {
        if (!currentImageData) return;

        // UI Updates
        previewArea.hidden = true;
        loadingState.hidden = false;

        try {
            const response = await fetch('/api/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: currentImageData })
            });

            const data = await response.json();

            if (data.success) {
                displayResults(data);
            } else {
                alert('Error: ' + data.error);
                resetUI();
            }
        } catch (error) {
            console.error(error);
            alert('Network error. Please try again.');
            resetUI();
        }
    });

    // --- Helper Functions ---

    function showPreview(imageData) {
        currentImageData = imageData;
        previewImage.src = imageData;
        uploadArea.hidden = true;
        previewArea.hidden = false;
    }

    function resetUI() {
        currentImageData = null;
        fileInput.value = '';
        uploadArea.hidden = false;
        previewArea.hidden = true;
        loadingState.hidden = true;
        resultsArea.hidden = true;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        camera.hidden = true;
        captureBtn.hidden = true;
        uploadArea.querySelector('.upload-buttons').hidden = false;
    }

    function displayResults(data) {
        loadingState.hidden = true;
        resultsArea.hidden = false;

        // 1. Basic Info
        document.getElementById('animalType').textContent = capitalize(data.animal);
        document.getElementById('animalConfidence').textContent = (data.confidence * 100).toFixed(1) + '%';
        document.getElementById('breedType').textContent = data.breed;
        document.getElementById('breedConfidence').textContent = (data.breed_confidence * 100).toFixed(1) + '%';

        // 2. Pass breed to chatbot global var (if chatbot.js exists)
        if (window.detectedBreed) window.detectedBreed = `${data.breed} (${data.animal})`;

        // 3. AI Generated Info
        const info = data.info;
        document.getElementById('origin').textContent = info.origin;
        document.getElementById('priceRange').textContent = info.price_range;
        document.getElementById('description').textContent = info.description;

        // 4. Populate Lists
        fillList('vaccinations', info.vaccinations);
        fillList('careTips', info.care_tips);
        
        // Note: Your HTML didn't have specific IDs for Special Food, but you can add them similarly
    }

    function fillList(elementId, items) {
        const list = document.getElementById(elementId);
        list.innerHTML = ''; // Clear previous
        if (items && items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});