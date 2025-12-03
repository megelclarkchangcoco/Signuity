// ===== STATE =====
let referenceFiles = [];
let questionedFile = null;

// ===== ELEMENTS =====
const referenceInput = document.getElementById('referenceInput');
const questionedInput = document.getElementById('questionedInput');
const referenceFileList = document.getElementById('referenceFileList');
const questionedFileList = document.getElementById('questionedFileList');
const referenceCount = document.getElementById('referenceCount');
const questionedCount = document.getElementById('questionedCount');

const referenceDropzone = document.getElementById('referenceDropzone');
const questionedDropzone = document.getElementById('questionedDropzone');
const referenceBrowseBtn = document.getElementById('referenceBrowseBtn');
const questionedBrowseBtn = document.getElementById('questionedBrowseBtn');

const warningModal = document.getElementById('warningModal');
const modalMessage = document.getElementById('modalMessage');
const modalTitle = document.getElementById('modalTitle');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const loadingOverlay = document.getElementById('loadingOverlay');
const verifyBtn = document.querySelector('.verify-btn');

// ===== HELPERS =====

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
    return `${value} ${sizes[i]}`;
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📄';
}

function isValidFile(file) {
    return (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'application/pdf'
    );
}

// Create file item DOM node
function createFileItem(file, index, isReference) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const thumb = document.createElement('div');
    thumb.className = 'file-thumbnail';

    if (file.type.startsWith('image/')) {
        // Actual image preview
        const img = document.createElement('img');
        img.className = 'file-image-preview';
        img.src = URL.createObjectURL(file);
        thumb.appendChild(img);
    } else {
        // Non-image (e.g. PDF) -> icon
        thumb.textContent = getFileIcon(file.type);
    }

    const info = document.createElement('div');
    info.className = 'file-info';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;

    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(file.size);

    info.appendChild(name);
    info.appendChild(size);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeFile(index, isReference));

    fileItem.appendChild(thumb);
    fileItem.appendChild(info);
    fileItem.appendChild(removeBtn);

    return fileItem;
}

// Update UI
function updateReferenceDisplay() {
    if (!referenceFileList) return;
    referenceFileList.innerHTML = '';
    referenceFiles.forEach((file, idx) => {
        referenceFileList.appendChild(createFileItem(file, idx, true));
    });
    if (referenceCount) {
        referenceCount.textContent = `Uploaded: ${referenceFiles.length}/6`;
    }
}

function updateQuestionedDisplay() {
    if (!questionedFileList) return;
    questionedFileList.innerHTML = '';
    if (questionedFile) {
        questionedFileList.appendChild(createFileItem(questionedFile, 0, false));
        if (questionedCount) questionedCount.textContent = 'Uploaded: 1/1';
    } else {
        if (questionedCount) questionedCount.textContent = 'Uploaded: 0/1';
    }
}

// Remove file
function removeFile(index, isReference) {
    if (isReference) {
        referenceFiles.splice(index, 1);
        updateReferenceDisplay();
    } else {
        questionedFile = null;
        updateQuestionedDisplay();
    }
}

// ===== MODAL (WARNING) =====

function showModal(message) {
    if (modalTitle) modalTitle.textContent = '';
    if (modalMessage) modalMessage.textContent = message;
    if (warningModal) warningModal.style.display = 'block';
}

function closeModal() {
    if (warningModal) warningModal.style.display = 'none';
}

if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (event) => {
    if (event.target === warningModal) {
        closeModal();
    }
});

// ===== LOADING OVERLAY =====

function showLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

// ===== localStorage helpers for result.html =====

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

async function saveUploadedImagesToStorage() {
    // only first 6 references just in case
    const limitedRefs = referenceFiles.slice(0, 6);

    const refBase64 = [];
    for (const file of limitedRefs) {
        const base64 = await fileToBase64(file);
        refBase64.push(base64);
    }

    const questionBase64 = questionedFile
        ? await fileToBase64(questionedFile)
        : null;

    localStorage.setItem('reference_images', JSON.stringify(refBase64));
    localStorage.setItem('question_image', questionBase64);
}

// ===== FILE INPUT HANDLERS (only if we're on index page) =====

if (referenceBrowseBtn && referenceInput) {
    referenceBrowseBtn.addEventListener('click', () => referenceInput.click());
}
if (questionedBrowseBtn && questionedInput) {
    questionedBrowseBtn.addEventListener('click', () => questionedInput.click());
}

if (referenceDropzone && referenceInput) {
    referenceDropzone.addEventListener('click', (e) => {
        if (e.target === referenceDropzone) referenceInput.click();
    });
}

if (questionedDropzone && questionedInput) {
    questionedDropzone.addEventListener('click', (e) => {
        if (e.target === questionedDropzone) questionedInput.click();
    });
}

const MAX_FILES = 6;

if (referenceInput) {
    referenceInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(isValidFile);
        const remainingSlots = MAX_FILES - referenceFiles.length;

        if (files.length > remainingSlots) {
            // If no slots left, show only the max message
            if (remainingSlots <= 0) {
                showModal(`Please upload only ${remainingSlots} more file(s).`);
            } else {
                showModal(` Maximum is ${MAX_FILES} files.`);
            }

            const filesToAdd = files.slice(0, remainingSlots);
            referenceFiles = [...referenceFiles, ...filesToAdd];
        } else {
            referenceFiles = [...referenceFiles, ...files];
        }

        updateReferenceDisplay();
        referenceInput.value = '';
    });
}

// Questioned input change
if (questionedInput) {
    questionedInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && isValidFile(file)) {
            questionedFile = file;
            updateQuestionedDisplay();
        }
        questionedInput.value = '';
    });
}

// ===== DRAG & DROP =====

if (referenceDropzone) {
    referenceDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        referenceDropzone.style.borderColor = '#5eead4';
        referenceDropzone.style.background = '#141414';
    });

    referenceDropzone.addEventListener('dragleave', () => {
        referenceDropzone.style.borderColor = '#3a3a3a';
        referenceDropzone.style.background = '#0f0f0f';
    });

    referenceDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        referenceDropzone.style.borderColor = '#3a3a3a';
        referenceDropzone.style.background = '#0f0f0f';

        const files = Array.from(e.dataTransfer.files).filter(isValidFile);
        const remainingSlots = 6 - referenceFiles.length;

        if (files.length > remainingSlots) {
            showModal(`Please upload only ${remainingSlots} more file(s). Maximum is 6 files.`);
            const filesToAdd = files.slice(0, remainingSlots);
            referenceFiles = [...referenceFiles, ...filesToAdd];
        } else {
            referenceFiles = [...referenceFiles, ...files];
        }

        updateReferenceDisplay();
    });
}

if (questionedDropzone) {
    questionedDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        questionedDropzone.style.borderColor = '#5eead4';
        questionedDropzone.style.background = '#141414';
    });

    questionedDropzone.addEventListener('dragleave', () => {
        questionedDropzone.style.borderColor = '#3a3a3a';
        questionedDropzone.style.background = '#0f0f0f';
    });

    questionedDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        questionedDropzone.style.borderColor = '#3a3a3a';
        questionedDropzone.style.background = '#0f0f0f';

        const files = Array.from(e.dataTransfer.files).filter(isValidFile);
        if (files.length > 0) {
            questionedFile = files[0];
            updateQuestionedDisplay();
        }
    });
}

// ===== VERIFY BUTTON =====

if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
        if (referenceFiles.length === 0 && !questionedFile) {
            showModal('Please upload Reference & Question signature image.');
            return;
        }

        if (referenceFiles.length < 6) {
            showModal(`Please upload ${6 - referenceFiles.length} more reference signature(s). You need 6 reference images.`);
            return;
        }

        if (!questionedFile) {
            showModal('Please upload a questioned signature image to verify.');
            return;
        }

        // All good -> show loading overlay
        showLoading();

        await saveUploadedImagesToStorage();

        hideLoading();

        // go to result page
        window.location.href = 'result.html';
    });
}
