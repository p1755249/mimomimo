// 游戏状态
let scene, camera, renderer, controls;
let player, cars = [], road;
let gltfLoader;
let carTemplate = null; // 预加载的车辆模板
let gameState = {
    score: 0,
    lives: 3,
    isGameOver: false,
    isMoving: false,
    playerSpeed: 0.1,
    carSpeed: 0.05
};

// 初始化Three.js场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 简单的天空蓝背景
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    
    // 创建渲染器
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // 添加光照
    setupLighting();
    
    // 初始化GLTF加载器
    gltfLoader = new THREE.GLTFLoader();
    
    // 创建场景元素
    createRoad();
    createPlayer();
    
    // 异步创建车辆（加载3D模型）
    createCarsWithModels();
    
    // 设置事件监听
    setupEventListeners();
    
    // 开始游戏循环
    animate();
}

// 设置光照
function setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
}

// 创建马路（使用3D模型）
function createRoad() {
    // 使用街道卡通模块化模型作为马路
    const roadModelPath = './street_cartoon_modular.glb';
    
    loadSketchfabModel(roadModelPath, function(model) {
        road = model;
        
        // 调整马路模型的位置和大小
        road.position.set(0, 0, 0);
        road.scale.set(2.0, 2.0, 2.0); // 调整马路大小
        road.rotation.x = 0; // 修正旋转方向，平铺在地面上
        
        scene.add(road);
    });
}

// 创建人物（使用3D模型）
function createPlayer() {
    // 加载猫咪模型作为人物
    const playerModelPath = './oiiaioooooiai_cat.glb';
    
    loadSketchfabModel(playerModelPath, function(model) {
        player = model;
        
        // 调整猫咪模型的位置和大小
        player.position.set(0, 0.5, -20); // 调整起始位置，从马路边缘开始
        player.scale.set(4.0, 4.0, 4.0); // 调大人物尺寸
        
        // 确保模型朝向正确
        player.rotation.y = 0; // 面向马路方向
        
        scene.add(player);
        console.log('猫咪模型加载成功，大小:', player.scale);
    });
}

// 创建车辆（使用3D模型）
function createCarsWithModels() {
    // 使用街道卡通模块化模型作为车辆
    const carModelPath = './pony_cartoon.glb';
    
    // 预加载车辆模板
    loadSketchfabModel(carModelPath, function(template) {
        carTemplate = template.clone(); // 克隆模板用于快速创建
        
        // 持续创建车辆的函数
        function createCar() {
            if (carTemplate) {
                // 限制车辆数量，最多20辆
                if (cars.length >= 20) {
                    // 移除最旧的车辆
                    const oldCar = cars.shift();
                    scene.remove(oldCar);
                }
                
                const car = carTemplate.clone(); // 使用克隆的模板
                
                // 调整车辆模型的位置和大小
                car.position.set(
                    -20 , // 从左侧开始
                    0.3, // 调整高度
                    (Math.random() - 0.5) * 16 // 沿马路宽度方向分布
                );
                
                // 调整车辆的大小
                car.scale.set(0.6, 0.6, 0.6);
                
                // 设置车辆朝向与马路一致（沿Z轴方向移动）
                car.rotation.y = Math.PI / 2; // 90度旋转，让车辆朝向马路方向
                
                car.userData = { speed: gameState.carSpeed + Math.random() * 0.02 };
                cars.push(car);
                scene.add(car);
            }
        }
        
        // 每1秒创建一辆车，持续不断
        setInterval(createCar, 1000);
    });
}


// 加载3D模型
function loadSketchfabModel(modelPath, callback) {
    if (!modelPath) {
        console.error('没有提供模型路径');
        return;
    }
    
    gltfLoader.load(
        modelPath,
        function(gltf) {
            const model = gltf.scene;
            
            // 启用阴影
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


// 设置事件监听
function setupEventListeners() {
    // 鼠标按下
    document.addEventListener('mousedown', () => {
        if (!gameState.isGameOver) {
            gameState.isMoving = true;
        }
    });
    
    // 鼠标松开
    document.addEventListener('mouseup', () => {
        gameState.isMoving = false;
    });
    
    // 触摸事件
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
    
    // 窗口大小调整
    window.addEventListener('resize', onWindowResize);
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 更新游戏逻辑
function updateGame() {
    if (gameState.isGameOver) return;
    
    // 移动人物
    if (gameState.isMoving) {
        player.position.z += gameState.playerSpeed; // 保持原来的Z轴移动
        
        // 检查是否到达终点
        if (player.position.z > 8) {
            gameState.score += 100;
            updateUI();
            showSuccessMessage();
            resetPlayer();
        }
    }
    
    // 移动车辆
    cars.forEach(car => {
        car.position.x += car.userData.speed; // 沿X轴移动，与人物形成交叉
        
        // 车辆到达右侧后自动被移除（通过数量限制机制）
        
        // 检查碰撞
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

// 检查碰撞
function checkCollision(player, car) {
    const distance = player.position.distanceTo(car.position);
    return distance < 2;
}

// 重置人物位置
function resetPlayer() {
    if (player) {
        player.position.set(0, 0.5, -20); // 重置到马路边缘起始位置
    }
    gameState.isMoving = false;
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

// 显示成功消息
function showSuccessMessage() {
    // 创建成功提示元素
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    successDiv.innerHTML = '🎉 成功过马路！<br>+100 分';
    
    document.body.appendChild(successDiv);
    
    // 2秒后自动消失
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 2000);
}

// 游戏结束
function gameOver() {
    gameState.isGameOver = true;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'block';
}

// 重新开始游戏
function restartGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.isGameOver = false;
    gameState.isMoving = false;
    
    resetPlayer();
    updateUI();
    document.getElementById('gameOver').style.display = 'none';
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    updateGame();
    
    renderer.render(scene, camera);
}

// 启动游戏
init();
