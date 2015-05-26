document.onreadystatechange = function (event) {
    if (event.target.readyState !== "complete") {
        return;
    }

    window.FSM = new FullScreenMario( {
      	"width": window.innerWidth, 
      	"height": window.innerHeight,
      	"full": false,
      	"maps": {
      		"mapDefault": "basic-interface"
      	},
      	"mods": {
      		"Infinite Lives": true,
			"Super Fireballs": true,
			"Invincibility": false
		}
   	} );
   
   document.body.appendChild(FSM.container);
   
   FSM.proliferate(document.body, {
       "onkeydown": FSM.InputWriter.makePipe("onkeydown", "keyCode", true),
       "onkeyup": FSM.InputWriter.makePipe("onkeyup", "keyCode", true),
       "onmousedown": FSM.InputWriter.makePipe("onmousedown", "which", true)
   });
   
   FSM.gameStart();
   FSM.setMap("1-1"); 
   //FSM.setMap("basic-interface"); 
   //FSM.AudioPlayer.pauseTheme();

   initSoundVisualisation();
};

function initSoundVisualisation () {
	initAudio();
	initAnalyser();

	setInterval( initAudio, 100 );
}

function initAudio ( callback ) {
	var theme = window.FSM.AudioPlayer.getTheme(),
		themeSrc = $( theme ).find('source[type="audio/mp3"]' ).attr( 'src' );

	if ( !window.audio ) {
		window.audio = new Audio();
	}

	if ( window.audio.src !== themeSrc ) {
		window.audio.pause();
		window.audio.src = themeSrc;
	}

	if ( window.audio.name !== $( theme ).attr( 'name' ) && window.$visualiser ) {
		resetVisualiser();
	}

	console.log( window.audio.name, $( theme ).attr( 'name' ) );

	window.firstAudioInit = true;
	
	window.audio.loop = true;
	window.audio.name = $( theme ).attr( 'name' );
	window.audio.currentTime = theme.currentTime;
	//window.audio.volume = theme.volume;

	if ( theme.paused ) {
		window.audio.pause();
	} else {
		window.audio.play();
	}
}

function initAnalyser () {
	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

	window.$visualiser = $( '#visualiser' );

	window.playerEvents = {};
	window.frequencyEvents = {
		'Overworld': {
			0: {
				range: [ 100, 125 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 0, 10 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 30, 120 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 70, 80 ],
				action: runBack,
				name: 'Back'
			}
		},
		'Star': {
			0: {
				range: [ 110, 125 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 10, 20 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 50, 100 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 70, 80 ],
				action: runBack,
				name: 'Back'
			}
		},
		'Overworld Star': {
			0: {
				range: [ 110, 125 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 0, 10 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 50, 100 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 70, 80 ],
				action: runBack,
				name: 'Back'
			}
		},
		'Hurry Overworld': {
			0: {
				range: [ 110, 125 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 0, 10 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 50, 100 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 70, 80 ],
				action: runBack,
				name: 'Back'
			}
		}, 
		'Underworld': {
			0: {
				range: [ 90, 110 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 0, 10 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 20, 80 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 50, 60 ],
				action: runBack,
				name: 'Back'
			}
		},
		'Hurry Underworld': {
			0: {
				range: [ 90, 110 ],
				action: highJump,
				name: 'Jump'
			},
			1: {
				range: [ 0, 10 ],
				action: crouch,
				name: 'Crouch'
			}, 
			2: {
				range: [ 20, 30 ],
				action: shoot,
				name: 'Shoot'
			},
			3: {
				range: [ 10, 100 ],
				action: run,
				name: 'Forward'
			},
			4: {
				range: [ 50, 60 ],
				action: runBack,
				name: 'Back'
			}
		}
	};

	window.ctx = new AudioContext();
  	window.audioSrc = ctx.createMediaElementSource(audio);
  	window.analyser = ctx.createAnalyser();

  	audioSrc.connect( analyser );
  	frequencyData = new Uint8Array(analyser.frequencyBinCount);

  	renderAudio();
  	initVisualiser();
}

function initVisualiser () {
	for ( var key in frequencyEvents[ window.audio.name ] ) {
		var item = frequencyEvents[ window.audio.name ][ key ];
		var $item = $( '<div class="column"><div class="box"></div></div>' )
			.attr( 'name', window.audio.name ),

			$range = $( '<div class="range"></div>' )
				.css( {
					top: 100 * ( (255 - item.range[ 1 ]) / 255 ) + '%',
					bottom: 100 * ( item.range[ 0 ] / 255 ) + '%'
				} )
				.appendTo( $item );

		var $label = $( '<p class="label"></p>' )
			.text( item.name )
			.appendTo( $item );

		$item.appendTo( window.$visualiser );
	}
}

function resetVisualiser () {
	$visualiser.empty();

	initVisualiser();
}

function processFrequences () {
	var segments = 128,
		data = new Array( parseInt( frequencyData.length / segments ) ),
		index = 0;

	for ( var i = 0; i < frequencyData.length; i += segments ) {
		var middle = 0;

		for ( var k = 0; k < segments; k++ ) {
			middle += frequencyData[ i + k ];
		}

		middle /= segments;

		data[ index ] = middle;

		index++;
	}

	return data;
}

function movePlayer () {
	var d = processedFrequences;

	if ( !frequencyEvents[ window.audio.name ] ) {
		throw "{NAME} not found in frequency data!".replace('{NAME}', window.audio.name );
	}

	for ( var key in frequencyEvents[ window.audio.name ] ) {
		var item = frequencyEvents[ window.audio.name ][ key ];

		if ( d[ key ] >= item.range[ 0 ] && d[ key ] < item.range[ 1 ] ) {
			$visualiser.find( '.column' ).eq( key ).find( '.range' ).addClass( 'active' );

			item.action();
		} else {
			$visualiser.find( '.column' ).eq( key ).find( '.range' ).removeClass( 'active' );
		}
	}
}

function renderAudio () {
	requestAnimationFrame( renderAudio );

	analyser.getByteFrequencyData( frequencyData );

	window.processedFrequences = processFrequences();

	for ( var i = 0; i < processedFrequences.length; i++ ) {
		var value = processedFrequences[ i ],
			height = ( 100 - ( value / 255 ) * 100 );

		height = height == 100 ? 98 : height;

		$visualiser.find( '.column' ).eq( i ).find( '.box' ).css('top', height + '%');
	}

	movePlayer();
}

function shoot () {
	var keyCode = 16;
	if ( !playerEvents[ keyCode ] ) {
		activateKey( keyCode );

		setTimeout( releaseKey, 1000, keyCode );
	}
}

function crouch () {
	var keyCode = 40;
	if ( !playerEvents[ keyCode ] ) {
		activateKey( keyCode );

		setTimeout( releaseKey, 500, keyCode );
	}
}

function highJump () {
	var keyCode = 38;
	if ( !playerEvents[ keyCode ] ) {
		activateKey( keyCode );

		setTimeout( releaseKey, 800, keyCode );
	}
}

function run () {
	var keyCode = 39;
	if ( !playerEvents[ keyCode ] ) {
		activateKey( keyCode );

		setTimeout( releaseKey, 400, keyCode );
	}
}

function runBack () {
	var keyCode = 37;
	if ( !playerEvents[ keyCode ] ) {
		activateKey( keyCode );

		setTimeout( releaseKey, 200, keyCode );
	}
}

function activateKey ( keyCode, releaseDelay ) {
	playerEvents[ keyCode ] = true;

	var e = $.Event( 'keydown' );
	e.keyCode = keyCode;
	$( document.body ).trigger( e );
}

function releaseKey ( keyCode ) {
	playerEvents[ keyCode ] = false;

	var e = $.Event( 'keyup' );
	e.keyCode = keyCode;
	$( document.body ).trigger( e );	
}