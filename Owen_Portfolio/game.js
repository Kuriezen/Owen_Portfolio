// Bunker Crawl: a small first-person shooter drawn with a raycaster
const GAME_W = 320;
const GAME_H = 200;
const GAME_TEX = 32;
const SPRITE_SIZE = 16;

const gameCanvas = document.getElementById('gameCanvas');
const gameContext = gameCanvas.getContext('2d');
const gameImage = gameContext.createImageData(GAME_W, GAME_H);
const gamePixels = new Uint32Array(gameImage.data.buffer);
const gameDepth = new Float32Array(GAME_W);
const gamePalette = new Uint32Array(64);
const gameStage = document.getElementById('gameStage');
const gameOverlay = document.getElementById('gameOverlay');
const gameOverlayTitle = document.getElementById('gameOverlayTitle');
const gameOverlayText = document.getElementById('gameOverlayText');
const gameStartButton = document.getElementById('gameStart');
const gameCta = document.getElementById('gameCta');
const gameMessage = document.getElementById('gameMessage');
const gameInput = { forward: false, back: false, strafeLeft: false, strafeRight: false, turnLeft: false, turnRight: false, fire: false };

const GAME_KEYS = {
    KeyW: 'forward',
    ArrowUp: 'forward',
    KeyS: 'back',
    ArrowDown: 'back',
    KeyA: 'strafeLeft',
    KeyD: 'strafeRight',
    ArrowLeft: 'turnLeft',
    ArrowRight: 'turnRight',
    Space: 'fire'
};

const GAME_SECTORS = [
    [
        '################',
        '#P..#....a.....#',
        '#...#..h....h..#',
        '#...B.....##...#',
        '#........m##...#',
        '#...B..........#',
        '#...#..##..d...#',
        '#a..#..##......#',
        '#####......h...#',
        '#s.......#######',
        '#......d.......X',
        '################'
    ],
    [
        '####################',
        '#P....#.......#...a#',
        '#.....B..d....B....#',
        '#..a..#.......#..h.#',
        '###.###.##H##.###.##',
        '#.....h.#...#......#',
        '#.d.....#.m.#...d..#',
        '#.......#...#......#',
        '##H###.##...##.###H#',
        '#.s.........h......#',
        '#.....d.......h.a..#',
        '#####X##############'
    ],
    [
        '######################',
        '#P..a#...........#..m#',
        '#....B...h...h...B...#',
        '#....#...........#...#',
        '##.###..##...##..###.#',
        '#.......##...##......#',
        '#..d................d#',
        '#.......##...##......#',
        '#a......##.b.##.....a#',
        '#....h.........h.....#',
        '#m...........d......s#',
        '###########X##########'
    ]
];

const GAME_ENEMIES = {
    h: { name: 'Glow Hound', hp: 30, speed: 2.1, range: 0.85, damage: 8, cooldown: 0.8, ranged: false, scale: 0.8, drop: 0.2, sprites: ['houndA', 'houndB'] },
    d: { name: 'Scrap Drone', hp: 45, speed: 1.2, range: 4, damage: 8, cooldown: 1.7, ranged: true, scale: 0.65, drop: -0.25, sprites: ['drone', 'drone'] },
    b: { name: 'Scrap Hulk', hp: 240, speed: 0.9, range: 4.5, damage: 12, cooldown: 1.1, ranged: true, scale: 1.25, drop: -0.05, sprites: ['hulk', 'hulk'] }
};

const GAME_ART = {
    houndA: [
        '................', '..1..........1..', '..11........11..', '..111111111111..',
        '.11233111133211.', '.11233111133211.', '.11111111111111.', '..111222222111..',
        '...1122222211...', '....13133131....', '...111111111....', '..11.111111.11..',
        '..11.111111.11..', '..1...1..1...1..', '.11...1..1...11.', '.11..11..11..11.'
    ],
    houndB: [
        '................', '..1..........1..', '..11........11..', '..111111111111..',
        '.11233111133211.', '.11233111133211.', '.11111111111111.', '..111222222111..',
        '...1122222211...', '....13133131....', '...111111111....', '..11.111111.11..',
        '...1.111111.1...', '...1..1..1..1...', '...11.1..1.11...', '....1.11.11.1...'
    ],
    drone: [
        '.......33.......', '.......11.......', '....11111111....', '..111122221111..',
        '.11122222222111.', '.11223333332211.', '1112233113322111', '1112233113322111',
        '.11223333332211.', '.11122222222111.', '..111122221111..', '....11111111....',
        '...1..1111..1...', '..1...1..1...1..', '..1..........1..', '................'
    ],
    hulk: [
        '....11111111....', '...1222222221...', '...1233223321...', '...1233223321...',
        '...1222222221...', '.11111111111111.', '1221222222221221', '1221233333321221',
        '1221232222321221', '1221233333321221', '1221222222221221', '3311111111111133',
        '33..11111111..33', '....111..111....', '...2222..2222...', '...2222..2222...'
    ],
    med: [
        '................', '................', '...2222222222...', '...2222222222...',
        '...2223333222...', '...2223333222...', '...3333333333...', '...3333333333...',
        '...3333333333...', '...3333333333...', '...2223333222...', '...2223333222...',
        '...2222222222...', '...2222222222...', '................', '................'
    ],
    ammo: [
        '................', '................', '................', '................',
        '................', '....3..3..3.....', '....2..2..2.....', '...1111111111...',
        '..122222222221..', '..123333333321..', '..122222222221..', '..122222222221..',
        '..111111111111..', '................', '................', '................'
    ],
    scrap: [
        '................', '................', '................', '................',
        '......2..2......', '....3222222.3...', '....2211112.....', '...221133112....',
        '...221133112....', '....2211112.....', '....3222222.3...', '......2..2......',
        '................', '................', '................', '................'
    ],
    shot: [
        '................', '................', '................', '................',
        '................', '......3333......', '.....333333.....', '.....333333.....',
        '.....333333.....', '.....333333.....', '......3333......', '................',
        '................', '................', '................', '................'
    ]
};

const GAME_SHADE = [0, 0.42, 0.72, 1];
const gameSprites = {};
Object.keys(GAME_ART).forEach(name => {
    const data = new Uint8Array(SPRITE_SIZE * SPRITE_SIZE);
    GAME_ART[name].forEach((row, y) => {
        for (let x = 0; x < SPRITE_SIZE; x++) data[y * SPRITE_SIZE + x] = Number(row[x]) || 0;
    });
    gameSprites[name] = data;
});

// Repeatable noise so the walls look the same on every visit
function makeGameRandom(seed) {
    let value = seed;
    return function() {
        value = (value * 16807) % 2147483647;
        return value / 2147483647;
    };
}

function makeGameTexture(seed, paint) {
    const random = makeGameRandom(seed);
    const texture = new Float32Array(GAME_TEX * GAME_TEX);
    for (let y = 0; y < GAME_TEX; y++) {
        for (let x = 0; x < GAME_TEX; x++) {
            texture[y * GAME_TEX + x] = Math.max(0, Math.min(1, paint(x, y) + (random() - 0.5) * 0.1));
        }
    }
    return texture;
}

const gameTextures = {
    '#': makeGameTexture(11, (x, y) => {
        if (x % 16 === 0 || y % 16 === 0) return 0.18;
        if ((x % 16 === 2 || x % 16 === 13) && (y % 16 === 2 || y % 16 === 13)) return 0.9;
        return 0.52;
    }),
    B: makeGameTexture(23, (x, y) => {
        const offset = (y >> 3) & 1 ? 8 : 0;
        if (y % 8 === 0 || (x + offset) % 16 === 0) return 0.16;
        return 0.42;
    }),
    H: makeGameTexture(37, (x, y) => (((x + y) >> 3) & 1 ? 0.85 : 0.22)),
    X: makeGameTexture(41, (x, y) => {
        if (x < 4 || x > 27 || y < 4 || y > 27) return 0.3;
        if (y % 4 === 0) return 0.55;
        return x > 8 && x < 23 && y > 12 && y < 19 ? 0.35 : 1;
    })
};

const game = {
    state: 'title',
    sector: 0,
    time: 0,
    map: [],
    enemies: [],
    pickups: [],
    shots: [],
    notice: 0,
    frame: null,
    last: 0,
    locked: false,
    phosphor: null,
    player: null
};

function buildGamePalette() {
    const styles = getComputedStyle(document.documentElement);
    const parse = hex => [1, 3, 5].map(i => parseInt(hex.trim().slice(i, i + 2), 16));
    const bright = parse(styles.getPropertyValue('--phosphor'));
    const dark = parse(styles.getPropertyValue('--screen-edge'));
    for (let i = 0; i < 64; i++) {
        const mix = i / 63;
        const channel = n => Math.round(dark[n] + (bright[n] - dark[n]) * mix);
        gamePalette[i] = (255 << 24) | (channel(2) << 16) | (channel(1) << 8) | channel(0);
    }
    game.phosphor = document.documentElement.dataset.phosphor || 'green';
}

function playGameSound(frequency, length, type, end) {
    if (!soundOn) return;
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + length);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + length);
}

function loadGameSector(index) {
    game.sector = index;
    game.map = [];
    game.enemies = [];
    game.pickups = [];
    game.shots = [];

    GAME_SECTORS[index].forEach((row, y) => {
        const cells = row.split('');
        cells.forEach((cell, x) => {
            const center = { x: x + 0.5, y: y + 0.5 };
            if (cell === 'P') {
                game.player.x = center.x;
                game.player.y = center.y;
                game.player.angle = 0.6;
            } else if (GAME_ENEMIES[cell]) {
                const type = GAME_ENEMIES[cell];
                game.enemies.push({ ...center, type, hp: type.hp, alerted: false, cooldown: 0.5, hit: 0, dying: 0, step: 0 });
            } else if (cell === 'm' || cell === 'a' || cell === 's') {
                game.pickups.push({ ...center, kind: { m: 'med', a: 'ammo', s: 'scrap' }[cell] });
            }
            if ('Phdbmas'.includes(cell)) cells[x] = '.';
        });
        game.map.push(cells);
    });

    setGameMessage(`Sector ${index + 1}: destroy every hostile, then reach the exit terminal.`);
    updateGameHud();
}

function isGameWall(x, y) {
    const row = game.map[Math.floor(y)];
    return !row || row[Math.floor(x)] !== '.';
}

function hasGameSight(a, b) {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.ceil(distance / 0.1);
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (isGameWall(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
    }
    return true;
}

function moveGameBody(body, dx, dy, radius) {
    const nextX = body.x + dx;
    const nextY = body.y + dy;
    const edgeX = nextX + Math.sign(dx) * radius;
    const edgeY = nextY + Math.sign(dy) * radius;
    if (!isGameWall(edgeX, body.y)) body.x = nextX;
    if (!isGameWall(body.x, edgeY)) body.y = nextY;
}

function setGameMessage(text) {
    if (gameMessage.textContent !== text) gameMessage.textContent = text;
}

function gameHostiles() {
    return game.enemies.filter(enemy => enemy.hp > 0).length;
}

function updateGameHud() {
    const player = game.player;
    document.getElementById('gameHp').style.width = `${Math.max(0, player.hp)}%`;
    document.getElementById('gameHpValue').textContent = Math.max(0, Math.ceil(player.hp));
    document.getElementById('gameAmmo').textContent = player.ammo;
    document.getElementById('gameScrap').textContent = player.scrap;
    document.getElementById('gameHostiles').textContent = gameHostiles();
    document.getElementById('gameSector').textContent = `${game.sector + 1}/${GAME_SECTORS.length}`;
}

function hurtGamePlayer(amount) {
    game.player.hp -= amount;
    gameStage.classList.remove('is-hurt');
    void gameStage.offsetWidth;
    gameStage.classList.add('is-hurt');
    playGameSound(180, 0.18, 'sawtooth', 70);
    updateGameHud();
    if (game.player.hp <= 0) endGame(false);
}

// Project a world position onto the screen, or null if it is behind the player
function projectGamePoint(thing) {
    const player = game.player;
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const planeX = -dirY * 0.66;
    const planeY = dirX * 0.66;
    const relX = thing.x - player.x;
    const relY = thing.y - player.y;
    const inverse = 1 / (planeX * dirY - dirX * planeY);
    const sideways = inverse * (dirY * relX - dirX * relY);
    const depth = inverse * (-planeY * relX + planeX * relY);
    if (depth <= 0.1) return null;
    return { depth, screenX: (GAME_W / 2) * (1 + sideways / depth) };
}

function gameWallDistanceAhead() {
    const player = game.player;
    const dx = Math.cos(player.angle);
    const dy = Math.sin(player.angle);
    for (let distance = 0; distance < 40; distance += 0.05) {
        if (isGameWall(player.x + dx * distance, player.y + dy * distance)) return distance;
    }
    return 40;
}

function fireGameWeapon() {
    const player = game.player;
    if (player.cooldown > 0) return;

    const hasAmmo = player.ammo > 0;
    player.cooldown = hasAmmo ? 0.3 : 0.45;
    player.flash = hasAmmo ? 0.07 : 0;
    player.recoil = 1;
    if (hasAmmo) player.ammo--;
    playGameSound(hasAmmo ? 520 : 150, hasAmmo ? 0.12 : 0.08, hasAmmo ? 'square' : 'triangle', 80);

    const reach = hasAmmo ? gameWallDistanceAhead() : 1.3;
    const damage = hasAmmo ? 15 : 6;
    let target = null;
    let nearest = reach;
    game.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const view = projectGamePoint(enemy);
        if (!view || view.depth >= nearest) return;
        const halfWidth = ((GAME_H / view.depth) * enemy.type.scale) / 2;
        if (Math.abs(view.screenX - GAME_W / 2) <= Math.max(halfWidth * 0.8, 6)) {
            target = enemy;
            nearest = view.depth;
        }
    });

    if (target) {
        target.hp -= damage;
        target.hit = 0.12;
        target.alerted = true;
        if (target.hp <= 0) {
            target.dying = 0.35;
            player.kills++;
            player.scrap += 10;
            playGameSound(300, 0.25, 'sawtooth', 40);
            if (gameHostiles() === 0) setGameMessage('Sector clear. Reach the exit terminal.');
        }
    }
    updateGameHud();
}

function updateGamePlayer(dt) {
    const player = game.player;
    const speed = 3 * dt;
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);

    if (gameInput.turnLeft) player.angle -= 2.4 * dt;
    if (gameInput.turnRight) player.angle += 2.4 * dt;

    const walk = (gameInput.forward ? 1 : 0) - (gameInput.back ? 1 : 0);
    const strafe = (gameInput.strafeRight ? 1 : 0) - (gameInput.strafeLeft ? 1 : 0);
    if (walk || strafe) {
        const scale = walk && strafe ? Math.SQRT1_2 : 1;
        moveGameBody(player, (dirX * walk - dirY * strafe) * speed * scale, (dirY * walk + dirX * strafe) * speed * scale, 0.25);
        player.bob += dt * 10;
    }

    player.cooldown = Math.max(0, player.cooldown - dt);
    player.flash = Math.max(0, player.flash - dt);
    player.recoil = Math.max(0, player.recoil - dt * 6);
    if (gameInput.fire) fireGameWeapon();

    game.pickups = game.pickups.filter(item => {
        if (Math.hypot(item.x - player.x, item.y - player.y) > 0.55) return true;
        if (item.kind === 'med' && player.hp >= 100) return true;
        if (item.kind === 'med') {
            player.hp = Math.min(100, player.hp + 30);
            setGameMessage('Med kit: +30 health.');
        } else if (item.kind === 'ammo') {
            player.ammo += 12;
            setGameMessage('Ammo: +12 rounds.');
        } else {
            player.scrap += 50;
            setGameMessage('Salvage: +50 scrap.');
        }
        playGameSound(700, 0.12, 'triangle', 1200);
        updateGameHud();
        return false;
    });

    const exit = findGameExit();
    if (Math.hypot(exit.x - player.x, exit.y - player.y) < 1.15) {
        if (gameHostiles() === 0) {
            advanceGameSector();
        } else if (game.time - game.notice > 2) {
            game.notice = game.time;
            setGameMessage(`Exit locked: ${gameHostiles()} hostiles remain.`);
        }
    }
}

function findGameExit() {
    for (let y = 0; y < game.map.length; y++) {
        const x = game.map[y].indexOf('X');
        if (x >= 0) return { x: x + 0.5, y: y + 0.5 };
    }
    return null;
}

function updateGameEnemies(dt) {
    const player = game.player;

    game.enemies.forEach(enemy => {
        enemy.hit = Math.max(0, enemy.hit - dt);
        if (enemy.hp <= 0) {
            enemy.dying = Math.max(0, enemy.dying - dt);
            return;
        }

        const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const sees = distance < 11 && hasGameSight(enemy, player);
        if (sees) enemy.alerted = true;
        if (!enemy.alerted) return;

        enemy.cooldown -= dt;
        if (distance > enemy.type.range * 0.8 || !sees) {
            const step = (enemy.type.speed * dt) / Math.max(distance, 0.01);
            moveGameBody(enemy, (player.x - enemy.x) * step, (player.y - enemy.y) * step, 0.3);
            enemy.step += dt * 6;
        }

        if (sees && distance <= enemy.type.range + 0.2 && enemy.cooldown <= 0) {
            enemy.cooldown = enemy.type.cooldown;
            if (enemy.type.ranged) {
                const speed = 5 / distance;
                game.shots.push({ x: enemy.x, y: enemy.y, vx: (player.x - enemy.x) * speed, vy: (player.y - enemy.y) * speed, damage: enemy.type.damage });
                playGameSound(240, 0.14, 'square', 600);
            } else {
                hurtGamePlayer(enemy.type.damage);
            }
        }
    });

    game.shots = game.shots.filter(shot => {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        if (isGameWall(shot.x, shot.y)) return false;
        if (Math.hypot(shot.x - player.x, shot.y - player.y) < 0.35) {
            hurtGamePlayer(shot.damage);
            return false;
        }
        return true;
    });
}

function renderGameBackground(dirX, dirY, planeX, planeY, boost) {
    const player = game.player;
    const half = GAME_H / 2;
    const leftX = dirX - planeX;
    const leftY = dirY - planeY;
    const stepScaleX = (planeX * 2) / GAME_W;
    const stepScaleY = (planeY * 2) / GAME_W;

    for (let y = half; y < GAME_H; y++) {
        const rowDistance = half / (y - half + 0.5);
        const stepX = rowDistance * stepScaleX;
        const stepY = rowDistance * stepScaleY;
        let floorX = player.x + rowDistance * leftX;
        let floorY = player.y + rowDistance * leftY;
        const light = Math.min(1, 1.5 / (1 + 0.4 * rowDistance)) + boost;
        const floorRow = y * GAME_W;
        const ceilingRow = (GAME_H - y - 1) * GAME_W;

        for (let x = 0; x < GAME_W; x++) {
            const check = (Math.floor(floorX) + Math.floor(floorY)) & 1;
            gamePixels[floorRow + x] = gamePalette[Math.min(63, ((check ? 0.2 : 0.13) * light * 63) | 0)];
            gamePixels[ceilingRow + x] = gamePalette[Math.min(63, ((check ? 0.08 : 0.11) * light * 63) | 0)];
            floorX += stepX;
            floorY += stepY;
        }
    }
}

function renderGameWalls(dirX, dirY, planeX, planeY, boost) {
    const player = game.player;

    for (let x = 0; x < GAME_W; x++) {
        const camera = (2 * x) / GAME_W - 1;
        const rayX = dirX + planeX * camera;
        const rayY = dirY + planeY * camera;
        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        const deltaX = Math.abs(1 / rayX);
        const deltaY = Math.abs(1 / rayY);
        const stepX = rayX < 0 ? -1 : 1;
        const stepY = rayY < 0 ? -1 : 1;
        let sideX = (rayX < 0 ? player.x - mapX : mapX + 1 - player.x) * deltaX;
        let sideY = (rayY < 0 ? player.y - mapY : mapY + 1 - player.y) * deltaY;
        let side = 0;
        let cell = '.';

        while (cell === '.') {
            if (sideX < sideY) {
                sideX += deltaX;
                mapX += stepX;
                side = 0;
            } else {
                sideY += deltaY;
                mapY += stepY;
                side = 1;
            }
            const row = game.map[mapY];
            cell = (row && row[mapX]) || '#';
        }

        const distance = Math.max(0.05, side === 0 ? sideX - deltaX : sideY - deltaY);
        gameDepth[x] = distance;

        const height = GAME_H / distance;
        const top = (GAME_H - height) / 2;
        const startY = Math.max(0, Math.ceil(top));
        const endY = Math.min(GAME_H, Math.ceil(top + height));
        const hit = side === 0 ? player.y + distance * rayY : player.x + distance * rayX;
        const texX = Math.min(GAME_TEX - 1, Math.floor((hit - Math.floor(hit)) * GAME_TEX));
        const texture = gameTextures[cell] || gameTextures['#'];
        let light = Math.min(1, 1.7 / (1 + 0.35 * distance)) * (side ? 0.72 : 1) + boost;
        if (cell === 'X') light = Math.max(light, 0.85);

        for (let y = startY; y < endY; y++) {
            const texY = Math.min(GAME_TEX - 1, Math.floor(((y - top) / height) * GAME_TEX));
            gamePixels[y * GAME_W + x] = gamePalette[Math.min(63, (texture[texY * GAME_TEX + texX] * light * 63) | 0)];
        }
    }
}

function renderGameSprite(view, sprite, scale, drop, bright) {
    const size = (GAME_H / view.depth) * scale;
    const left = view.screenX - size / 2;
    const top = GAME_H / 2 + (GAME_H / view.depth) * (0.5 + drop) - size;
    const startX = Math.max(0, Math.floor(left));
    const endX = Math.min(GAME_W, Math.ceil(left + size));
    const startY = Math.max(0, Math.floor(top));
    const endY = Math.min(GAME_H, Math.ceil(top + size));
    const light = Math.min(1, 1.9 / (1 + 0.3 * view.depth));

    for (let x = startX; x < endX; x++) {
        if (view.depth >= gameDepth[x]) continue;
        const texX = Math.min(SPRITE_SIZE - 1, Math.floor(((x - left) / size) * SPRITE_SIZE));
        for (let y = startY; y < endY; y++) {
            const texY = Math.min(SPRITE_SIZE - 1, Math.floor(((y - top) / size) * SPRITE_SIZE));
            const shade = sprite[texY * SPRITE_SIZE + texX];
            if (!shade) continue;
            const value = bright ? 1 : shade === 3 ? Math.max(light, 0.8) : GAME_SHADE[shade] * light;
            gamePixels[y * GAME_W + x] = gamePalette[Math.min(63, (value * 63) | 0)];
        }
    }
}

function renderGameSprites() {
    const things = [];
    game.pickups.forEach(item => things.push({ thing: item, sprite: gameSprites[item.kind], scale: 0.55, drop: 0.02 }));
    game.shots.forEach(shot => things.push({ thing: shot, sprite: gameSprites.shot, scale: 0.4, drop: -0.25, bright: true }));
    game.enemies.forEach(enemy => {
        if (enemy.hp <= 0 && enemy.dying <= 0) return;
        if (enemy.hp <= 0 && Math.floor(enemy.dying * 30) % 2) return;
        const names = enemy.type.sprites;
        const hover = enemy.type.ranged && enemy.type.scale < 1 ? Math.sin(game.time * 3 + enemy.x) * 0.04 : 0;
        things.push({ thing: enemy, sprite: gameSprites[names[Math.floor(enemy.step) % 2]], scale: enemy.type.scale, drop: enemy.type.drop + hover, bright: enemy.hit > 0 });
    });

    things
        .map(entry => ({ ...entry, view: projectGamePoint(entry.thing) }))
        .filter(entry => entry.view)
        .sort((a, b) => b.view.depth - a.view.depth)
        .forEach(entry => renderGameSprite(entry.view, entry.sprite, entry.scale, entry.drop, entry.bright));
}

function fillGameRect(x, y, width, height, value) {
    const level = gamePalette[Math.min(63, (value * 63) | 0)];
    for (let row = Math.max(0, y); row < Math.min(GAME_H, y + height); row++) {
        for (let column = Math.max(0, x); column < Math.min(GAME_W, x + width); column++) {
            gamePixels[row * GAME_W + column] = level;
        }
    }
}

function renderGameWeapon() {
    const player = game.player;
    const moving = reducedMotion ? 0 : Math.sin(player.bob);
    const x = Math.round(GAME_W / 2 + moving * 4);
    const y = Math.round(GAME_H - 44 + Math.abs(moving) * 3 + player.recoil * 6);

    fillGameRect(GAME_W / 2 - 1, GAME_H / 2 - 5, 2, 3, 1);
    fillGameRect(GAME_W / 2 - 1, GAME_H / 2 + 2, 2, 3, 1);
    fillGameRect(GAME_W / 2 - 6, GAME_H / 2 - 1, 3, 2, 1);
    fillGameRect(GAME_W / 2 + 3, GAME_H / 2 - 1, 3, 2, 1);

    if (player.flash > 0) {
        fillGameRect(x - 7, y - 14, 14, 10, 1);
        fillGameRect(x - 3, y - 20, 6, 6, 0.8);
    }

    fillGameRect(x - 6, y - 4, 12, 4, 0.75);
    fillGameRect(x - 9, y, 18, 15, 0.48);
    fillGameRect(x - 7, y + 2, 14, 3, 0.2);
    fillGameRect(x - 1, y + 7, 2, 4, 0.9);
    fillGameRect(x - 8, y + 15, 16, 30, 0.3);
    fillGameRect(x - 12, y + 24, 7, 20, 0.2);
    fillGameRect(x + 5, y + 24, 7, 20, 0.2);
}

function renderGame() {
    const current = document.documentElement.dataset.phosphor || 'green';
    if (current !== game.phosphor) buildGamePalette();

    const player = game.player;
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const planeX = -dirY * 0.66;
    const planeY = dirX * 0.66;
    const boost = player.flash > 0 ? 0.12 : 0;

    renderGameBackground(dirX, dirY, planeX, planeY, boost);
    renderGameWalls(dirX, dirY, planeX, planeY, boost);
    renderGameSprites();
    renderGameWeapon();
    gameContext.putImageData(gameImage, 0, 0);
}

function gameLoop(now) {
    const dt = Math.min(0.05, (now - game.last) / 1000);
    game.last = now;
    game.time += dt;

    updateGamePlayer(dt);
    if (game.state === 'running') updateGameEnemies(dt);
    if (game.state === 'running' || game.state === 'won' || game.state === 'dead') renderGame();
    if (game.state === 'running') game.frame = requestAnimationFrame(gameLoop);
}

function clearGameInput() {
    Object.keys(gameInput).forEach(name => {
        gameInput[name] = false;
    });
}

function setGameState(state) {
    game.state = state;
    document.body.dataset.game = state;
    cancelAnimationFrame(game.frame);
    gameOverlay.hidden = state === 'running';

    if (state === 'running') {
        game.last = performance.now();
        game.frame = requestAnimationFrame(gameLoop);
    } else {
        clearGameInput();
        if (document.pointerLockElement === gameCanvas) document.exitPointerLock();
    }
}

function showGameOverlay(title, text, button, showCta) {
    gameOverlayTitle.textContent = title;
    gameOverlayText.textContent = text;
    gameStartButton.textContent = button;
    gameCta.hidden = !showCta;
}

function requestGameMouse() {
    if (!window.matchMedia('(pointer: fine)').matches || !gameCanvas.requestPointerLock) return;
    try {
        const request = gameCanvas.requestPointerLock();
        if (request && request.catch) request.catch(() => {});
    } catch (e) {}
}

function startGame() {
    game.player = { x: 1.5, y: 1.5, angle: 0, hp: 100, ammo: 30, scrap: 0, kills: 0, cooldown: 0, flash: 0, recoil: 0, bob: 0 };
    game.time = 0;
    game.notice = 0;
    buildGamePalette();
    loadGameSector(0);
    setGameState('running');
    gameCanvas.focus({ preventScroll: true });
    requestGameMouse();
}

function resumeGame() {
    setGameState('running');
    gameCanvas.focus({ preventScroll: true });
    requestGameMouse();
}

function pauseGame() {
    if (game.state !== 'running') return;
    showGameOverlay('Paused', 'Your progress in this sector is safe.', 'Resume', false);
    setGameState('paused');
    if (location.hash === '#game') gameStartButton.focus({ preventScroll: true });
}

function advanceGameSector() {
    if (game.sector + 1 < GAME_SECTORS.length) {
        playGameSound(400, 0.3, 'triangle', 900);
        game.player.hp = Math.min(100, game.player.hp + 20);
        loadGameSector(game.sector + 1);
    } else {
        endGame(true);
    }
}

function formatGameTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function endGame(won) {
    const player = game.player;

    if (won) {
        const best = Number(readSetting('localStorage', 'bunkerBest')) || 0;
        const isBest = !best || game.time < best;
        if (isBest) saveSetting('localStorage', 'bunkerBest', String(game.time));
        showGameOverlay(
            'Bunker cleared',
            `Time ${formatGameTime(game.time)}${isBest ? ' (new best)' : `, best ${formatGameTime(best)}`}. ${player.kills} hostiles down, ${player.scrap} scrap salvaged.`,
            'Play again',
            true
        );
    } else {
        showGameOverlay('Signal lost', `You fell in sector ${game.sector + 1} with ${player.scrap} scrap salvaged.`, 'Try again', false);
    }

    setGameState(won ? 'won' : 'dead');
    if (location.hash === '#game') gameStartButton.focus({ preventScroll: true });
}

gameStartButton.addEventListener('click', function() {
    playTick();
    if (game.state === 'paused') resumeGame();
    else startGame();
});

document.addEventListener('keydown', function(e) {
    if (game.state !== 'running') return;
    if (e.code === 'Escape') {
        pauseGame();
        return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    const action = GAME_KEYS[e.code];
    if (action) {
        e.preventDefault();
        gameInput[action] = true;
    }
});

document.addEventListener('keyup', function(e) {
    const action = GAME_KEYS[e.code];
    if (action) gameInput[action] = false;
});

gameCanvas.addEventListener('mousedown', function(e) {
    if (game.state !== 'running') return;
    e.preventDefault();
    gameInput.fire = true;
    if (document.pointerLockElement !== gameCanvas) requestGameMouse();
});

document.addEventListener('mouseup', function() {
    gameInput.fire = false;
});

document.addEventListener('mousemove', function(e) {
    if (game.state === 'running' && document.pointerLockElement === gameCanvas) {
        game.player.angle += e.movementX * 0.0028;
    }
});

// Esc releases the mouse before a keydown arrives, so treat that as a pause too
document.addEventListener('pointerlockchange', function() {
    const locked = document.pointerLockElement === gameCanvas;
    if (game.locked && !locked) pauseGame();
    game.locked = locked;
});

document.querySelectorAll('[data-game-input]').forEach(button => {
    const action = button.dataset.gameInput;

    button.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        gameInput[action] = true;
        if (button.setPointerCapture) button.setPointerCapture(e.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => {
        button.addEventListener(name, () => {
            gameInput[action] = false;
        });
    });
    button.addEventListener('contextmenu', e => e.preventDefault());
});

window.addEventListener('hashchange', function() {
    if (location.hash !== '#game') pauseGame();
});

window.addEventListener('blur', pauseGame);

document.addEventListener('visibilitychange', function() {
    if (document.hidden) pauseGame();
});
