const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let clockInterval = null;

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
function drawStar(){
    const xCenter = canvas.width / 2;
    const yCenter = canvas.height / 2;
    const height = canvas.height;
    const width = canvas.width;
    for (let i = 10; i <= 300; i += 10) {
        // Lineas del cuadrante inferior derecho
        drawLine(xCenter+i, yCenter, xCenter, height - i );
        // Lineas del cuadrante inferior izquierdo
        drawLine(xCenter-i, yCenter, xCenter, height - i );
        // Lineas del cuadrante superior derecho
        drawLine(xCenter+i, yCenter, xCenter, 0 + i );
        // Lineas del cuadrante superior izquierdo
        drawLine(xCenter-i, yCenter, xCenter, 0 + i );
    } 

}
// Funcion para dibujar lineas desde el centro del plano cada 10 grados
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
// =========================
// RELOJ (CORREGIDO)
// =========================

function drawClockFace(){

    const radius = 280;
    const cx = toCanvasX(0);
    const cy = toCanvasY(0);

    // circunferencia
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2*Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // números
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for(let i=1; i<=12; i++){

        let angle = i * 30 * Math.PI / 180;

        let x = cx + 240 * Math.cos(angle - Math.PI/2);
        let y = cy + 240 * Math.sin(angle - Math.PI/2);

        ctx.fillText(i, x, y);
    }

    // marcas de horas
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

    // SOLO limpiar pantalla (no detener reloj)
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

    // detener reloj
    if(clockInterval){
        clearInterval(clockInterval);
        clockInterval = null;
    }

    // limpiar pantalla
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // volver a dibujar el plano cartesiano
    drawCartesianPlane();
}


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

drawLine(
toCanvasX(x1),toCanvasY(y1),
toCanvasX(x2),toCanvasY(y2)
);

}


function drawRectanglePrompt(){

let x=parseInt(prompt("X"));
let y=parseInt(prompt("Y"));

let width=parseInt(prompt("Ancho"));
let height=parseInt(prompt("Alto"));

drawRectangle(
toCanvasX(x),
toCanvasY(y),
width,
height
);

}


function drawCirclePrompt(){

let x=parseInt(prompt("Centro X"));
let y=parseInt(prompt("Centro Y"));

let r=parseInt(prompt("Radio"));

drawCircle(
toCanvasX(x),
toCanvasY(y),
r
);

}


function drawTrianglePrompt(){

let x1=parseInt(prompt("X1"));
let y1=parseInt(prompt("Y1"));

let x2=parseInt(prompt("X2"));
let y2=parseInt(prompt("Y2"));

let x3=parseInt(prompt("X3"));
let y3=parseInt(prompt("Y3"));

drawTriangle(
toCanvasX(x1),toCanvasY(y1),
toCanvasX(x2),toCanvasY(y2),
toCanvasX(x3),toCanvasY(y3)
);

}


function drawPolygonPrompt(){

let points=[];

for(let i=1;i<=5;i++){

let x=parseInt(prompt("X del punto "+i));
let y=parseInt(prompt("Y del punto "+i));

points.push({
x:toCanvasX(x),
y:toCanvasY(y)
});

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

drawImage(
toCanvasX(x),
toCanvasY(y),
120,
120
);

}