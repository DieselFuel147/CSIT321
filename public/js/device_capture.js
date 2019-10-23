var config_options = {
    check_frequency: 1000, // How often to check for the image response, in milliseconds
    aspect_ratio: 0.75
}

var hostname = location.protocol + "//" + location.host;
var beeId = "";

var timeRequested = Math.floor((new Date()/1000));
var interval;

// Box drawing attributes
let canvas_w = 600;
let canvas_h = 450;
let ctx;

var selected_idx;

boxes = [];

function checkDeviceImage() {
    $.post(`${hostname}/bee/img/fetch/${beeId}`, function (data) {
        console.log(timeRequested);
        console.log(data.rtime);
        if (data.rtime > timeRequested) {
            $("#loadIndicator").hide();
            var canvasImg = new Image(canvas_w, canvas_h);
            canvasImg.src = "data:image/jpg;base64," + data.image;

            canvasImg.onload = function() {
                // Draw the retrieved image to the canvas
                ctx.drawImage(canvasImg, 0, 0, canvas_w, canvas_h);
            }

            clearInterval(interval);
        }
    });
}

$(document).ready(function() {
    beeId = $("#beeID")[0].innerHTML;

    let canvas = $("#boxDraw")[0];
    ctx = canvas.getContext("2d");

    canvas_w = $("#boxDraw").parent().width();
    canvas_h = canvas_w * config_options.aspect_ratio;

    canvas.width = canvas_w;
    canvas.height = canvas_h;

    // Fetch the boxes from the server and draw them
    //drawBoxes();

    // Send a request to the server for an image of the bee current state
    $.post(`${hostname}/bee/img/request/${beeId}`, function(data) {
        console.log(data);
        timeRequested = Math.floor((new Date()) / 1000)
    }).fail(function(err) {
        //console.log(err);
    });

    // Continually send periodic requests for the new image until its timestamp is higher than the time we requested an image
    interval = setInterval(checkDeviceImage, config_options.check_frequency);
});

function drawBox(b) {
    drawArea.append(b);
}

function clearDrawArea() {
    $("#graph").children().not("defs").remove();
}

function onBoxClick(e) {
	e.preventDefault();
	e.stopPropagation();

    idx = this.getAttribute('index');
   
    if (idx == selected_idx) {
        boxes[idx].setAttribute("stroke", "black");
        selected_idx = null;
        removeDraggable(boxes[idx])
    }
    else {
        if (selected_idx != null) {
            boxes[selected_idx].setAttribute("stroke", "black");
            removeDraggable(boxes[selected_idx])
        }
        boxes[idx].setAttribute("stroke", "red");
        selected_idx = idx;
        makeDraggable(boxes[idx])
    }
}


function addRandomBox() {

    let x = Math.random()  * (1 - .15);
    let y = Math.random()  * (1 - .15);

    let x2 = (Math.random() * (1 - x)) + x;
    let y2 = (Math.random() * (1 - y)) + y;

    let w = x2 - x;
    let h = y2 - y;

    //console.log("[x, y, x2, y2, w, h] " + x + " " + y + " " + x2 + " " + y2 + " " + w + " " + h + " ");

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    svg.setAttribute("x", x * canvas_w);
    svg.setAttribute("y", y * canvas_h);
    svg.setAttribute("width", w * canvas_w);
    svg.setAttribute("height", h * canvas_h);

    svg.setAttribute("stroke", "black");
	svg.setAttribute("fill", "#d2d2d2");
    svg.setAttribute("fill-opacity", "0.5");

    svg.setAttribute('index', boxes.length);
    svg.onclick = onBoxClick;

    boxes.push(svg);
    drawBox(svg);
}

function drawBoxes() {
    clearDrawArea();
    boxes.forEach(b => {
        drawBox(b);
    });
}

/* Moveable svg */
// http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
function removeDraggable(e) {
    e.removeEventListener('mousedown', startDrag);
    e.removeEventListener('mousemove', drag);
    e.removeEventListener('mouseup', endDrag);
    e.removeEventListener('mouseleave', endDrag);
}

function makeDraggable(e) {
    e.addEventListener('mousedown', startDrag);
    e.addEventListener('mousemove', drag);
    e.addEventListener('mouseup', endDrag);
    e.addEventListener('mouseleave', endDrag);
}

var svg = null;
function startDrag(e) {
}

function drag(e) {
    e.preventDefault();
    boxes[selected_idx].setAttribute('x', boxes[selected_idx].getAttribute('x') * 1.01);
}

function endDrag(e) {
}
