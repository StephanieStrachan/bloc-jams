var setSong = function(songNumber) {
	if (currentSoundFile) {
        currentSoundFile.stop();
    }
	
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
    	formats: ['mp3'],
        preload: true
    });
    
    setVolume(currentVolume);
};

var seek = function(time) {
	if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
};

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var createSongRow = function(songNumber, songName, songLength) {
	var template =
      	'<tr class="album-view-song-item">'
    	+ '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    	+ '  <td class="song-item-title">' + songName + '</td>'
    	+ '  <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
    	+ '</tr>';
	
	var clickHandler = function() {
    	var songNumber = parseInt($(this).attr('data-song-number'));

		if (currentlyPlayingSongNumber !== null) {
            var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);            
            currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingCell.html(currentlyPlayingSongNumber);
        }

        if (currentlyPlayingSongNumber !== songNumber) {
            setSong(songNumber);
			currentSoundFile.play();
			updateSeekBarWhileSongPlays();
			currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
            
			var $volumeFill = $('.volume .fill');
      		var $volumeThumb = $('.volume .thumb');
      		$volumeFill.width(currentVolume + '%');
      		$volumeThumb.css({left: currentVolume + '%'});
			
			$(this).html(pauseButtonTemplate);
			updatePlayerBarSong();
           
        } else if (currentlyPlayingSongNumber === songNumber) {
            if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPauseButton);
                currentSoundFile.play();
				updateSeekBarWhileSongPlays();
            } else {
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPlayButton);
                currentSoundFile.pause();
            }
		}
	};
	
	var $row = $(template);
	
	var onHover = function(event) {
    	var songNumberCell = $(this).find('.song-item-number');
		var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(playButtonTemplate);
        }
    };
	
    var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(songNumber);
        }
    };

    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);
    return $row;
};

var setCurrentAlbum = function(album) {
    currentAlbum = album;
    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');

    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    $albumSongList.empty();

    for (var i = 0; i < album.songs.length; i++) {
    var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
    	$albumSongList.append($newRow);
    }
};

var setCurrentTimeInPlayerBar = function(currentTime) {
	var $currentTime = $('.seek-control .current-time');
    $currentTime.text(currentTime);
};

var setTotalTimeInPlayerBar = function(totalTime) {
	var $totalTime = $('.seek-control .total-time');
  	$totalTime.text(totalTime)
};

var filterTimeCode = function(timeInSeconds) {
	var totalSeconds = parseFloat(timeInSeconds);
	var wholeMinutes = Math.floor(totalSeconds / 60);
	var wholeSeconds = Math.floor(totalSeconds % 60);	
	
	if(wholeSeconds < 10) {
		return wholeMinutes = "0:0" + wholeSeconds;
	} else {
		return wholeMinutes + ":" + wholeSeconds;
	}
};

var updateSeekBarWhileSongPlays = function() {
	if (currentSoundFile) {

        currentSoundFile.bind('timeupdate', function(event) {
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');
 
            updateSeekPercentage($seekBar, seekBarFillRatio);
			setCurrentTimeInPlayerBar(filterTimeCode(this.getTime()));
			setTotalTimeInPlayerBar(filterTimeCode(this.getDuration()));
        });
    }
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
 
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

var setupSeekBars = function() {
	var $seekBars = $('.player-bar .seek-bar');
 
    $seekBars.click(function(event) {
    	var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        var seekBarFillRatio = offsetX / barWidth;
        
        if ($(this).parent().attr('class') == 'seek-control') {
        	seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);   
        }
        
        updateSeekPercentage($(this), seekBarFillRatio);
    });

    $seekBars.find('.thumb').mousedown(function(event) {
        var $seekBar = $(this).parent();

        $(document).bind('mousemove.thumb', function(event){
        	var offsetX = event.pageX - $seekBar.offset().left;
            var barWidth = $seekBar.width();
            var seekBarFillRatio = offsetX / barWidth;
            
            if ($seekBar.parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());   
            } else {
                setVolume(seekBarFillRatio);
            }
            
            updateSeekPercentage($seekBar, seekBarFillRatio);
        });
    
		$(document).bind('mouseup.thumb', function() {
         	$(document).unbind('mousemove.thumb');
          	$(document).unbind('mouseup.thumb');
      	});
    });
};

var nextSong = function() {   
    var getLastSongNumber = function(index) {
        return index == 0 ? currentAlbum.songs.length : index;
    };

    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex++;

    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    setSong(currentSongIndex + 1);

    currentSoundFile.play();

    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.main-controls .play-pause').html(playerBarPauseButton);

    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');

    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function () {
    var getLastSongNumber = function(index) {
        return index == (currentAlbum.songs.length - 1) ? 1 : index + 2;
    };

    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex--;

    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }
    
	setSong(currentSongIndex + 1);
	currentSoundFile.play();
	updateSeekBarWhileSongPlays();
	updatePlayerBarSong();
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.main-controls .play-pause').html(playerBarPauseButton);

    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var trackIndex = function(album, song) {
	return album.songs.indexOf(song);
};

var updatePlayerBarSong = function () {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
	setCurrentTimeInPlayerBar(currentSongFromAlbum.duration);
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

var currentAlbum = null;
var currentlyPlayingSongNumber = parseInt(null);
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playButton =  $('.main-controls .play-pause');

var togglePlayFromPlayerBar = function() {
	if (currentlyPlayingSongNumber !== null) {
    	var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingCell.html(currentlyPlayingSongNumber);
    	}
	if (currentSoundFile) {
		if (currentSoundFile.isPaused()) {
			$(currentlyPlayingCell).html(pauseButtonTemplate);
			$('.main-controls .play-pause').html(playerBarPauseButton);
			currentSoundFile.play();
		} else {
			$(currentlyPlayingCell).html(playButtonTemplate);
			$('.main-controls .play-pause').html(playerBarPlayButton);
			currentSoundFile.pause();
		}   
	}
};

$(document).ready(function () {
    setCurrentAlbum(albumPicasso);
	setupSeekBars();
	$previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playButton.click(togglePlayFromPlayerBar);
});
