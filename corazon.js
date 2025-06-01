// Corazón de partículas animadas
const canvas = document.getElementById('corazon');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Ajustar escala para que el corazón sea más pequeño y responsivo
function getHeartScale() {
    // El corazón ocupará como máximo el 40% del ancho o 40% del alto
    return Math.min(width, height) * 0.18 / 16; // 16 es el valor máximo de x en la fórmula
}

function heartFunction(t, scale = 1) {
    // Fórmula paramétrica de un corazón
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
        x: width / 2 + scale * x,
        y: height / 2 - scale * y
    };
}

const PARTICLE_COUNT = 2000; // Aumenta la cantidad de partículas
const particles = [];

// Generar partículas en el borde y dentro del corazón
for (let i = 0; i < PARTICLE_COUNT; i++) {
    let t, pos;
    const scale = getHeartScale();
    if (i < PARTICLE_COUNT * 0.15) {
        // Borde: t uniforme
        t = Math.random() * Math.PI * 2;
        pos = heartFunction(t, scale);
    } else {
        // Interior: t y r aleatorios, distribución UNIFORME en el área
        t = Math.random() * Math.PI * 2;
        let r = Math.cbrt(Math.random()); // Distribución aún más uniforme en el área
        let edge = heartFunction(t, scale);
        let center = { x: width / 2, y: height / 2 };
        pos = {
            x: center.x + (edge.x - center.x) * r,
            y: center.y + (edge.y - center.y) * r
        };
    }
    // Posición inicial: desde fuera de la pantalla
    let side = Math.floor(Math.random() * 4);
    let startX, startY;
    if (side === 0) { // arriba
        startX = Math.random() * width;
        startY = -40 - Math.random() * 100;
    } else if (side === 1) { // abajo
        startX = Math.random() * width;
        startY = height + 40 + Math.random() * 100;
    } else if (side === 2) { // izquierda
        startX = -40 - Math.random() * 100;
        startY = Math.random() * height;
    } else { // derecha
        startX = width + 40 + Math.random() * 100;
        startY = Math.random() * height;
    }
    particles.push({
        base: { ...pos },
        x: startX,
        y: startY,
        t,
        size: 1.2 + Math.random() * 0.7, // Partículas más pequeñas
        vx: 0,
        vy: 0,
        color: `rgba(220,30,70,${0.85 + Math.random() * 0.15})`,
        arriving: true,
        arrivalProgress: 0,
        arrivalDelay: Math.random() * 2.5 // Retardo aleatorio de hasta 2.5s
    });
}

let mouse = { x: width / 2, y: height / 2, active: false };
canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
});
canvas.addEventListener('mouseleave', () => mouse.active = false);
canvas.addEventListener('touchend', () => mouse.active = false);

// Movimiento de suspensión y alboroto para partículas
let t_global = 0;
let alboroto = false;
let alborotoTimer = 0;

function animate() {
    ctx.clearRect(0, 0, width, height);
    t_global += 0.016;
    let allArrived = true;
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        // Animación de llegada con retardo y velocidad variable
        if (p.arriving) {
            if (p.arrivalDelay > 0) {
                p.arrivalDelay -= 0.016;
                allArrived = false;
            } else {
                let speed = 0.002 + Math.random() * 0.006; // Mucho más lento y variable
                p.arrivalProgress += speed;
                if (p.arrivalProgress >= 1) {
                    p.arrivalProgress = 1;
                    p.arriving = false;
                } else {
                    allArrived = false;
                }
                // Interpolación desde el exterior hasta la posición base
                p.x = p.x * (1 - p.arrivalProgress) + p.base.x * p.arrivalProgress;
                p.y = p.y * (1 - p.arrivalProgress) + p.base.y * p.arrivalProgress;
            }
        } else {
            // Movimiento de suspensión sutil
            let susp = Math.sin(t_global * 1.1 + i) * 0.7 + Math.cos(t_global * 0.9 + i * 0.5) * 0.7;
            let bx = p.base.x + susp;
            let by = p.base.y + susp * 0.5;
            // Fuerza de repulsión del mouse/touch
            let dx = p.x - mouse.x;
            let dy = p.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let repulsion = 0;
            if (mouse.active && dist < 80) {
                repulsion = (80 - dist) / 80;
                let angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * repulsion * 1.5;
                p.vy += Math.sin(angle) * repulsion * 1.5;
            }
            // Alboroto: fuerza aleatoria
            if (alboroto) {
                p.vx += (Math.random() - 0.5) * 2.5;
                p.vy += (Math.random() - 0.5) * 2.5;
            }
            // Volver a la posición base (forma de corazón + suspensión)
            p.vx += (bx - p.x) * 0.015;
            p.vy += (by - p.y) * 0.015;
            // Fricción
            p.vx *= 0.85;
            p.vy *= 0.85;
            p.x += p.vx;
            p.y += p.vy;
        }
        // Dibujar partícula
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    // Alboroto dura poco
    if (alboroto) {
        alborotoTimer--;
        if (alborotoTimer <= 0) alboroto = false;
    }
    requestAnimationFrame(animate);
}

// Detectar click o toque mantenido para alboroto
let holdTimeout;
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
        alboroto = true;
        alborotoTimer = 30;
        clearTimeout(holdTimeout);
        holdTimeout = setTimeout(() => {
            alboroto = true;
            alborotoTimer = 60;
        }, 350);
    }
});
canvas.addEventListener('mouseup', () => {
    clearTimeout(holdTimeout);
});
canvas.addEventListener('mouseleave', () => {
    clearTimeout(holdTimeout);
});
canvas.addEventListener('touchstart', e => {
    alboroto = true;
    alborotoTimer = 30;
    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
        alboroto = true;
        alborotoTimer = 60;
    }, 350);
});
canvas.addEventListener('touchend', () => {
    clearTimeout(holdTimeout);
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const scale = getHeartScale();
    // Recalcular posiciones base
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let t = particles[i].t;
        let pos;
        if (i < PARTICLE_COUNT * 0.15) {
            pos = heartFunction(t, scale);
        } else {
            let edge = heartFunction(t, scale);
            let center = { x: width / 2, y: height / 2 };
            let r = Math.cbrt(Math.random()); // Igualar distribución al resize
            pos = {
                x: center.x + (edge.x - center.x) * r,
                y: center.y + (edge.y - center.y) * r
            };
        }
        particles[i].base = { ...pos };
    }
});

animate();
