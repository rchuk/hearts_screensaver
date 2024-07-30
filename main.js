const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static rgba(r, g, b, a) {
        return new Color(r, g, b, a);
    }

    static rgb(r, g, b) {
        return Color.rgba(r, g, b, 1);
    }

    static rgbaV(rgba) {
        return Color.rgba(rgba[0], rgba[1], rgba[2], rgba[3]);
    }

    static rgbV(rgb) {
        return Color.rgb(rgb[0], rgb[1], rgb[2]);
    }
}

class Aabb {
    constructor(pathPoints) {
        const sort = (cmp) => pathPoints.reduce((prev, curr) => cmp(prev, curr) ? prev : curr);
    
        this.points = [
            sort((prev, curr) => prev[0] < curr[0]),
            sort((prev, curr) => prev[0] > curr[0]),
            sort((prev, curr) => prev[1] < curr[1]),
            sort((prev, curr) => prev[1] > curr[1])
        ];
    }

    getMinX() {
        return this.points[0][0];
    }

    getMaxX() {
        return this.points[1][0];
    }

    getMinY() {
        return this.points[2][1];
    }
    
    getMaxY() {
        return this.points[3][1];
    }

    getSize() {
        return [
            this.getMaxX() - this.getMinX(),
            this.getMaxY() - this.getMinY()
        ];
    }
}

class Path {
    constructor(points) {
        const aabb = new Aabb(points);
        const newPoints = points.map(([x, y]) => [x - aabb.getMinX(), y - aabb.getMinY()]);
        this.aabb = new Aabb(newPoints);

        this.path = new Path2D();
        this.path.moveTo(newPoints[0][0], newPoints[0][1]);
        for (const point of newPoints.slice(1))
            this.path.lineTo(point[0], point[1]);
        this.path.closePath();
    }

    getRotatedSize(angle) {
        const size = this.getSize();
        const origin = [0.5 * size[0], 0.5 * size[1]];

        const rotatedAabb = new Aabb(this.aabb.points.map((p) => rotatePointV(p, origin, angle)));

        return rotatedAabb.getSize();
    }

    getSize() {
        return this.aabb.getSize();
    }
}

function degToRad(deg) {
    return deg * Math.PI / 180.0;
}

function rotatePoint(x, y, xOrigin, yOrigin, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const xDiff = x - xOrigin;
    const yDiff = y - yOrigin;

    return [
        xOrigin + cos * xDiff - sin * yDiff,
        yOrigin + sin * xDiff + cos * yDiff
    ];
}

function rotatePointV(pos, origin, angle) {
    return rotatePoint(pos[0], pos[1], origin[0], origin[1], angle);
}


function setColor(color) {
    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a * 255})`;
}

function draw(fn) {
    ctx.save();
    fn();
    ctx.restore();
}

function drawRotated(x, y, xOffset, yOffset, rotation, fn) {
    draw(() => {
        ctx.translate(x + xOffset, y + yOffset);
        ctx.rotate(rotation);
        ctx.translate(-xOffset, -yOffset);
        fn();
    });
}

function fillPathRotated(x, y, path, scale, rotation) {
    const [width, height] = path.getRotatedSize(rotation);
    
    drawRotated(x, y, 0.5 * width * scale, 0.5 * height * scale, rotation, () => {
        ctx.scale(scale, scale);
        ctx.fill(path.path)
    });
}

function fillRectRotated(x, y, width, height, rotation) {
    drawRotated(x, y, 0.5 * width, 0.5 * height, rotation, () => {
        ctx.fillRect(0, 0, width, height);
    });
}


function generateHeart() {
    const step = 0.01;

    const points = [];
    for (let t = -1.0; t <= 1.0; t += step) {
        const x = Math.sin(t) * Math.cos(t) * Math.log(Math.abs(t));
        const y = - Math.sqrt(Math.abs(t)) * Math.cos(t);

        points.push([x, y]);
    }

    return points;
}


function sin(x) {
    return Math.sin(x);
}

function sinNormalized(x) {
    return 0.5 * (Math.sin(x) + 1.0);
}


function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen({ navigationUI: "hide" })
            .catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

function main() {
    const heart = new Path(generateHeart());

    const dt = 1.0 / 60.0;
    const speed = 0.9;
    let time = 0;

    const heartScale = 100;
    const [heartWidth, heartHeight] = [heartScale * heart.getSize()[0], heartScale * heart.getSize()[1]];

    const tick = () => {
        setColor(Color.rgb(0, 0, 0));
        fillRectRotated(0, 0, canvas.width, canvas.height, 0.0);
    
        const xCount = Math.ceil(canvas.width / heartWidth);
        const yCount = Math.ceil(canvas.height / heartHeight);
    
        for (let yi = 0; yi < yCount; ++yi) {
            for (let xi = 0; xi < xCount; ++xi) {
                const scale = heartScale * (0.1 + 0.9 * sinNormalized(0.5 * xi * time)); 
                const x = (xi + 0.5 * (yi % 2)) * heartWidth;
                const y = ((yi + time) * heartHeight) % (canvas.height + heartHeight) - heartHeight;
                
                setColor(Color.rgb(0.5 + 0.5 * sinNormalized(2.0 * time), 0, 0.3 * sinNormalized(xi * yi)));
                fillPathRotated(x, y, heart, scale, 2 * sin(xi / xCount + time));
            }
        }
    };

    setInterval(() => {
        time += speed * dt;
        
        canvas.width = canvas.scrollWidth;
        canvas.height = canvas.scrollHeight;
     
        tick();
    }, dt * 1000);
}

main();
