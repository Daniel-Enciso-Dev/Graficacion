const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let angleY = 0; 
let angleZ = 0;
let angleX = 0;
let clockInterval = null;
let starInterval = null;

// Variables Globales para la Pirámide de Base Cuadrada (4 caras laterales + base)
const half = 80; // Escala/tamaño de la pirámide
let pyramidVertices = [];
const pyramidFaces = [
    { indices: [3, 2, 1, 0], color: 'orange' }, // Base cuadrada
    { indices: [0, 1, 4],    color: 'red'    }, // Cara frontal
    { indices: [1, 2, 4],    color: 'yellow' }, // Cara derecha
    { indices: [2, 3, 4],    color: 'blue'   }, // Cara trasera
    { indices: [3, 0, 4],    color: 'green'  }  // Cara izquierda
];

// Arreglo de vértices tridimensionales para que la estrella gire perfectamente en 3D
let starVertices3D = [];

function drawCartesianPlane() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    // eje X
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(600, 300);
    ctx.stroke();

    // eje Y
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 600);
    ctx.stroke();

    ctx.font = "16px Arial";
    ctx.fillStyle = "black";

    // valores extremos eje X
    ctx.fillText("-300", 5, 320);
    ctx.fillText("300", 560, 320);

    // valores extremos eje Y
    ctx.fillText("300", 310, 20);
    ctx.fillText("-300", 305, 590);
}

drawCartesianPlane();

function toCanvasX(x){
    return 300 + x;
}

function toCanvasY(y){
    return 300 - y;
}

function drawPoint(x, y, radius = 3, color = 'red') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLine(x1, y1, x2, y2, color = 'black', width = 2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

function drawRectangle(x, y, width, height, color = 'black') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color = 'black') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTriangle(x1, y1, x2, y2, x3, y3,  fillColor = null, strokeColor = 'black', width = 2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.lineWidth = width;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
}

function drawPolygon(points, fillColor = null, strokeColor = 'black', width = 2) {
    if (points.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    ctx.lineWidth = width;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
}

function drawText(text, x, y, color = 'black', font = '20px Arial') {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x, y);
}

function drawImage(x, y, width, height) {
    const img = new Image();
    img.src = './images/imagen1.jpg';
    img.onload = () => {
        ctx.drawImage(img, x, y, width, height);
    }
}

// ========================================================
// NUEVO NÚCLEO MATEMÁTICO 3D (PROYECCIÓN Y ROTACIÓN REAL)
// ========================================================
function project3D(vertex, cx, cy) {
    return {
        x: cx + vertex.x,
        y: cy - vertex.y,  // Matematica Y(+) arriba, Canvas Y(+) abajo
        z: vertex.z
    };
}

function rotatePoint3D(p, cx, cy, cz, axis, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let x = p.x - cx, y = p.y - cy, z = p.z - cz;
    let xRot, yRot, zRot;

    if (axis === 'Z') {
        xRot = x * cos - y * sin;
        yRot = x * sin + y * cos;
        zRot = z;
    } else if (axis === 'X') {
        xRot = x;
        yRot = y * cos - z * sin;
        zRot = y * sin + z * cos;
    } else { // 'Y'
        xRot = x * cos + z * sin;
        yRot = y;
        zRot = -x * sin + z * cos;
    }
    return { x: xRot + cx, y: yRot + cy, z: zRot + cz };
}

function convexHull2D(pts) {
    if (pts.length < 3) return pts.slice();
    let lo = 0;
    for (let i = 1; i < pts.length; i++)
        if (pts[i].x < pts[lo].x || (pts[i].x === pts[lo].x && pts[i].y < pts[lo].y)) lo = i;
    const hull = [];
    let cur = lo;
    do {
        hull.push(pts[cur]);
        let nxt = (cur + 1) % pts.length;
        for (let i = 0; i < pts.length; i++) {
            const cross = (pts[nxt].x - pts[cur].x) * (pts[i].y - pts[cur].y)
                        - (pts[nxt].y - pts[cur].y) * (pts[i].x - pts[cur].x);
            if (cross < 0) nxt = i;
        }
        cur = nxt;
    } while (cur !== lo && hull.length <= pts.length);
    return hull;
}

// ========================================================
// CONTROL Y RENDERIZADO DE LA PIRÁMIDE 3D
// ========================================================
function initPyramid() {
    pyramidVertices = [
        { x: -half, y: -half, z: -half }, // 0
        { x:  half, y: -half, z: -half }, // 1
        { x:  half, y: -half, z:  half }, // 2
        { x: -half, y: -half, z:  half }, // 3
        { x: 0,     y:  half, z: 0     }  // 4: Cúspide
    ];
}

function drawPyramid() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    if(pyramidVertices.length === 0) initPyramid();

    const facesToDraw = pyramidFaces.map(face => {
        const projected = face.indices.map(i => project3D(pyramidVertices[i], cx, cy));
        const avgZ = projected.reduce((sum, p) => sum + p.z, 0) / projected.length;
        return { face, projected, avgZ };
    });
    
    facesToDraw.sort((a, b) => a.avgZ - b.avgZ);
    for (const { face, projected } of facesToDraw) {
        drawPolygon(projected, face.color, 'black', 1);
    }
}

function rotatePyramid(axis, angle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCartesianPlane();
    if(pyramidVertices.length === 0) initPyramid();
    pyramidVertices = pyramidVertices.map(v => rotatePoint3D(v, 0, 0, 0, axis, angle));
    drawPyramidShadow(); // Dibuja la pirámide calculando su sombra proyectada en el piso
}

function drawPyramidShadow() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const light = { x: -200, y: 400, z: -150 };
    const groundY = -(half + 80);

    const shadowPts = pyramidVertices.map(v => {
        const dy = v.y - light.y;
        if (Math.abs(dy) < 0.001) return null;
        const t = (groundY - light.y) / dy;
        if (t < 0) return null;
        const sx = light.x + t * (v.x - light.x);
        const sz = light.z + t * (v.z - light.z);
        return {
            x: cx + sx + sz * 0.3,
            y: (cy - groundY) - sz * 0.2
        };
    }).filter(p => p !== null);

    if (shadowPts.length >= 3) {
        const hull = convexHull2D(shadowPts);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Dibujar indicador de luz
    ctx.save();
    ctx.beginPath();
    ctx.arc(Math.max(8, Math.min(canvas.width - 8, cx + light.x)), Math.max(8, Math.min(canvas.height - 8, cy - light.y)), 7, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.strokeStyle = 'orange';
    ctx.stroke();
    ctx.restore();

    // Dibujar pirámide
    drawPyramid();
}

// ========================================================
// SISTEMA DE LA ESTRELLA REPARADO BASADO EN LA PIRÁMIDE 3D
// ========================================================
function initStarVertices3D() {
    starVertices3D = [];
    // Mapeamos los extremos fijos de cada una de las líneas originales en un espacio 3D real
    for (let i = 10; i <= 300; i += 10) {
        starVertices3D.push({
            lines: [
                { p1: {x: i, y: 0, z: 0},  p2: {x: 0, y: 300 - i, z: 0} },  // Cuadrante superior der
                { p1: {x: -i, y: 0, z: 0}, p2: {x: 0, y: 300 - i, z: 0} },  // Cuadrante superior izq
                { p1: {x: i, y: 0, z: 0},  p2: {x: 0, y: -300 + i, z: 0} }, // Cuadrante inferior der
                { p1: {x: -i, y: 0, z: 0}, p2: {x: 0, y: -300 + i, z: 0} }  // Cuadrante inferior izq
            ]
        });
    }
}

function drawStarRotated() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (starVertices3D.length === 0) initStarVertices3D();

    // Iteramos y proyectamos dinámicamente cada línea del arreglo 3D al plano del canvas
    starVertices3D.forEach(group => {
        group.lines.forEach(line => {
            const projP1 = project3D(line.p1, cx, cy);
            const projP2 = project3D(line.p2, cx, cy);
            drawLine(projP1.x, projP1.y, projP2.x, projP2.y, 'black', 1);
        });
    });
}

function rotateStarVertices(axis, angleDeg) {
    if (starVertices3D.length === 0) initStarVertices3D();
    // Rotamos matemáticamente todos los puntos tridimensionales internos del objeto
    starVertices3D = starVertices3D.map(group => {
        return {
            lines: group.lines.map(line => {
                return {
                    p1: rotatePoint3D(line.p1, 0, 0, 0, axis, angleDeg),
                    p2: rotatePoint3D(line.p2, 0, 0, 0, axis, angleDeg)
                };
            })
        };
    });
}

function drawStar(){
    // Reinicia la estrella al estado plano original y la dibuja
    initStarVertices3D();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCartesianPlane();
    drawStarRotated();
}

function rotateStar(){
    if(starInterval) return;

    starInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawCartesianPlane();

        // Ejecuta una rotación automática combinada en X e Y para lucir el verdadero comportamiento 3D
        rotateStarVertices('X', 2);
        rotateStarVertices('Y', 1);
        drawStarRotated();
    }, 50);
}

function rotateStarStep(){
    // Rotación manual de 5 grados continuos en el eje X
    rotateStarVertices('X', 5);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCartesianPlane();
    drawStarRotated();
}

function rotateStarY(){
    // Rotación manual de 5 grados continuos en el eje Y (Giro de moneda)
    rotateStarVertices('Y', 5);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCartesianPlane();
    drawStarRotated();
}

function rotateStarZ(){
    // Rotación manual de 5 grados continuos en el eje Z (Giro de manecilla de reloj)
    rotateStarVertices('Z', 5);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCartesianPlane();
    drawStarRotated();
}

// ========================================================
// CIRCULO MATEMÁTICO, RELOJ Y PROMPTS
// ========================================================
function drawCircleWithMath() {
    const radius = 300;
    const cx = toCanvasX(0);
    const cy = toCanvasY(0);

    for (let degrees = 0; degrees < 360; degrees += 10) {
        const angle = degrees * Math.PI / 180;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        drawLine(cx, cy, x, y, 'red', 2);
    }
}

function drawClockFace(){
    const radius = 280;
    const cx = toCanvasX(0);
    const cy = toCanvasY(0);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2*Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for(let i=1; i<=12; i++){
        let angle = i * 30 * Math.PI / 180;
        let x = cx + 240 * Math.cos(angle - Math.PI/2);
        let y = cy + 240 * Math.sin(angle - Math.PI/2);
        ctx.fillText(i, x, y);
    }

    for(let i=0; i<360; i+=30){
        let angle = i * Math.PI / 180;
        let x1 = cx + 260 * Math.cos(angle);
        let y1 = cy + 260 * Math.sin(angle);
        let x2 = cx + 280 * Math.cos(angle);
        let y2 = cy + 280 * Math.sin(angle);
        drawLine(x1, y1, x2, y2, "black", 3);
    }
}

function drawHand(cx, cy, angle, length, color, width) {
    const x = cx + length * Math.cos(angle - Math.PI/2);
    const y = cy + length * Math.sin(angle - Math.PI/2);
    drawLine(cx, cy, x, y, color, width);
}

function drawClock() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawClockFace();

    const cx = toCanvasX(0);
    const cy = toCanvasY(0);
    const now = new Date();

    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;

    const secondAngle = seconds * 6 * Math.PI / 180;
    const minuteAngle = minutes * 6 * Math.PI / 180;
    const hourAngle = (hours * 30 + minutes * 0.5) * Math.PI / 180;

    drawHand(cx, cy, hourAngle,150,"black",6);
    drawHand(cx, cy, minuteAngle,220,"blue",4);
    drawHand(cx, cy, secondAngle,260,"red",2);
}

function startClock(){
    if(clockInterval) return;
    drawClock();
    clockInterval = setInterval(drawClock,1000);
}

function clearCanvas(){
    if(clockInterval){
        clearInterval(clockInterval);
        clockInterval = null;
    }
    if(starInterval){
        clearInterval(starInterval);
        starInterval = null;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCartesianPlane();
}

// Prompts e inputs
function drawPointPrompt(){
    let x=parseInt(prompt("Ingrese X (-300 a 300)"));
    let y=parseInt(prompt("Ingrese Y (-300 a 300)"));
    drawPoint(toCanvasX(x),toCanvasY(y));
}

function drawLinePrompt(){
    let x1=parseInt(prompt("X1"));
    let y1=parseInt(prompt("Y1"));
    let x2=parseInt(prompt("X2"));
    let y2=parseInt(prompt("Y2"));
    drawLine(toCanvasX(x1),toCanvasY(y1),toCanvasX(x2),toCanvasY(y2));
}

function drawRectanglePrompt(){
    let x=parseInt(prompt("X"));
    let y=parseInt(prompt("Y"));
    let width=parseInt(prompt("Ancho"));
    let height=parseInt(prompt("Alto"));
    drawRectangle(toCanvasX(x),toCanvasY(y),width,height);
}

function drawCirclePrompt(){
    let x=parseInt(prompt("Centro X"));
    let y=parseInt(prompt("Centro Y"));
    let r=parseInt(prompt("Radio"));
    drawCircle(toCanvasX(x),toCanvasY(y),r);
}

function drawTrianglePrompt(){
    let x1=parseInt(prompt("X1"));
    let y1=parseInt(prompt("Y1"));
    let x2=parseInt(prompt("X2"));
    let y2=parseInt(prompt("Y2"));
    let x3=parseInt(prompt("X3"));
    let y3=parseInt(prompt("Y3"));
    drawTriangle(toCanvasX(x1),toCanvasY(y1),toCanvasX(x2),toCanvasY(y2),toCanvasX(x3),toCanvasY(y3));
}

function drawPolygonPrompt(){
    let points=[];
    for(let i=1;i<=5;i++){
        let x=parseInt(prompt("X del punto "+i));
        let y=parseInt(prompt("Y del punto "+i));
        points.push({ x:toCanvasX(x), y:toCanvasY(y) });
    }
    drawPolygon(points);
}

function drawTextPrompt(){
    let text=prompt("Ingrese el texto");
    let x=parseInt(prompt("X"));
    let y=parseInt(prompt("Y"));
    drawText(text,toCanvasX(x),toCanvasY(y));
}

function drawImagePrompt(){
    let x=parseInt(prompt("X"));
    let y=parseInt(prompt("Y"));
    drawImage(toCanvasX(x),toCanvasY(y),120,120);
}