const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, WON, PROPOSAL, END
let score = 0;
const WIN_SCORE = 25; // Hearts needed to fill the meter
let player;
let hearts = [];
let particles = []; // For effects
let animationId;
let loveMeter = document.getElementById('love-fill');

// DOM Elements
const startScreen = document.getElementById('start-screen');
const proposalScreen = document.getElementById('proposal-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const startBtn = document.getElementById('start-btn');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');

// Resize Handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
         player.y = canvas.height - 100;
    }
}
window.addEventListener('resize', resize);

// Player Object
class Player {
    constructor() {
        this.w = 100; // width
        this.h = 80;  // height
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 100;
        this.speed = 10;
        this.dx = 0;
    }

    draw() {
        // Draw a cute basket or cup (using simple shapes for now, can be improved or replaced with image)
        ctx.fillStyle = '#ff4d6d';
        
        // Simple semi-circle basket
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y, this.w/2, 0, Math.PI, false);
        ctx.fill();
        
        // Handle
        ctx.beginPath();
        ctx.strokeStyle = '#c9184a';
        ctx.lineWidth = 5;
        ctx.arc(this.x + this.w/2, this.y - 10, this.w/2, Math.PI, 0, false);
        ctx.stroke();
    }

    update() {
        this.x += this.dx;
        
        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    }
}

// Heart Object
class Heart {
    constructor() {
        this.size = Math.random() * 20 + 20; // 20-40px
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 4 + 5;
        this.color = `hsl(${Math.random() * 20 + 340}, 100%, 60%)`; // Pinkish/Red variations
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        let topCurveHeight = this.size * 0.3;
        ctx.moveTo(this.x, this.y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
            this.x, this.y, 
            this.x - this.size / 2, this.y, 
            this.x - this.size / 2, this.y + topCurveHeight
        );
        // bottom left curve
        ctx.bezierCurveTo(
            this.x - this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + this.size
        );
        // bottom right curve
        ctx.bezierCurveTo(
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + topCurveHeight
        );
        // top right curve
        ctx.bezierCurveTo(
            this.x + this.size / 2, this.y, 
            this.x, this.y, 
            this.x, this.y + topCurveHeight
        );
        ctx.fill();
    }

    update() {
        this.y += this.speed;
    }
}

// Particle Effect
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.life = 100;
        this.color = `rgba(255, 255, 255, 0.8)`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Input Handling
function handleInput(e) {
    if (!player) return;
    
    // Mouse / Touch
    if (e.type === 'mousemove' || e.type === 'touchmove') {
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        player.x = clientX - player.w / 2;
    }
}

window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, { passive: false });

// Game Functions
function spawnHeart() {
    if (Math.random() < 0.025) {
        hearts.push(new Heart());
    }
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    if (gameState === 'PLAYING') {
        player.update();
        player.draw();

        spawnHeart();

        hearts.forEach((heart, index) => {
            heart.update();
            heart.draw();

            // Collision Detection
            // Simple box-ish collision for now
            if (
                heart.y + heart.size > player.y &&
                heart.x > player.x &&
                heart.x < player.x + player.w
            ) {
                // Catch!
                hearts.splice(index, 1);
                score++;
                createParticles(heart.x, heart.y);
                updateScore();
                
                if (score >= WIN_SCORE) {
                    triggerProposal();
                }
            } else if (heart.y > canvas.height) {
                hearts.splice(index, 1); // Missed
            }
        });

        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(idx, 1);
        });
    }

    animationId = requestAnimationFrame(updateGame);
}

function createParticles(x, y) {
    for(let i=0; i<5; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateScore() {
    const percentage = (score / WIN_SCORE) * 100;
    loveMeter.style.width = `${percentage}%`;
}

function startGame() {
    const music = document.getElementById('bg-music');
    music.playbackRate = 1.25;
    music.volume = 0.5;
    music.play().catch(error => console.log("Audio play blocked until interaction."));
    
    resize();
    player = new Player();
    hearts = [];
    score = 0;
    updateScore();
    gameState = 'PLAYING';
    
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    
    updateGame();
}

// Event Listeners
startBtn.addEventListener('click', startGame);

yesBtn.addEventListener('click', () => {
    proposalScreen.classList.remove('active');
    proposalScreen.classList.add('hidden');
    celebrationScreen.classList.remove('hidden');
    celebrationScreen.classList.add('active');
    triggerConfetti(); // Optional: Implement confetti
});

// "No" button runs away
noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', moveNoButton);

// Array of funny words to cycle through
const funnyWords = ["NO", "Haat", "Nautanki", "TmseNaHoPayega", "PHD's", "GadheKILaat"];
let wordIndex = 0;

function moveNoButton() {
    // 1. Move to a random position
    const x = Math.random() * (window.innerWidth - noBtn.offsetWidth);
    const y = Math.random() * (window.innerHeight - noBtn.offsetHeight);
    
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;

    // 2. Change the text of the button
    // This will cycle through the list: No -> Haat -> Nautanki... and then back to No
    wordIndex = (wordIndex + 1) % funnyWords.length;
    noBtn.innerText = funnyWords[wordIndex];

    // 3. Optional: Add a little wiggle effect
    noBtn.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
}

function triggerProposal() {
    gameState = 'PROPOSAL';
    
    // Create background hearts for the proposal screen
    const bg = document.createElement('div');
    bg.className = 'proposal-bg-hearts';
    proposalScreen.appendChild(bg);

    for (let i = 0; i < 15; i++) {
        const h = document.createElement('div');
        h.className = 'bg-heart';
        h.innerHTML = '❤️';
        h.style.left = Math.random() * 100 + 'vw';
        h.style.top = '-50px';
        h.style.fontSize = (Math.random() * 20 + 20) + 'px';
        h.style.animationDuration = (Math.random() * 3 + 2) + 's';
        bg.appendChild(h);
    }

    setTimeout(() => {
        proposalScreen.classList.remove('hidden');
        proposalScreen.classList.add('active');
    }, 500);
}

function triggerConfetti() {
    const loopDuration = 10000; // 10 second cycle
    const stage1End = 3000;    // 0-3s: Side Crackers
    const stage2End = 7000;    // 3-7s: Heavy Rockets
    // 7-10s: Heart Rain

    const startTime = Date.now();

    const interval = setInterval(function() {
        const elapsed = (Date.now() - startTime) % loopDuration;

        // STAGE 1: 0-3s (Grand Side Bursts - "The Crackers")
        if (elapsed < stage1End) {
            const defaults = { startVelocity: 45, spread: 60, ticks: 100, zIndex: 0, particleCount: 15 };
            confetti({
                ...defaults,
                angle: 60,
                origin: { x: 0, y: 0.7 },
                colors: ['#ff4d6d', '#ffffff', '#ff8fa3']
            });
            confetti({
                ...defaults,
                angle: 120,
                origin: { x: 1, y: 0.7 },
                colors: ['#ff4d6d', '#ffffff', '#ff8fa3']
            });
        } 
        
        // STAGE 2: 3-7s (The Rocket Finale - Heavy Bursts)
        else if (elapsed < stage2End) {
            // Shoots multiple "rockets" from random bottom positions
            confetti({
                particleCount: 40, // High density for "Grand" feel
                spread: 100,
                origin: { x: Math.random(), y: 0.8 },
                startVelocity: 60,
                gravity: 0.8,
                drift: Math.random() - 0.5,
                colors: ['#ff0000', '#ffd700', '#ffffff', '#ff69b4'],
                scalar: 1.2 // Larger particles
            });
        } 
        
        // STAGE 3: 7-10s (Gentle Heart/Soft Rain)
        else {
            confetti({
                particleCount: 3,
                angle: 90,
                spread: 360,
                origin: { x: Math.random(), y: -0.2 },
                startVelocity: 10,
                gravity: 0.4,
                colors: ['#ffb3c1', '#ff4d6d'],
                shapes: ['circle'],
                ticks: 300
            });
        }
    }, 100); // Faster trigger (every 100ms) for a denser feel
}

// Grab the elements
const mainGif = document.getElementById('main-gif-trigger');
const cornerGif = document.getElementById('corner-gif-trigger');
const popup1 = document.getElementById('popup-1');
const popup2 = document.getElementById('popup-2');

// Function to handle the 6-second show time
function flashImage(overlay) {
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 6000); // 6 seconds
}

// Click Main GIF -> 1.png
mainGif.addEventListener('click', () => flashImage(popup1));

// Click Corner GIF -> 2.jpg
cornerGif.addEventListener('click', () => flashImage(popup2));

// Allow clicking the black background to close immediately
[popup1, popup2].forEach(p => {
    p.addEventListener('click', () => p.style.display = 'none');
});

// Initialize
resize();









