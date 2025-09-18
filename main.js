let scene, camera, renderer, controls;
let player, cars = [], road;
let gltfLoader;
let carTemplate = null; 
let gameState = {
    score: 0,
    lives: 3,
    isGameOver: false,
    isMoving: false,
    playerSpeed: 0.1,
    carSpeed: 0.05
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);
    renderer.outputEncoding = THREE.sRGBEncoding;

    setupLighting();
    

    gltfLoader = new THREE.GLTFLoader();
    
    createRoad();
    createPlayer();
    createCarsWithModels();
    setupEventListeners();
    animate();
}

// 设置光照
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);
}

//路
function createRoad() {
    const roadModelPath = './street_cartoon_modular/scene.gltf';
    
    loadSketchfabModel(roadModelPath, function(model) {
        road = model;
        road.position.set(0, 0, 0);
        road.scale.set(2.0, 2.0, 2.0); 
        road.rotation.x = 0; 
        scene.add(road);
    });
}

//猫
function createPlayer() {
    const playerModelPath = './oiiaioooooiai_cat/scene.gltf';
    loadSketchfabModel(playerModelPath, function(model) {
        player = model;
        player.position.set(10, 0.5, -20); 
        player.scale.set(4.0, 4.0, 4.0); 
        player.rotation.y = 0; 
        scene.add(player);
        console.log('猫咪模型加载成功，大小:', player.scale);
    });
}

// 车
function createCarsWithModels() {
    const carModelPath = './pony_cartoon/scene.gltf';
    loadSketchfabModel(carModelPath, function(template) {
        carTemplate = template.clone(); 
        function createCar() {
            if (carTemplate) {
                if (cars.length >= 20) {
                }
                const car = carTemplate.clone(); 
                car.position.set( -20 ,  0.3 ,(Math.random() - 0.5) * 16);
                car.scale.set(1, 1, 1);
                car.rotation.y = Math.PI / 2; 
                car.userData = { speed: gameState.carSpeed + Math.random() * 0.02 };
                cars.push(car);
                scene.add(car);
            }
        }
        setInterval(createCar, 1000);
    });
}


function loadSketchfabModel(modelPath, callback) {
    if (!modelPath) {
        console.error('没有提供模型路径');
        return;
    }
    
    gltfLoader.load(
        modelPath,
        function(gltf) {
            const model = gltf.scene;
            //阴影
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            callback(model);
        },
        function(progress) {
            console.log('模型加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        function(error) {
            console.error('模型加载失败:', error);
            console.error('请确保模型文件存在:', modelPath);
        }
    );
}

//互动
function setupEventListeners() {
    document.addEventListener('mousedown', () => {
        if (!gameState.isGameOver) {
            gameState.isMoving = true;
        }
    });
    document.addEventListener('mouseup', () => {
        gameState.isMoving = false;
    });
    document.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameState.isGameOver) {
            gameState.isMoving = true;
        }
    });
    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.isMoving = false;
    });
    window.addEventListener('resize', onWindowResize);
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function updateGame() {
    if (gameState.isGameOver) return;
    
    if (gameState.isMoving) {
        player.position.z += gameState.playerSpeed;
        
        if (player.position.z > 8) {
            gameState.score += 100;
            updateUI();
            showSuccessMessage();
            resetPlayer();
        }
    }
    
    cars.forEach(car => {
        car.position.x += car.userData.speed; 
        
        
        if (checkCollision(player, car)) {
            gameState.lives--;
            updateUI();
            
            if (gameState.lives <= 0) {
                gameOver();
            } else {
                resetPlayer();
            }
        }
    });
}


function checkCollision(player, car) {
    const distance = player.position.distanceTo(car.position);
    return distance < 2;
}

function resetPlayer() {
    if (player) {
        player.position.set(10, 0.5, -20); 
    }
    gameState.isMoving = false;
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}


function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        top: 50%;
        left: 50%;
        background: rgba(0, 255, 0, 0.9);
        color: white;
        font-size: 24px;
        text-align: center;
    `;
    successDiv.innerHTML = '成功';
    
    document.body.appendChild(successDiv);
    
}


function gameOver() {
    gameState.isGameOver = true;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'block';
}


function animate() {
    requestAnimationFrame(animate);
    
    updateGame();
    
    renderer.render(scene, camera);
}


init();
