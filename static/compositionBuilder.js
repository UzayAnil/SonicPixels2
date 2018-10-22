function Cell(id) {
    this.cell_id = id;
    this.state = "off";
    this.bank = 0;
    this.sound = 0;
    this.volume = 1.0;
    this.begin = 0.0;
    this.end = 1.0;
}

function Frame(index, cells) {
    this.frame_index = index;
    this.cells = new Array(cells);
    for (var i = 0; i < this.cells.length; i ++) {
        this.cells[i] = new Cell(i);
    }
};

function Composition(name, author, layoutX, layoutY) {
    this.name = name;
    this.author = author;
    this.masterVolume = 1.;
    this.layout = [layoutX, layoutY];
    this.palette = new Array(8);
    for (var i = 0; i < this.palette.length; i ++) {
        this.palette[i] = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
    };
    this.frames = new Array(8);
    for (var i = 0; i < (this.frames.length); i ++) {
        this.frames[i] = new Frame(i, (this.layout[0] * this.layout[1]));
    };
};

var mainStyle = document.styleSheets[0];
var stateIcons = {'loop':'undo', 'one-shot':'arrow-right', 'off':'times-circle'};

var sequencerBounds;


function drawFrame(compositionObject, frameIndex) {
    var columns = compositionObject.layout[0]
    var rows = compositionObject.layout[1];
    var columnWidth = Math.floor(100/ columns) + "%";
    var rowHeight = Math.floor(100 / rows) + "%";
    mainStyle.addRule('td', 'min-width:' + columnWidth)
    mainStyle.addRule('tr', 'min-height:' + rowHeight);
    frameObject = compositionObject.frames[frameIndex];
    $("#interface").empty();
    var theTable = '<table id="drawn-frame" data-frame-index="'+frameObject.frame_index+'"></table>';
    $("#interface").empty();
    $("#interface").append(theTable);
    for (var row = 0; row < rows; row ++) {
        var newRow = "<tr>";
        for (var col = 0; col < columns; col ++) {
            newRow += '<td class="sonic-pixel"></td>';
        };
        newRow += '</tr>';
        $("#drawn-frame").append(newRow);
    };
    $('td').each(function(idx, val){
        $(this).attr('data-cell-id', idx);
        $(this).attr('data-state', frameObject.cells[idx].state);
        $(this).attr('data-bank', frameObject.cells[idx].bank);
        $(this).attr('data-sound', frameObject.cells[idx].sound);
        $(this).attr('data-volume', frameObject.cells[idx].volume);
        $(this).css('opacity', $(this).attr('data-volume'));
        $(this).attr('data-begin', frameObject.cells[idx].begin);
        $(this).attr('data-end', frameObject.cells[idx].end);
        $(this).html('<p><i class="fas fa-' + stateIcons[frameObject.cells[idx].state]+' fa-fw"></i></p>');
    });
    $.each(compositionObject.palette, function (idx, val) {
        mainStyle.addRule('[data-sound="' + idx + '"]', 'background: rgb(' + val.join(', ') + ')');
    });
    sequencerBounds = $('#interface .sonic-pixel').map(function () {
        var e = $(this),
            o = e.offset(),
            w = e.width(),
            h = e.height();
        return {
            top: o.top,
            left: o.left,
            right: o.left + w,
            bottom: o.top + h,
            e: e
        }
    }).get();
}

var selectedState = 'one-shot';
var selectedColour = 0;
var selectedBank = 0;
var selectedVolume = 1.;
var selectedBeginEnd = [0., 1.];

function drawTools(compositionObject) {
    $.each(compositionObject.frames, function(idx, val) {
        var frameSelector = '<button class="frame-selector" data-frame-index="'+val.frame_index+'">Frame '+(val.frame_index+1)+'</button>';
        $("#available-frames").append(frameSelector);
    });
    $.each(compositionObject.palette, function(idx, val){
        var colourSelector = '<button class="colour-selector" data-sound="'+idx+'"></button>';
        $("#sound-picker").append(colourSelector);
    });
    $('#begin-end').slider({
        range: true,
        values: [0, 100],
        min: 0,
        max: 100,
        change: function (e, ui) { selectedBeginEnd = [(ui.values[0] * 0.01), (ui.values[1] * 0.01)]}
    });
    $('#volume').slider({
        range: "min",
        value: 100,
        min:0, 
        max:100,
        change: function(e, ui) {selectedVolume = (ui.value*0.01)}
    });
    mainStyle.addRule('.ui-slider-range', 'background: rgb(' + comp.palette[selectedColour].join(', ') + ')');
}

$("#drawing-tools").on('click', ".frame-selector", function(e){
    e.preventDefault();
    drawFrame(comp, $(this).attr('data-frame-index'));
});

$("#drawing-tools").on('click', ".colour-selector", function (e) {
    e.preventDefault();
    selectedColour = $(this).attr('data-sound');
    $('#one-shot').prop('checked', true).trigger('change');
    mainStyle.addRule('.ui-slider-range', 'background: rgb(' + comp.palette[selectedColour].join(', ') + ')');
});



function fillCell(cell) {
    var currentFrame = cell.closest('table').attr('data-frame-index');
    var clickedCell = cell.attr('data-cell-id');
    console.log("Painting:");
    console.log(clickedCell);
    comp.frames[currentFrame].cells[clickedCell].state = selectedState;
    comp.frames[currentFrame].cells[clickedCell].sound = selectedColour;
    comp.frames[currentFrame].cells[clickedCell].bank = selectedBank;
    comp.frames[currentFrame].cells[clickedCell].volume = selectedVolume;
    comp.frames[currentFrame].cells[clickedCell].begin = selectedBeginEnd[0];
    comp.frames[currentFrame].cells[clickedCell].end = selectedBeginEnd[1];
    cell.attr('data-state', frameObject.cells[clickedCell].state);
    cell.attr('data-bank', frameObject.cells[clickedCell].bank);
    cell.attr('data-sound', frameObject.cells[clickedCell].sound);
    cell.attr('data-volume', frameObject.cells[clickedCell].volume);
    cell.css('opacity', cell.attr('data-volume'));
    cell.attr('data-begin', frameObject.cells[clickedCell].begin);
    cell.attr('data-end', frameObject.cells[clickedCell].end);
    cell.html('<p><i class="fas fa-' + stateIcons[frameObject.cells[clickedCell].state] + ' fa-fw"></i></p>');
}

$("#play-current-frame").on('click', function(e){
    e.preventDefault();
    var currentFrame = $("#drawn-frame").attr("data-frame-index");
    var frameToSend = comp.frames[currentFrame];
    frameToSend.palette = comp.palette;
    frameToSend.numUnits = comp.layout[0] * comp.layout[1]
    frameToSend.masterVolume = comp.masterVolume;
    sock.emit('frame', frameToSend);
});

$("#bank-select").on('change', function(e) {
    selectedBank = $(this).val();
});

$("input[name='state-select']").on('change', function(e){
    e.preventDefault();
    selectedState = $(this).val();
});

function writeComposition(compositionObject) {
    $.ajax({
        type: "POST",
        url: 'save-composition',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(compositionObject),
        success: function () {
            console.log("Saved");
        }
    });
}

$('#master-volume').slider({
    range: "min",
    value: 100,
    min: 0,
    max: 100,
    change: function (e, ui) { 
        comp.masterVolume = ui.value*0.01;
        writeComposition(comp);
    }
});

//bind touch events for the interaction with the main interface
var mouseIsDown = false;
$('#interface').on('mousedown', '.sonic-pixel', function (e) {
    e.preventDefault();
    fillCell($(this));
    mouseIsDown = true;
}).on('mousemove', '.sonic-pixel', function (e) {
    e.preventDefault();
    if (mouseIsDown) {
        fillCell($(this));
    }
});
$(document).on('mouseup', function () {
    mouseIsDown = false;
});

$("#interface").on('mouseup touchend', function () {
    writeComposition(comp);
});

//equivalent dragging detection for touch, credit: http://output.jsbin.com/favobu
// first - store the coords of all the cells for the position check


var currentTarget = $(),
    activeTarget = $();

var touchF = function (e) {
    e.preventDefault();
    var touch = e.originalEvent.touches[0];
    currentTarget = getCurrent(
        {
            clientX: touch.clientX,
            clientY: touch.clientY
        }
    );
    // if the touch is in one of the cells and it's different than the last touch cell
    if (currentTarget && currentTarget != activeTarget) {
        activeTarget = currentTarget;
        fillCell(activeTarget);
    }
    
}

$("#interface").on('touchstart touchmove', '.sonic-pixel' , touchF);

function getCurrent(touch) {
    // check if the touch coords are in the position of one of the cells and which one
    var a = sequencerBounds.filter(function (obj) {
        var b = (
            touch.clientX > obj.left &&
            touch.clientX < obj.right &&
            touch.clientY < obj.bottom &&
            touch.clientY > obj.top
        );
        return b;
    });
    return a.length > 0 ? a[0].e : null;
}
