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
    });
    $.each(compositionObject.palette, function (idx, val) {
        mainStyle.addRule('[data-sound="' + idx + '"]', 'background: rgb(' + val.join(', ') + ')');
    });
}

var selectedColour = 0;

function drawTools(compositionObject) {
    $.each(compositionObject.frames, function(idx, val) {
        var frameSelector = '<button class="frame-selector" data-frame-index="'+val.frame_index+'">Frame '+(val.frame_index+1)+'</button>';
        $("#available-frames").append(frameSelector);
    });
    $.each(compositionObject.palette, function(idx, val){
        var colourSelector = '<button class="colour-selector" data-sound="'+idx+'"></button>';
        $("#sound-picker").append(colourSelector);
    });
}

$("#drawing-tools").on('click', ".frame-selector", function(e){
    e.preventDefault();
    drawFrame(comp, $(this).attr('data-frame-index'));
});

$("#drawing-tools").on('click', ".colour-selector", function (e) {
    e.preventDefault();
    selectedColour = $(this).attr('data-sound');
    console.log(selectedColour);    
});

$("#interface").on('click', ".sonic-pixel", function(e) {
    e.preventDefault();
    var currentFrame = $(this).closest('table').attr('data-frame-index');
    var clickedCell = $(this).attr('data-cell-id');
    $(this).attr('data-sound', selectedColour);
    comp.frames[currentFrame].cells[clickedCell].sound = selectedColour;    
    writeComposition(comp);
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