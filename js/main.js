var svgNS = "http://www.w3.org/2000/svg";
var draw;
var drawIdx = 0;
var minMouse;
var maxMouse;
var pathStyle = "stroke: rgb(255,0,0); stroke-width: 3; opacity: 0.5; cursor: auto";

var lineStart;

var d3Obj; // d3 이벤트용

document.getElementById("lineBtn").addEventListener('click', lineToggle);
document.getElementById("selectBtn").addEventListener('click', selectToggle);

function lineToggle() {
    document.getElementById("canvas").setAttribute("class", "lowLayer");
    document.getElementById("tmpCanvas").setAttribute("class", "highLayer");

    d3.select("#tmpCanvas")
    .on("mousedown", null)
    .on("mouseleave", null)
    .on("mouseup", null);

    d3.select("#canvas")
    .on("click", null)

    d3Obj = d3.select("#tmpCanvas")
    .on("mousedown", mousedown)
    .on("mouseleave", mouseleave)
    .on("mouseup", mouseup);
}

function selectToggle(){
    document.getElementById("canvas").setAttribute("class", "highLayer");
    document.getElementById("tmpCanvas").setAttribute("class", "lowLayer");

    d3.select("#tmpCanvas")
    .on("mousedown", null)
    .on("mouseleave", null)
    .on("mouseup", null);

    d3Obj = d3.select("#canvas")
    .on("click", mouseclick);
}


var lineFunction = d3.line()
    .x(function(d) { return d.x;})
    .y(function(d) { return d.y;})
    .curve(d3.curveLinear);

function mousedown() {
    var m = d3.mouse(this);
    lineStart = {"x": m[0], "y": m[1]};

    const tmpSvg = d3.create("svg");
    tmpSvg.attr("width", 1280)
        .attr("height", 720);

    draw = d3Obj.append(() => tmpSvg.node())
        .append("path")
        .attr("d", lineFunction([lineStart]))
        .attr("style", pathStyle);

    minMouse = [m[0], m[1]];
    maxMouse = [m[0], m[1]];
    d3Obj.on("mousemove", mousemove);
}

function mousemove() {
    var m = d3.mouse(this);
    var lineData = [
        lineStart,
        {"x" : m[0], "y" : m[1]}
    ];
    draw.attr("d", lineFunction(lineData));

    // pen 기준임. line이나 도형은 시작 끝만 비교할 것
    minMouse[0] = Math.min(minMouse[0], m[0]);
    minMouse[1] = Math.min(minMouse[1], m[1]);
    maxMouse[0] = Math.max(maxMouse[0], m[0]);
    maxMouse[1] = Math.max(maxMouse[1], m[1]);
}

function mouseup() {
    d3Obj.on("mousemove", null);
    const canvasElem = document.getElementById("canvas");

    const drawDiv = document.createElement('div');
    drawDiv.id = "draw_" + drawIdx;
    drawDiv.style.position = "absolute";

    const drawSvg = document.createElementNS(svgNS, 'svg');
    const viewBoxVal = "" + minMouse[0] + " " + minMouse[1] + " " + (maxMouse[0] - minMouse[0]) + " " + (maxMouse[1] - minMouse[1]);
    const drawSvgStyle = "left:" + minMouse[0] + "px; width: " + (maxMouse[0] - minMouse[0]) + "px; top: " + minMouse[1] + "px; height: " + (maxMouse[1] - minMouse[1]) + "px;" + pathStyle;
    drawSvg.setAttribute("class", "scaledSvg");
    drawSvg.setAttribute("viewBox", viewBoxVal);
    drawSvg.style = drawSvgStyle;

    const originSvg  = document.getElementById("tmpCanvas").lastElementChild;
    const originDraw = originSvg.lastElementChild;
    const copyDraw = originDraw.cloneNode(true);
    originSvg.remove();
    console.log(copyDraw);

    drawSvg.appendChild(copyDraw)
    drawDiv.appendChild(drawSvg)
    canvasElem.appendChild(drawDiv);

    ++drawIdx;
}

// 마우스가 구역 밖으로 나간 경우
function mouseleave() {
    d3Obj.on("mousemove", null);
}

function mouseclick() {
    console.log("hihi")
}