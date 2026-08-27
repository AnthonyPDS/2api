import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const select = document.querySelector('#pll-select');
const algorithmEl = document.querySelector('#algorithm');
const caseBadge = document.querySelector('#case-badge');
const caseName = document.querySelector('#case-name');
const moveCount = document.querySelector('#move-count');
const stepLabel = document.querySelector('#step-label');
const faceState = document.querySelector('#face-state');
const playButton = document.querySelector('#play');
const speedInput = document.querySelector('#speed');
const API_URL = 'https://oneapi-yevz.onrender.com';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector('#scene').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 18;
controls.target.set(0, 0, 0);
camera.position.set(8, 8.5, 10);

scene.add(new THREE.HemisphereLight(0xf8fff9, 0x52615c, 2.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(-4, 8, 7);
keyLight.castShadow = true;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xffa67c, 1.3);
rimLight.position.set(7, 1, -5);
scene.add(rimLight);

const cubeRoot = new THREE.Group();
cubeRoot.position.x = -0.65;
scene.add(cubeRoot);
const cubies = [];
const colors = { right: 0xd94d38, left: 0xf28c35, top: 0xf6f0d0, bottom: 0xf2cf3c, front: 0x35a878, back: 0x3e78b8, inside: 0x253036 };
const materials = [
    new THREE.MeshStandardMaterial({ color: colors.right, roughness: .3 }),
    new THREE.MeshStandardMaterial({ color: colors.left, roughness: .3 }),
    new THREE.MeshStandardMaterial({ color: colors.top, roughness: .3 }),
    new THREE.MeshStandardMaterial({ color: colors.bottom, roughness: .3 }),
    new THREE.MeshStandardMaterial({ color: colors.front, roughness: .3 }),
    new THREE.MeshStandardMaterial({ color: colors.back, roughness: .3 })
];
const insideMaterial = new THREE.MeshStandardMaterial({ color: 0x586661, roughness: .4 });

for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
            const faceMaterials = [x === 1 ? materials[0] : insideMaterial, x === -1 ? materials[1] : insideMaterial, y === 1 ? materials[3] : insideMaterial, y === -1 ? materials[2] : insideMaterial, z === 1 ? materials[4] : insideMaterial, z === -1 ? materials[5] : insideMaterial];
            const cubie = new THREE.Mesh(new THREE.BoxGeometry(.95, .95, .95), faceMaterials);
            cubie.position.set(x * 1.02, y * 1.02, z * 1.02);
            cubie.castShadow = true;
            cubie.receiveShadow = true;
            cubie.userData.grid = { x, y, z };
            cubeRoot.add(cubie);
            cubies.push(cubie);
        }
    }
}

const moveDefinitions = {
    R: { axis: 'x', layer: 1, direction: -1 }, L: { axis: 'x', layer: -1, direction: 1 },
    U: { axis: 'y', layer: 1, direction: -1 }, D: { axis: 'y', layer: -1, direction: 1 },
    F: { axis: 'z', layer: 1, direction: -1 }, B: { axis: 'z', layer: -1, direction: 1 },
    M: { axis: 'x', layer: 0, direction: 1 }, E: { axis: 'y', layer: 0, direction: 1 }, S: { axis: 'z', layer: 0, direction: -1 }
};
const moveTokens = (algorithm) => algorithm.split(/\s+/).filter(Boolean);
const inverseTokens = (tokens) => tokens.slice().reverse().map((token) => {
    if (token.includes('2')) return token;
    return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
});
let currentAlgorithm = [];
let currentIndex = -1;
let playing = false;
let activeAnimation = null;

function resize() {
    const box = document.querySelector('#scene').getBoundingClientRect();
    renderer.setSize(box.width, box.height, false);
    camera.aspect = box.width / box.height;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

function resetCube() {
    cubies.forEach((cubie) => {
        cubeRoot.attach(cubie);
        const { x, y, z } = cubie.userData.grid;
        cubie.position.set(x * 1.02, y * 1.02, z * 1.02);
        cubie.rotation.set(0, 0, 0);
        cubie.quaternion.identity();
    });
    currentIndex = -1;
    activeAnimation = null;
    stepLabel.textContent = 'PRONTO';
    faceState.textContent = 'case setup';
    renderTokens();
}

async function setupCase() {
    resetCube();
    for (const token of inverseTokens(currentAlgorithm)) {
        applyMoveInstant(token);
    }
    currentIndex = -1;
    stepLabel.textContent = 'PRONTO';
    faceState.textContent = 'case setup';
    renderTokens();
}

function renderTokens() {
    algorithmEl.innerHTML = currentAlgorithm.map((token, index) => `<span class="move ${index === currentIndex ? 'active' : ''} ${index < currentIndex ? 'done' : ''}">${token}</span>`).join('');
    moveCount.textContent = `${currentAlgorithm.length} movimentos`;
}

async function selectCase(data) {
    currentAlgorithm = moveTokens(data.algorithm);
    caseBadge.textContent = data.name;
    caseName.textContent = `${data.name} perm`;
    resetCube();
    renderTokens();
}

function getSelected() {
    return fetch(`${API_URL}/pll/${encodeURIComponent(select.value)}`).then((response) => {
        if (!response.ok) throw new Error('PLL não encontrado');
        return response.json();
    });
}

function rotateGrid(grid, axis, direction) {
    const { x, y, z } = grid;
    if (axis === 'x') return { x, y: -direction * z, z: direction * y };
    if (axis === 'y') return { x: direction * z, y, z: -direction * x };
    return { x: -direction * y, y: direction * x, z };
}

function animateMove(token) {
    const baseToken = token[0].toUpperCase();
    const definition = moveDefinitions[baseToken];
    if (!definition) return Promise.resolve();
    const turns = token.includes('2') ? 2 : 1;
    const direction = definition.direction * (token.includes("'") ? -1 : 1);
    const selected = cubies.filter((cubie) => cubie.userData.grid[definition.axis] === definition.layer);
    const layer = new THREE.Group();
    cubeRoot.add(layer);
    selected.forEach((cubie) => layer.attach(cubie));
    const duration = 1180 - Number(speedInput.value);
    const start = performance.now();
    const angle = direction * Math.PI / 2 * turns;
    stepLabel.textContent = `MOVIMENTO ${currentIndex + 1} / ${currentAlgorithm.length}`;
    faceState.textContent = token;

    return new Promise((resolve) => {
        activeAnimation = { layer, selected, angle, start, duration, resolve, definition, direction, turns };
    });
}

function finishMove(animation) {
    animation.layer.rotation[animation.definition.axis] = animation.angle;
    animation.selected.forEach((cubie) => {
        cubeRoot.attach(cubie);
        let grid = cubie.userData.grid;
        for (let turn = 0; turn < animation.turns; turn += 1) grid = rotateGrid(grid, animation.definition.axis, animation.direction);
        cubie.userData.grid = grid;
        cubie.position.set(grid.x * 1.02, grid.y * 1.02, grid.z * 1.02);
    });
    cubeRoot.remove(animation.layer);
    activeAnimation = null;
    animation.resolve();
}

function applyMoveInstant(token) {
    const baseToken = token[0].toUpperCase();
    const definition = moveDefinitions[baseToken];
    if (!definition) return;
    const turns = token.includes('2') ? 2 : 1;
    const direction = definition.direction * (token.includes("'") ? -1 : 1);
    const selected = cubies.filter((cubie) => cubie.userData.grid[definition.axis] === definition.layer);
    const layer = new THREE.Group();
    cubeRoot.add(layer);
    selected.forEach((cubie) => layer.attach(cubie));
    const animation = { layer, selected, angle: direction * Math.PI / 2 * turns, definition, direction, turns, resolve: () => {} };
    finishMove(animation);
}

async function play() {
    if (playing) return;
    if (currentIndex >= currentAlgorithm.length - 1) await setupCase();
    playing = true;
    playButton.querySelector('span:last-child').textContent = 'Reproduzindo...';
    playButton.querySelector('.play-icon').textContent = 'Ⅱ';
    for (let index = 0; index < currentAlgorithm.length && playing; index += 1) {
        currentIndex = index;
        renderTokens();
        await animateMove(currentAlgorithm[index]);
        if (!playing) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    playing = false;
    if (!activeAnimation) {
        stepLabel.textContent = currentIndex === currentAlgorithm.length - 1 ? 'CONCLUÍDO' : 'PAUSADO';
        playButton.querySelector('span:last-child').textContent = 'Reproduzir algoritmo';
        playButton.querySelector('.play-icon').textContent = '▶';
    }
}

playButton.addEventListener('click', () => {
    if (playing) {
        playing = false;
        if (activeAnimation) finishMove(activeAnimation);
    } else play();
});
document.querySelector('#reset').addEventListener('click', () => { playing = false; setupCase().catch(console.error); });
select.addEventListener('change', () => getSelected().then(async (data) => { await selectCase(data); await setupCase(); }).catch(console.error));

fetch(`${API_URL}/pll`).then((response) => response.json()).then((data) => {
    data.plls.forEach((pll) => {
        const option = document.createElement('option');
        option.value = pll.name;
        option.textContent = `${pll.name} perm`;
        select.appendChild(option);
    });
    select.value = 'T';
    selectCase(data.plls.find((pll) => pll.name === 'T')).then(setupCase).catch(console.error);
}).catch(() => {
    caseName.textContent = 'API indisponível';
    stepLabel.textContent = 'ERRO DE CONEXÃO';
});

function tick(now) {
    if (activeAnimation) {
        const progress = Math.min((now - activeAnimation.start) / activeAnimation.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        activeAnimation.layer.rotation[activeAnimation.definition.axis] = activeAnimation.angle * eased;
        if (progress === 1) finishMove(activeAnimation);
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}
resize();
requestAnimationFrame(tick);
