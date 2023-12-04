const video = document.getElementById('webcam');  // Stream.
const liveView = document.getElementById('liveView');  // Container.
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const h1 = document.getElementById('title');
const des = document.getElementById('description');
const body = document.getElementById('body');
const header = document.getElementById('header');
// Summarize the id numbers assigned to objects that might be obstacles.
const obstacles = [1, 2, 3, 4, 6, 7, 8, 11, 18, 33, 37, 41, 44, 64];

let videoWidth = 640;

// Check if webcam access is supported.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will 
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser')
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!model) { return; }

  // Hide all of the text once clicked the button.
  event.target.classList.add('removed');
  h1.classList.add('removed');
  des.classList.add('removed');

  // getUsermedia parameters to force video but not audio.
  var constraints = {
    video: true
  };
  
  // If the user is using a smart phone, activate the outside camera.
  if((navigator.userAgent.indexOf('iPhone') > 0) || (navigator.userAgent.indexOf('iPad') > 0) || (navigator.userAgent.indexOf('iPod') > 0) || (navigator.userAgent.indexOf('Android') > 0)){
    constraints = { video: { facingMode: { exact: "environment" } }};
    if(window.innerWidth < window.innerHeight){
      videoWidth = 480;
    }
  }
  
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.width = window.innerWidth;
    liveView.style = 'margin: 0px;';
    body.style = 'margin: 0px;';

    video.addEventListener('loadeddata', predictWebcam);
  });

}


// Store the resulting model in the global scope of our app.
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.

cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove('invisible');
});

var children = [];

function predictWebcam() {
  // Now let's start classifying a frame in the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
      header.classList.add('removed');
    }

    children.splice(0);

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.

    for (let n = 0; n < predictions.length; n++) {
         // To begin with, identify whether the object we are looking for might be an obstacle or not.
         // Then, if we are over 66% sure we are sure we classified it right, draw it.
        if ((obstacles.includes(predictions[n].ident) === true) && predictions[n].score > 0.66) {
          const p = document.createElement('p');
          
          header.classList.remove('removed');
          header.innerText = 'There is a ' + predictions[n].class + ' in front of you.';
          header.style = 'position: absolute; z-index: 10;';
          
          p.innerText = predictions[n].class  + ' - with ' 
              + Math.round(parseFloat(predictions[n].score) * 100) 
              + '% confidence.';

          p.style = 'margin-left: ' + (predictions[n].bbox[0] * (window.innerWidth/videoWidth)) + 'px; margin-top: '
              + (predictions[n].bbox[1] * (window.innerWidth/videoWidth) - 10) + 'px; width: ' 
              + (predictions[n].bbox[2] * (window.innerWidth/videoWidth) - 10) + 'px; top: 0; left: 0;';

          const highlighter = document.createElement('div');
          highlighter.setAttribute('class', 'highlighter');
          highlighter.style = 'left: ' + (predictions[n].bbox[0] * (window.innerWidth/videoWidth)) + 'px; top: '
              + (predictions[n].bbox[1] * (window.innerWidth/videoWidth)) + 'px; width: ' 
              + (predictions[n].bbox[2] * (window.innerWidth/videoWidth)) + 'px; height: '
              + (predictions[n].bbox[3]  * (window.innerWidth/videoWidth)) + 'px;';
          
          //body.appendChild(header);
          liveView.appendChild(highlighter);
          liveView.appendChild(p);
          //body.push(header);
          children.push(highlighter);
          children.push(p);
          
      }
    }   

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);

  });

}
