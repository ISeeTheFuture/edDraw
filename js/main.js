var svgNS = "http://www.w3.org/2000/svg";
var draw;
var drawIdx = 0;

var minMouse;
var maxMouse;
var storedMouseX;
var storedMouseY;

var viewboxX;
var viewboxY;
var viewboxWidth;
var viewboxHeight;

var pathStyle = "stroke: rgb(255,0,0); stroke-width: 3; opacity: 0.5;";

var lineStart;

var d3Obj; // d3 이벤트용

document.getElementById("lineBtn").addEventListener('click', lineToggle);
document.getElementById("selectBtn").addEventListener('click', selectToggle);

function lineToggle() {
    document.getElementById("canvas").setAttribute("class", "lowLayer");
    document.getElementById("tmpCanvas").setAttribute("class", "highLayer");

    d3.select("#tmpCanvas")
    .on("mousedown", null)
    // .on("mouseleave", null)
    .on("mouseup", null);

    d3.selectAll(".scaledSvg")
    .on("click", null)
    .on("mousedown", null)
    // .on("mouseleave", null)
    .on("mouseup", null)
    .classed("selected", false);

    d3Obj = d3.select("#tmpCanvas")
    .on("mousedown", drawStart)
    // .on("mouseleave", mouseleave)
    .on("mouseup", drawEnd);
}

function selectToggle(){
    document.getElementById("canvas").setAttribute("class", "highLayer");
    document.getElementById("tmpCanvas").setAttribute("class", "lowLayer");

    d3.select("#tmpCanvas")
    .on("mousedown", null)
    // .on("mouseleave", null)
    .on("mouseup", null);

    d3Obj = d3.selectAll(".scaledSvg")
    .on("click", selectSvg)
    .on("mousedown", moveStart)
    // .on("mouseleave", mouseleave)
    .on("mouseup", moveEnd);
}

function resizeOn() {
    document.getElementById("canvas").setAttribute("class", "lowLayer");
    document.getElementById("tmpCanvas").setAttribute("class", "highLayer");
}

function resizeOff() {
    selectToggle()
}


/**
 * draw 관련 이벤트
 */

var lineFunction = d3.line()
    .x(function(d) { return d.x;})
    .y(function(d) { return d.y;})
    .curve(d3.curveLinear);

// mousedown과 매핑
function drawStart() {
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
    d3Obj.on("mousemove", drawDraw);
}

// mousemove와 매핑
function drawDraw() {
    var m = d3.mouse(this);
    var lineData = [
        lineStart,
        {"x" : m[0], "y" : m[1]}
    ];
    draw.attr("d", lineFunction(lineData));

    // pen 기준임. line이나 도형은 시작 끝만 비교해도 됨
    minMouse[0] = Math.min(minMouse[0], m[0]);
    minMouse[1] = Math.min(minMouse[1], m[1]);
    maxMouse[0] = Math.max(maxMouse[0], m[0]);
    maxMouse[1] = Math.max(maxMouse[1], m[1]);
}

// mouseup과 매핑
function drawEnd() {
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

    drawSvg.appendChild(copyDraw)
    drawDiv.appendChild(drawSvg)
    canvasElem.appendChild(drawDiv);

    ++drawIdx;
}

/**
 * select 관련 이벤트
 */

function selectSvg() {
    d3.selectAll(".scaledSvg")
    .classed("selected", false);

    d3.select(this)
    .classed("selected", true)
    .on("mousemove", mouseBorder);
}

function moveStart() {
    d3.selectAll(".scaledSvg")
    .classed("selected", false);

    d3.select(this)
    .classed("selected", true)
    .on("mousemove", null);

    storedMouseX = d3.mouse(this)[0]; // 얕은 복사?? moveSvg에서 storeMouseX에 다시 저장 안해도 최신 마우스 좌표 값이 반영됨. 근데 밑에 resize선 안됨.
    storedMouseY = d3.mouse(this)[1];
    d3Obj.on("mousemove", moveSvg)
    .on("mouseup", moveEnd);
}

function moveSvg() {
    const curMouse = d3.mouse(this);
    const xChange = curMouse[0] - storedMouseX;
    const yChange = curMouse[1] - storedMouseY;

    var curObj = d3.select(this);
    const prevLeft = parseInt(curObj.style("left"), 10); // 10진수로 파싱
    const prevTop = parseInt(curObj.style("top"), 10);

    curObj.style("left", prevLeft + xChange)
    .style("top", prevTop + yChange);
}

function moveEnd() {
    d3Obj.on("mousemove", null)

    d3.select(this)
    .on("mousemove", null)
    .on("mousemove", mouseBorder);
}

/**
 * resize 이벤트
 */
// 1차 : path 자체를 수정하는 방법 시도
// width, height를 이용해 svg를 resize해도 될 지는 따로 검토해볼 것. 스킨 어노테이션 표현을 봐야함

// path 파싱 관련 글 : https://stackoverflow.com/questions/65211489/is-there-a-standard-for-parsing-svg-paths
// svg1.1 standard인 Interface SVGPathSegment는 대부분 브라우저에서 미지원(https://svgwg.org/specs/paths/#InterfaceSVGPathSegment)
// svg2에서 api가 제거되어서 앞으로도 사용될 일 없을듯
// d3에도 d 파서는 없음

// 2차 : 다시 그리는 방법 시도

function mouseBorder() {
    var curObj = d3.select(this);
    const curMouse = d3.mouse(this);

    const borderBottom = parseInt(curObj.style("top"), 10) + parseInt(curObj.style("height"), 10);
    const borderRight = parseInt(curObj.style("left"), 10) + parseInt(curObj.style("width"), 10);

    const curMouseX = curMouse[0];
    const curMouseY = curMouse[1];

    d3Obj.on("mousedown", null);
    if(borderRight == curMouseX && borderBottom == curMouseY) {
        curObj.attr("cursor", "se-resize");
        curObj.on("mousedown", () => resizeReady(this, false,false))
    } else if(borderRight == curMouseX || borderRight == curMouseX+1 || borderRight == curMouseX-1) {
        curObj.attr("cursor", "e-resize");
        curObj.on("mousedown", () => resizeReady(this, false, true))
    } else if(borderBottom == curMouseY || borderBottom == curMouseY+1 || borderBottom == curMouseY-1) {
        curObj.attr("cursor", "s-resize");
        curObj.on("mousedown", () => resizeReady(this, true, false))
    } else {
        curObj.attr("cursor", "auto");
        curObj.on("mousedown", null);
        d3Obj.on("mousedown", moveStart);
    }
}

function resizeReady(thisObj, xFix, yFix) {
    resizeOn();
    d3Obj = d3.select("#tmpCanvas");
    d3Obj.on("mousemove", () => resizeStart(thisObj, xFix,yFix));
}

function resizeStart(thisObj, xFix, yFix) {
    d3Obj.on("mousemove", null);
    d3Obj.on("mousemove", resizeResize);
    d3Obj.on("mouseup", resizeEnd);

    var curShape = document.getElementsByClassName("selected")[0];
    var parentDiv = curShape.parentNode;
    var m = d3.mouse(thisObj);

    // getBoundingClientRect()의 좌표는 상대좌표이다
    // relative한 부모 요소의 좌표만큼 보정해줘야 함
    // 참고 : https://mommoo.tistory.com/85
    const startX = curShape.getBoundingClientRect().x - parentDiv.getBoundingClientRect().x;
    const startY = curShape.getBoundingClientRect().y - parentDiv.getBoundingClientRect().y;
    const fixX = xFix? startX + parseInt(curShape.getBoundingClientRect().width) : 0;
    const fixY = yFix? startY + parseInt(curShape.getBoundingClientRect().height) : 0;
    lineStart = {"x": startX, "y": startY};
    var lineData = [
        lineStart,
        {"x" : fixX == 0 ? m[0]:fixX, "y" : fixY == 0? m[1] : fixY}
    ];


    curShape.parentNode.remove();
    const tmpSvg = d3.create("svg");
    tmpSvg.attr("width", 1280)
    .attr("height", 720);
    
    draw = d3Obj.append(() => tmpSvg.node())
        .append("path")
        .attr("d", lineFunction(lineData))
        .attr("style", pathStyle);

    viewboxX = Math.min(lineStart.x, lineData[1].x);
    viewboxY = Math.min(lineStart.y, lineData[1].y);
    viewboxWidth = Math.abs(lineStart.x - lineData[1].x);
    viewboxHeight = Math.abs(lineStart.y - lineData[1].y);
    d3Obj.on("mousemove", () => resizeResize(thisObj, fixX, fixY));
}

function resizeResize(thisObj, fixX, fixY) {
    var m = d3.mouse(thisObj);
    var lineData = [
        lineStart,
        {"x" : fixX == 0 ? m[0]:fixX, "y" : fixY == 0? m[1] : fixY}
    ];
    draw.attr("d", lineFunction(lineData));

    viewboxX = Math.min(lineStart.x, lineData[1].x);
    viewboxY = Math.min(lineStart.y, lineData[1].y);
    viewboxWidth = Math.abs(lineStart.x - lineData[1].x);
    viewboxHeight = Math.abs(lineStart.y - lineData[1].y);
}


// function resizeResize_backup() { // d를 직접 수정하는 방식 백업
//     const curMouse = d3.mouse(this);
//     const xChange = curMouse[0] - storedMouseX;
//     const yChange = curMouse[1] - storedMouseY;
//     storedMouseX = curMouse[0];
//     storedMouseY = curMouse[1];

//     const svgObj = d3.select(this);
//     const svgWidth = parseInt(svgObj.style("width"),10);
//     const svgHeight = parseInt(svgObj.style("height"),10);

//     var curPath = document.getElementsByClassName("selected").item(0).lastElementChild;
//     curPath.setAttribute("class", "resizing");

//     var pathDriven = curPath.getAttribute("d");
//     const regex = /[^0-9.]/g;
//     pathDriven = pathDriven.replace(regex, " ");
//     const drivenArray = pathDriven.split(" ");

//     const x1 = parseInt(drivenArray[1], 10);
//     const y1 = parseInt(drivenArray[2], 10);
//     const x2 = parseInt(drivenArray[3], 10) + (xChange/svgWidth); // 각 x좌표 - (x좌표 전체합/마우스 이동) => path는 viewbox 기준이므로
//     const y2 = parseInt(drivenArray[4], 10) + (yChange/svgHeight);

//     var lineData = [
//         {"x" : x1, "y" : y1},
//         {"x" : x2, "y" : y2}
//     ];

//     // todo... svg 크기 조절하는 코드도 필요
//     d3.select(".resizing").attr("d", lineFunction(lineData));
// }

function resizeEnd() {
    d3Obj.on("mousemove", null);
    const canvasElem = document.getElementById("canvas");

    const drawDiv = document.createElement('div');
    drawDiv.id = "draw_" + drawIdx;
    drawDiv.style.position = "absolute";

    const drawSvg = document.createElementNS(svgNS, 'svg');
    // x시작 y시작 width height
    const viewBoxVal = "" + viewboxX + " " + viewboxY + " " + viewboxWidth + " " + viewboxHeight;
    const drawSvgStyle = "left:" + viewboxX + "px; width: " + viewboxWidth + "px; top: " + viewboxY + "px; height: " + viewboxHeight + "px;" + pathStyle;
    drawSvg.setAttribute("class", "scaledSvg");
    drawSvg.setAttribute("viewBox", viewBoxVal);
    drawSvg.style = drawSvgStyle;

    const originSvg  = document.getElementById("tmpCanvas").lastElementChild;
    const originDraw = originSvg.lastElementChild;
    const copyDraw = originDraw.cloneNode(true);
    originSvg.remove();

    drawSvg.appendChild(copyDraw)
    drawDiv.appendChild(drawSvg)
    canvasElem.appendChild(drawDiv);

    ++drawIdx;

    resizeOff();
}

/**
 * 공용 이벤트
 */

// // 마우스가 구역 밖으로 나간 경우
// // mouseleave와 매핑 (모든 이벤트 공통으로 써도 될듯)
// function mouseleave() {
//     d3Obj.on("mousemove", null);
// }
