const galleryGrid = document.getElementById('gallery-grid');
const chronologicalBtn = document.getElementById('chronological-btn');
const randomBtn = document.getElementById('random-btn');
const heroStreamTrack = document.getElementById('hero-stream-track');

// ローダー制御
const loaderOverlay = document.getElementById('loader-overlay');
const dvdText = loaderOverlay.querySelector('.dvd-text');
let idleTimer = null;
const IDLE_SEC = 8;
let dvdAnimationId = null;
let scatterTimer = null;
const dvdColors = ['#2a6cff', '#e53935', '#f6bf26'];
const dvdState = {
    x: 0,
    y: 0,
    vx: 2.3,
    vy: 1.8,
    active: false
};

function setupDvdChars() {
    const text = dvdText.textContent.trim();
    dvdText.innerHTML = '';
    [...text].forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'dvd-char';
        span.textContent = char;
        span.style.setProperty('--i', index);
        dvdText.appendChild(span);
    });
}

function triggerScatter() {
    dvdText.querySelectorAll('.dvd-char').forEach(charEl => {
        const dx = (Math.random() * 2 - 1) * 26;
        const dy = (Math.random() * 2 - 1) * 18;
        const rot = (Math.random() * 2 - 1) * 25;
        charEl.style.setProperty('--dx', `${dx}px`);
        charEl.style.setProperty('--dy', `${dy}px`);
        charEl.style.setProperty('--rot', `${rot}deg`);
    });
    dvdText.classList.remove('scatter');
    void dvdText.offsetWidth;
    dvdText.classList.add('scatter');
}

function scheduleScatter() {
    clearTimeout(scatterTimer);
    if (!dvdState.active) {
        return;
    }
    const delay = 2200 + Math.random() * 3000;
    scatterTimer = setTimeout(() => {
        if (dvdState.active) {
            triggerScatter();
            scheduleScatter();
        }
    }, delay);
}

setupDvdChars();

function resetLoaderToCenter() {
    dvdText.style.left = '50%';
    dvdText.style.top = '50%';
}

function setRandomDvdColor() {
    const randomIndex = Math.floor(Math.random() * dvdColors.length);
    dvdText.style.color = dvdColors[randomIndex];
}

function stopDvdAnimation() {
    if (dvdAnimationId !== null) {
        cancelAnimationFrame(dvdAnimationId);
        dvdAnimationId = null;
    }
    clearTimeout(scatterTimer);
    scatterTimer = null;
    dvdState.active = false;
    dvdText.classList.remove('scatter');
    resetLoaderToCenter();
}

function startDvdAnimation() {
    stopDvdAnimation();
    dvdState.active = true;

    const bounds = loaderOverlay.getBoundingClientRect();
    const imgWidth = dvdText.offsetWidth;
    const imgHeight = dvdText.offsetHeight;

    dvdState.x = Math.max(0, (bounds.width - imgWidth) / 2);
    dvdState.y = Math.max(0, (bounds.height - imgHeight) / 2);
    dvdText.style.left = `${dvdState.x}px`;
    dvdText.style.top = `${dvdState.y}px`;

    const step = () => {
        if (!dvdState.active) {
            return;
        }

        const currentBounds = loaderOverlay.getBoundingClientRect();
        const currentWidth = dvdText.offsetWidth;
        const currentHeight = dvdText.offsetHeight;
        const maxX = Math.max(0, currentBounds.width - currentWidth);
        const maxY = Math.max(0, currentBounds.height - currentHeight);

        dvdState.x += dvdState.vx;
        dvdState.y += dvdState.vy;

        let bounced = false;
        if (dvdState.x <= 0 || dvdState.x >= maxX) {
            dvdState.vx *= -1;
            dvdState.x = Math.min(Math.max(dvdState.x, 0), maxX);
            bounced = true;
        }
        if (dvdState.y <= 0 || dvdState.y >= maxY) {
            dvdState.vy *= -1;
            dvdState.y = Math.min(Math.max(dvdState.y, 0), maxY);
            bounced = true;
        }
        if (bounced) {
            setRandomDvdColor();
        }

        dvdText.style.left = `${dvdState.x}px`;
        dvdText.style.top = `${dvdState.y}px`;

        dvdAnimationId = requestAnimationFrame(step);
    };

    dvdAnimationId = requestAnimationFrame(step);
    scheduleScatter();
}

function showIdleLoader() {
    loaderOverlay.classList.add('idle');
    loaderOverlay.classList.remove('hidden');
    dvdText.style.color = '#2a6cff';
    startDvdAnimation();
}
function hideLoader() {
    loaderOverlay.classList.add('hidden');
    loaderOverlay.classList.remove('idle');
    dvdText.style.color = '#111';
    stopDvdAnimation();
}
function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showIdleLoader, IDLE_SEC * 1000);
}

// ギャラリーアニメーションを遅延起動する関数
function startGalleryAnimation() {
    document.querySelectorAll('.poster-item').forEach(el => el.classList.add('animate'));
}

// 初回ロード：白背景で即表示、1秒後にフェードアウト → その後ギャラリーアニメーション開始
setTimeout(() => {
    hideLoader();
    loaderOverlay.addEventListener('transitionend', () => {
        startGalleryAnimation();
        resetIdleTimer();
    }, { once: true });
}, 1000);

// ユーザー操作でアイドル表示を消してタイマーをリセット
['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
        if (!loaderOverlay.classList.contains('hidden') && loaderOverlay.classList.contains('idle')) {
            hideLoader();
        }
        resetIdleTimer();
    });
});

// モーダル要素を取得
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const closeBtn = document.getElementsByClassName('close')[0];

let originalData = [];

function setActiveMode(mode) {
    chronologicalBtn.classList.toggle('is-active', mode === 'chronological');
    randomBtn.classList.toggle('is-active', mode === 'random');
}

// シャッフル関数
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createHeroStream(images) {
    if (!heroStreamTrack || !images.length) {
        return;
    }

    const laneLength = Math.max(28, Math.ceil(window.innerWidth / 120) + 20);
    const sequence = Array.from({ length: laneLength }, () => {
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    });

    heroStreamTrack.innerHTML = '';

    [...sequence, ...sequence].forEach((image) => {
        const item = document.createElement('div');
        item.className = 'hero-stream-item';

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = '';
        img.loading = 'lazy';

        item.appendChild(img);
        heroStreamTrack.appendChild(item);
    });
}

// データをループしてHTMLを作成する関数
function renderGallery(images, animate = true) {
    galleryGrid.innerHTML = ''; // クリア
    images.forEach((image, i) => {
        const item = document.createElement('div');
        item.className = 'poster-item' + (animate ? ' animate' : '');
        item.style.animationDelay = `${i * 0.1}s`;

        const img = document.createElement('img');
        // JSONに書き出された本物のURLをセット！
        img.src = image.url; 
        img.alt = image.name || "Poster Graphic";
        img.loading = "lazy";

        // クリックイベントを追加
        img.addEventListener('click', function() {
            modal.classList.add('active');
            modalImg.src = image.url;
            modalCaption.textContent = image.name;
        });

        item.appendChild(img);
        galleryGrid.appendChild(item);
    });
}

// 時系列表示（data.jsonの並び順）
chronologicalBtn.addEventListener('click', () => {
    renderGallery([...originalData]);
    setActiveMode('chronological');
});

// ランダム表示（クリックごとに再シャッフル）
const refreshIcon = document.getElementById('refresh-icon');
randomBtn.addEventListener('click', () => {
    renderGallery(shuffle(originalData));
    setActiveMode('random');
    refreshIcon.classList.remove('spinning');
    void refreshIcon.offsetWidth; // reflow でアニメーションをリセット
    refreshIcon.classList.add('spinning');
});
refreshIcon.addEventListener('animationend', () => {
    refreshIcon.classList.remove('spinning');
});

// モーダルを閉じる関数
function closeModal() {
    modal.classList.remove('active');
}

// transitionendでdisplay none
modal.addEventListener('transitionend', () => {
    if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
    }
});

// 閉じるボタンにイベント
closeBtn.addEventListener('click', closeModal);

// モーダルの外をクリックしたら閉じる
modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal();
    }
});

// スムーズスクロールでトップへ戻る
document.querySelector('.scroll-top').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 魔法のコード：新しく作った data.json を読み込みに行く
fetch('data.json')
    .then(response => response.json()) // JSONデータとして解釈する
    .then(data => {
        console.log("読み込んだデータ:", data); // 裏側で確認用
        originalData = [...data];
        createHeroStream(data);
        renderGallery(shuffle(data), false); // ローダー中はアニメなしで描画
        setActiveMode('random');
    })
    .catch(error => {
        console.error("データの読み込みに失敗しました:", error);
    });