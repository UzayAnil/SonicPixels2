var triggerInterval;
var playbackFrameTime = 1000;
var playbackFrames = $('#available-frames button');
var playingFrame = 0;
var totalFrames = playbackFrames.length;


$("#play-all-frames", function(e){
    triggerInterval = setInterval(function(){
        $(playbackFrames[playingFrame]).trigger('click');
        playingFrame = (playingFrame + 1) % totalFrames;
        frameToSend = comp.frames[playingFrame];
        frameToSend.palette = comp.palette;
        frameToSend.numUnits = comp.layout[0] * comp.layout[1]
        frameToSend.masterVolume = comp.masterVolume;
        sock.emit('frame', frameToSend);
    }, playbackFrameTime);
});

