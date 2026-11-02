const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Storage can throw in private windows, so settings just stop persisting there
function readSetting(storageName, key) {
    try {
        return window[storageName].getItem(key);
    } catch (e) {
        return null;
    }
}

function saveSetting(storageName, key, value) {
    try {
        window[storageName].setItem(key, value);
    } catch (e) {}
}

// Sound effects, off until the visitor turns them on
let soundOn = false;
let audioContext = null;

function playTick() {
    if (!soundOn) return;
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.value = 1400;
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
}

const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', function() {
    soundOn = !soundOn;
    this.setAttribute('aria-pressed', soundOn);
    document.getElementById('soundLabel').textContent = soundOn ? 'ON' : 'OFF';
    playTick();
});

// Green / amber screen color
const phosphorLabel = document.getElementById('phosphorLabel');

function setPhosphorLabel() {
    const isAmber = document.documentElement.dataset.phosphor === 'amber';
    phosphorLabel.textContent = isAmber ? 'AMBER' : 'GREEN';
    document.querySelector('meta[name="theme-color"]').content = isAmber ? '#130c02' : '#031108';
}

document.getElementById('phosphorToggle').addEventListener('click', function() {
    const isAmber = document.documentElement.dataset.phosphor === 'amber';
    if (isAmber) {
        delete document.documentElement.dataset.phosphor;
    } else {
        document.documentElement.dataset.phosphor = 'amber';
    }
    saveSetting('localStorage', 'phosphor', isAmber ? 'green' : 'amber');
    setPhosphorLabel();
    playTick();
});

setPhosphorLabel();

// Main tabs, driven by the URL hash so links and the back button work
const panelsContainer = document.getElementById('panels');
const panels = Array.from(document.querySelectorAll('.panel'));
const tabs = Array.from(document.querySelectorAll('.tab'));

function showPanel(id, moveFocus) {
    const target = panels.find(panel => panel.id === id) || panels[0];

    panels.forEach(panel => {
        panel.hidden = panel !== target;
        panel.classList.toggle('is-entering', panel === target);
    });
    tabs.forEach(tab => {
        if (tab.getAttribute('href') === `#${target.id}`) {
            tab.setAttribute('aria-current', 'page');
        } else {
            tab.removeAttribute('aria-current');
        }
    });

    panelsContainer.scrollTop = 0;
    updateWaveform(target.id === 'contact');
    if (moveFocus) target.focus({ preventScroll: true });
}

window.addEventListener('hashchange', function() {
    const id = location.hash.slice(1);

    // The skip link points at the container, not at a tab
    if (id && !panels.some(panel => panel.id === id)) return;

    showPanel(id, true);
    playTick();
});

// Tab switching from the keyboard
document.addEventListener('keydown', function(e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

    const current = tabs.findIndex(tab => tab.hasAttribute('aria-current'));
    let next = -1;

    if (e.key >= '1' && e.key <= String(tabs.length)) next = Number(e.key) - 1;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;

    if (next >= 0) location.hash = tabs[next].getAttribute('href');
});

// Master/detail lists on the SPECIAL and DATA tabs
document.querySelectorAll('[data-readout]').forEach(readout => {
    const items = Array.from(readout.querySelectorAll('[role="tab"]'));
    const details = Array.from(readout.querySelectorAll('[role="tabpanel"]'));

    function select(item) {
        items.forEach(other => {
            const selected = other === item;
            other.setAttribute('aria-selected', selected);
            other.tabIndex = selected ? 0 : -1;
            document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
        });
    }

    items.forEach((item, index) => {
        item.addEventListener('click', function() {
            select(item);
            playTick();

            // The list and detail are stacked on small screens
            if (window.matchMedia('(max-width: 860px)').matches) {
                const detail = document.getElementById(item.getAttribute('aria-controls'));
                detail.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
            }
        });

        item.addEventListener('keydown', function(e) {
            let next = null;
            if (e.key === 'ArrowDown') next = items[(index + 1) % items.length];
            if (e.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length];
            if (e.key === 'Home') next = items[0];
            if (e.key === 'End') next = items[items.length - 1];

            if (next) {
                e.preventDefault();
                select(next);
                next.focus();
                playTick();
            }
        });
    });

    if (details.length) select(items[0]);
});

// Radio waveform, only drawn while the Radio tab is open
const canvas = document.getElementById('waveform');
const canvasContext = canvas.getContext('2d');
let waveFrame = null;
let waveDetail = 1;

function drawWaveform(time) {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
    }

    const styles = getComputedStyle(document.documentElement);
    canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvasContext.clearRect(0, 0, width, height);

    // Scope grid
    canvasContext.strokeStyle = styles.getPropertyValue('--phosphor-faint');
    canvasContext.lineWidth = 1;
    canvasContext.beginPath();
    for (let x = 0; x <= width; x += width / 10) {
        canvasContext.moveTo(x, 0);
        canvasContext.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += height / 4) {
        canvasContext.moveTo(0, y);
        canvasContext.lineTo(width, y);
    }
    canvasContext.stroke();

    // Signal
    const phase = time / 400;
    canvasContext.strokeStyle = styles.getPropertyValue('--phosphor');
    canvasContext.lineWidth = 2;
    canvasContext.shadowColor = styles.getPropertyValue('--phosphor');
    canvasContext.shadowBlur = 6;
    canvasContext.beginPath();
    for (let x = 0; x <= width; x += 2) {
        const position = x / width;
        const envelope = Math.sin(position * Math.PI);
        const wave = Math.sin(position * 14 * waveDetail + phase)
            + 0.5 * Math.sin(position * 37 * waveDetail - phase * 1.7);
        const y = height / 2 + wave * envelope * height * 0.26;
        if (x === 0) canvasContext.moveTo(x, y);
        else canvasContext.lineTo(x, y);
    }
    canvasContext.stroke();
    canvasContext.shadowBlur = 0;

    if (!reducedMotion) waveFrame = requestAnimationFrame(drawWaveform);
}

function updateWaveform(isOpen) {
    cancelAnimationFrame(waveFrame);
    if (isOpen) waveFrame = requestAnimationFrame(drawWaveform);
}

document.querySelectorAll('.station').forEach(station => {
    function tune() {
        waveDetail = 0.6 + Number(station.dataset.wave) * 0.3;
        if (reducedMotion) requestAnimationFrame(drawWaveform);
    }
    station.addEventListener('mouseenter', tune);
    station.addEventListener('focus', tune);
});

// Copy email address
const copyStatus = document.getElementById('copyStatus');

document.getElementById('copyEmail').addEventListener('click', async function() {
    try {
        await navigator.clipboard.writeText('owensoreno@gmail.com');
        copyStatus.textContent = '> Address copied to clipboard.';
    } catch (e) {
        copyStatus.textContent = '> Could not copy. The address is owensoreno@gmail.com';
    }
    playTick();
});

// Philippine time in the status bar
const clock = document.getElementById('clock');
const clockFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit'
});

function updateClock() {
    clock.textContent = clockFormat.format(new Date());
}

updateClock();
setInterval(updateClock, 30000);

document.getElementById('year').textContent = new Date().getFullYear();

// Boot sequence, once per visit and skippable with any click or key
function runBoot() {
    if (reducedMotion || readSetting('sessionStorage', 'booted')) return;
    saveSetting('sessionStorage', 'booted', '1');

    const boot = document.getElementById('boot');
    const lines = [
        'OWEN-BOY 3000 BIOS v2.87',
        'MEMORY CHECK ............ OK',
        'LOADING PERSONNEL FILE .. SOREÑO, O.K.',
        'SIGNAL ACQUIRED'
    ];
    let timer = null;
    let index = 0;

    function finish() {
        clearTimeout(timer);
        boot.hidden = true;
        boot.removeEventListener('click', finish);
        document.removeEventListener('keydown', finish);
    }

    function nextLine() {
        if (index === lines.length) {
            timer = setTimeout(finish, 300);
            return;
        }
        boot.textContent += `${lines[index]}\n`;
        index++;
        timer = setTimeout(nextLine, 260);
    }

    boot.hidden = false;
    boot.addEventListener('click', finish);
    document.addEventListener('keydown', finish);
    nextLine();
}

showPanel(location.hash.slice(1), false);
runBoot();
