
const main = document.getElementById('main');

const labels = [
    'Get started',
    'Pick a print',
    'Take your photos',
    'Pick a color',
    'Write a note',
    'Your photo booth'
];

const palette = [
    ['Classic white', '#ffffff'],
    ['Blush pink', '#ffd8e6'],
    ['Butter yellow', '#fff1ba'],
    ['Lavender', '#e7dcff'],
    ['Sage green', '#d9e9db'],
    ['Baby blue', '#d9e9fa'],
    ['Soft peach', '#ffe0ca'],
    ['Midnight', '#302b38']
];

let state = {
    step: 0,
    source: null,
    layout: null,
    shots: [],
    color: '#ffffff',
    note: ''
};

let stream = null;
let counting = false;
let drawTimer = null;

const icons = {
    camera: '<svg viewBox="0 0 24 24"><path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/></svg>'
};

function updateProgress() {
    document.getElementById('progressName').textContent = labels[state.step];

    document.getElementById('progressNum').textContent =
        String(state.step + 1).padStart(2, '0') + ' / 06';

    document.getElementById('progressBar').style.width =
        ((state.step + 1) / 6 * 100) + '%';
}

function setStep(n) {
    stopCamera();
    counting = false;
    state.step = n;

    render();

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function shell(step, heading, sub, body) {
    return `<section class="screen">
        <div class="step">STEP ${String(step + 1).padStart(2, '0')} · ${labels[step]}</div>
        <h1 class="heading">${heading}</h1>
        <p class="sub">${sub}</p>
        ${body}
    </section>`;
}

function actions(back, next, disabled = false, nextText = 'Continue') {
    return `<div class="actions">
        <button class="btn secondary" id="backBtn">← Back</button>
        <button class="btn" id="nextBtn" ${disabled ? 'disabled' : ''}>${nextText} →</button>
    </div>`;
}

function bindNav(back, next) {
    document.getElementById('backBtn')?.addEventListener('click', back);
    document.getElementById('nextBtn')?.addEventListener('click', next);
}

function render() {
    updateProgress();

    if (state.step === 0) {
        main.innerHTML = shell(
            0,
            'Your moment, your way.',
            'A little magic, a few snapshots, and a memory you can keep forever. How would you like to start?',
            `<div class="choice-grid">
                <button class="choice" id="cameraChoice">
                    <div class="choice-icon">${icons.camera}</div>
                    <h3>Use my camera</h3>
                    <p>Snap your pictures live with a sweet little countdown.</p>
                </button>

                <button class="choice" id="uploadChoice">
                    <div class="choice-icon">${icons.upload}</div>
                    <h3>Upload photos</h3>
                    <p>Turn favorite pictures from your device into a keepsake.</p>
                </button>
            </div>`
        );

        document.getElementById('cameraChoice').onclick = () => {
            state.source = 'camera';
            state.shots = [];
            setStep(1);
        };

        document.getElementById('uploadChoice').onclick = () => {
            state.source = 'upload';
            state.shots = [];
            setStep(1);
        };

        return;
    }

    if (state.step === 1) {
        main.innerHTML = shell(
            1,
            'Pick your perfect print.',
            'Choose a classic photo strip or a dreamy polaroid. Every format comes with a little room for your note.',
            `<div class="choice-grid layout-grid">
                <button class="choice layout-choice" data-layout="3">
                    <div class="mock">
                        <div class="mini-strip">
                            <i></i><i></i><i></i>
                        </div>
                    </div>
                    <h3>3-photo strip</h3>
                    <p>Classic & cute</p>
                </button>

                <button class="choice layout-choice" data-layout="4">
                    <div class="mock">
                        <div class="mini-strip four">
                            <i></i><i></i><i></i><i></i>
                        </div>
                    </div>
                    <h3>4-photo strip</h3>
                    <p>More moments</p>
                </button>

                <button class="choice layout-choice" data-layout="polaroid">
                    <div class="mock">
                        <div class="mini-polaroid">
                            <i></i>
                        </div>
                    </div>
                    <h3>Polaroid</h3>
                    <p>One special shot</p>
                </button>
            </div>

            <div class="actions">
                <button class="btn secondary" id="backBtn">← Back</button>
            </div>`
        );

        document.getElementById('backBtn').onclick = () => setStep(0);

        document.querySelectorAll('[data-layout]').forEach(b => b.onclick = () => {
            state.layout = b.dataset.layout;
            state.shots = [];
            setStep(2);
        });

        return;
    }

    if (state.step === 2) {
        state.source === 'camera' ? renderCamera() : renderUpload();
        return;
    }

    if (state.step === 3) {
        main.innerHTML = shell(
            3,
            'Choose your color.',
            'Give your photos a frame that matches your mood.',
            `<div class="edit-layout">
                <div class="preview-wrap">
                    <canvas id="previewCanvas" aria-label="Photo preview"></canvas>
                </div>

                <div class="options">
                    <h3>A little color magic ✿</h3>
                    <p>Pick the perfect shade for your ${state.layout === 'polaroid' ? 'polaroid' : 'photo strip'}.</p>

                    <div class="swatches">
                        ${palette.map(([label, color]) => `
                            <button
                                class="swatch"
                                style="background:${color}"
                                title="${label}"
                                aria-label="${label}"
                                aria-pressed="${state.color === color}"
                                data-color="${color}">
                            </button>
                        `).join('')}
                    </div>

                    <p>Don't worry — you can change your mind anytime.</p>
                </div>
            </div>

            ${actions(() => {}, () => {})}`
        );

        paintPreview();

        document.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
            state.color = b.dataset.color;

            document.querySelectorAll('[data-color]').forEach(x =>
                x.setAttribute('aria-pressed', String(x === b))
            );

            paintPreview();
        });

        bindNav(() => setStep(2), () => setStep(4));

        return;
    }

    if (state.step === 4) {
        main.innerHTML = shell(
            4,
            'Leave a little love note.',
            'A date, an inside joke, or a tiny message — your handwritten-style note makes it yours.',
            `<div class="edit-layout">
                <div class="preview-wrap">
                    <canvas id="previewCanvas" aria-label="Photo preview"></canvas>
                </div>

                <div class="options">
                    <h3>The finishing touch ♡</h3>
                    <p>Your note will appear in cursive at the bottom of your print.</p>

                    <label class="note-label" for="noteInput">Add a note (optional)</label>

                    <input
                        id="noteInput"
                        class="note-input"
                        maxlength="48"
                        placeholder="love you to the moon ♡"
                        value="${escapeHtml(state.note)}">

                    <p>Up to 48 characters. Leave it blank for a clean, classic look.</p>
                </div>
            </div>

            ${actions(() => {}, () => {}, false, 'See my photos')}`
        );

        paintPreview();

        document.getElementById('noteInput').addEventListener('input', e => {
            state.note = e.target.value;
            paintPreview();
        });

        bindNav(() => setStep(3), () => setStep(5));

        return;
    }

    if (state.step === 5) {
        main.innerHTML = shell(
            5,
            'A moment to keep forever.',
            'Your photo booth memory is ready! Save it, share it, or make another one.',
            `<div class="result">
                <div class="sparkle">✦ ♡ ✦</div>

                <canvas id="resultCanvas" aria-label="Your finished photo booth print"></canvas>

                <div class="actions">
                    <button class="btn" id="saveBtn">↓ Download photo</button>
                    <button class="btn secondary" id="restartBtn">Make another ↻</button>
                </div>

                <p class="fine">Saved as a high-resolution PNG, ready to print or share.</p>
            </div>`
        );

        paintPreview();

        document.getElementById('saveBtn').onclick = () => {
            const c = document.getElementById('resultCanvas');
            const a = document.createElement('a');

            a.download = `freezy-breezy-booth-${state.layout}-${Date.now()}.png`;
            a.href = c.toDataURL('image/png');
            a.click();
        };

        document.getElementById('restartBtn').onclick = () => {
            state = {
                step: 0,
                source: null,
                layout: null,
                shots: [],
                color: '#ffffff',
                note: ''
            };

            setStep(0);
        };

        return;
    }
}

function required() {
    return state.layout === 'polaroid' ? 1 : Number(state.layout);
}

function thumbs() {
    return Array.from(
        { length: required() },
        (_, i) => `
            <div class="thumb ${i === state.shots.length ? 'active' : ''}">
                ${state.shots[i]
                    ? `<img src="${state.shots[i]}" alt="Photo ${i + 1}">`
                    : `${i + 1}`
                }
            </div>
        `
    ).join('');
}

async function initCamera() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw Error('Camera is not available in this browser. Try using HTTPS or uploading photos instead.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 960
                }
            },
            audio: false
        });

        if (state.step !== 2 || state.source !== 'camera') {
            stopCamera();
            return;
        }

        const video = document.getElementById('cameraVideo');
        video.srcObject = stream;
        await video.play();

    } catch (e) {
        showError(
            e.name === 'NotAllowedError'
                ? 'Camera access was blocked. Allow camera access in your browser settings, or go back and choose Upload photos.'
                : e.message
        );
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

function showError(msg) {
    const el = document.getElementById('cameraError');

    if (el) el.textContent = msg;
}

function renderCamera() {
    const total = required();

    main.innerHTML = shell(
        2,
        'Lights, camera, you!',
        'Get ready for your close-up. Each photo starts after a five-second countdown.',
        `<div class="capture-layout">
            <div class="camera-shell">
                <video id="cameraVideo" autoplay muted playsinline aria-label="Live camera preview"></video>

                <div class="count hide" id="countdown"></div>

                <div class="hint" id="cameraHint">
                    Smile for photo ${Math.min(state.shots.length + 1, total)} of ${total} ✨
                </div>
            </div>

            <div class="shots-panel">
                <h3>Your snapshots ♡</h3>

                <p id="shotText">${state.shots.length} of ${total} photos taken</p>

                <div class="thumbs" id="photoThumbs">${thumbs()}</div>

                <button class="btn" id="snapBtn" ${state.shots.length === total ? 'disabled' : ''}>
                    ${state.shots.length === total ? 'All done!' : 'Take photo ✦'}
                </button>

                <div style="height:10px"></div>

                <button class="btn secondary" id="retakeBtn" ${state.shots.length ? '' : 'disabled'}>
                    Retake last
                </button>
            </div>
        </div>

        <p class="error" id="cameraError" role="alert"></p>

        ${actions(() => {}, () => {}, state.shots.length !== total, 'Choose frame color')}`
    );

    bindNav(() => setStep(1), () => setStep(3));

    document.getElementById('snapBtn').onclick = snap;

    document.getElementById('retakeBtn').onclick = () => {
        if (counting) return;

        state.shots.pop();
        renderCameraKeepStream();
    };

    initCamera();
}

function renderCameraKeepStream() {
    let oldStream = stream;
    stream = null;

    renderCamera();

    if (oldStream) oldStream.getTracks().forEach(t => t.stop());
}

async function snap() {
    if (counting || state.shots.length >= required()) return;

    const video = document.getElementById('cameraVideo');

    if (!video.videoWidth) {
        showError('Camera is still starting. Please try again.');
        return;
    }

    counting = true;

    document.getElementById('snapBtn').disabled = true;
    document.getElementById('retakeBtn').disabled = true;

    const count = document.getElementById('countdown');
    count.classList.remove('hide');

    for (let i = 5; i >= 1; i--) {
        if (state.step !== 2 || state.source !== 'camera') {
            counting = false;
            return;
        }

        count.textContent = i;
        await new Promise(r => setTimeout(r, 1000));
    }

    if (state.step !== 2 || !stream) {
        counting = false;
        return;
    }

    count.textContent = '✦';

    const c = document.createElement('canvas');
    c.width = 1000;
    c.height = 750;

    const cx = c.getContext('2d');

    cx.translate(c.width, 0);
    cx.scale(-1, 1);

    coverImage(cx, video, 0, 0, c.width, c.height, video.videoWidth, video.videoHeight);

    state.shots.push(c.toDataURL('image/jpeg', .92));

    await new Promise(r => setTimeout(r, 250));

    counting = false;

    if (state.step === 2) renderCameraKeepStream();
}

function renderUpload() {
    const total = required();

    main.innerHTML = shell(
        2,
        'Bring your memories.',
        'Choose your favorite photos. You can add them all at once and arrange them in the order you like.',
        `<div class="upload-panel" id="dropZone">
            ${icons.upload}

            <h3>Add your ${total === 1 ? 'favorite photo' : total + ' favorite photos'}</h3>

            <p>Upload JPG, PNG, WEBP, or HEIC (if your browser supports it).</p>

            <input id="fileInput" class="hide" type="file" accept="image/*" multiple>

            <button class="btn" id="uploadBtn">Choose photos</button>

            <p class="fine">You can also drag and drop images here.</p>
        </div>

        <div class="uploaded-list" id="uploadedList">${thumbs()}</div>

        <p class="fine" id="uploadCount">
            ${state.shots.length} / ${total} photos selected · tap a photo to remove it
        </p>

        <p class="error" id="cameraError" role="alert"></p>

        ${actions(() => {}, () => {}, state.shots.length !== total, 'Choose frame color')}`
    );

    bindNav(() => setStep(1), () => setStep(3));

    const file = document.getElementById('fileInput');

    document.getElementById('uploadBtn').onclick = () => file.click();
    file.onchange = () => handleFiles(file.files);

    let zone = document.getElementById('dropZone');

    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.style.borderColor = '#d95b88';
    });

    zone.addEventListener('dragleave', () => zone.style.borderColor = '');

    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '';
        handleFiles(e.dataTransfer.files);
    });

    document.querySelectorAll('#uploadedList .thumb').forEach((el, i) => {
        if (state.shots[i]) {
            el.style.cursor = 'pointer';
            el.title = 'Remove photo';

            el.onclick = () => {
                state.shots.splice(i, 1);
                renderUpload();
            };
        }
    });
}

async function handleFiles(files) {
    let remaining = required() - state.shots.length;

    if (!remaining) {
        showError('All photo slots are full. Tap a photo below to replace it.');
        return;
    }

    for (let f of [...files].slice(0, remaining)) {
        if (!f.type.startsWith('image/')) {
            showError('Please choose image files.');
            continue;
        }

        try {
            const url = await new Promise((resolve, reject) => {
                const reader = new FileReader;

                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;

                reader.readAsDataURL(f);
            });

            const im = await loadImage(url);

            const c = document.createElement('canvas');

            const scale = Math.min(1, 1600 / Math.max(im.width, im.height));

            c.width = Math.round(im.width * scale);
            c.height = Math.round(im.height * scale);

            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);

            state.shots.push(c.toDataURL('image/jpeg', .92));

        } catch (e) {
            showError('This image could not be opened. Try a JPG or PNG instead.');
        }
    }

    if (state.step === 2 && state.source === 'upload') renderUpload();
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image;

        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function coverImage(ctx, img, x, y, w, h, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height) {
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;

    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

async function paintPreview() {
    const canvas = document.getElementById(
        state.step === 5 ? 'resultCanvas' : 'previewCanvas'
    );

    if (!canvas) return;

    const isPol = state.layout === 'polaroid';
    const n = required();

    const W = isPol ? 1000 : 650;
    const pad = isPol ? 65 : 45;
    const gap = isPol ? 0 : 24;
    const photoW = W - pad * 2;
    const photoH = isPol ? 850 : 415;
    const bottom = isPol ? 245 : 160;

    const H = isPol
        ? (pad + photoH + bottom)
        : (pad + n * photoH + (n - 1) * gap + bottom);

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = state.color;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < n; i++) {
        let img;

        try {
            img = await loadImage(state.shots[i]);
        } catch {
            continue;
        }

        if (!canvas.isConnected) return;

        ctx.save();
        ctx.beginPath();

        ctx.rect(
            pad,
            pad + i * (photoH + gap),
            photoW,
            photoH
        );

        ctx.clip();

        coverImage(
            ctx,
            img,
            pad,
            pad + i * (photoH + gap),
            photoW,
            photoH
        );

        ctx.restore();
    }

    const dark = state.color === '#302b38';

    ctx.fillStyle = dark ? '#fffafc' : '#594252';

    const y = H - (isPol ? 92 : 70);
    const txt = state.note.trim();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (txt) {
        ctx.font = `${isPol ? 60 : 47}px 'Dancing Script', cursive`;

        let size = isPol ? 60 : 47;

        while (ctx.measureText(txt).width > W - 80 && size > 20) {
            size -= 2;
            ctx.font = `${size}px 'Dancing Script', cursive`;
        }

        ctx.fillText(txt, W / 2, y);

    } else {
        ctx.font = `${isPol ? 23 : 18}px 'DM Sans', sans-serif`;
        ctx.globalAlpha = .56;
        ctx.fillText('✿ freezy breezy booth', W / 2, y);
        ctx.globalAlpha = 1;
    }
}

let fontsRedrawn = false;

document.fonts?.ready.then(() => {
    if (!fontsRedrawn && state.step >= 3) {
        fontsRedrawn = true;
        paintPreview();
    }
});

render();
