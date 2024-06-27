export function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
}

export function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.lineWIdth = 1;
    ctx.strokeStyle = "#000";
    ctx.stroke();
}
