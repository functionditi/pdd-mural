// p5.js Sketch integrated into center column
let W, H;
let selectedImage = null;
let selectedImageFolder = null;
let bodyPartsImages = { Heads: null, Torso: null, 'Left-Arm': null, 'Right-Arm': null, 'Left-Leg': null, 'Right-Leg': null };
const updateCanvasSize = () => {
  const centerSection = document.querySelector('.section.center');
  W = centerSection.clientWidth * 1;
  H = centerSection.clientHeight * 1;
};

// Biological motion walker instance
const bmw = new BMWalker();

// dat GUI instance
const gui = new dat.GUI({ closeOnTop: true, closed: true });

// Create Save & Download button outside of GUI
document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.createElement('button');
  saveButton.innerText = 'Save & Download';
  saveButton.style.position = 'absolute';
  saveButton.style.top = '770px';
  saveButton.style.right = '380px';
  saveButton.onclick = () => {
    saveCanvas('walker_sketch', 'png');
  };
  document.body.appendChild(saveButton);

  // Add event listener for gallery images
  const updateGalleryListeners = () => {
    const galleryItems = document.getElementsByClassName('image-container');
    Array.from(galleryItems).forEach((item, index) => {
      item.addEventListener('click', () => {
        const imgElement = item.querySelector('img');
        if (imgElement) {
          console.log(`${index + 1} clicked, Image: ${imgElement.src.split('/').pop()}`);
          const imgName = imgElement.src.split('/').pop();
          selectedImageFolder = imgElement.src.split('/')[imgElement.src.split('/').length - 2];
          console.log(`Selected image is from folder: ${selectedImageFolder}`);

          // Filter the images based on the folder name and file name to get the correct image from the correct folder
          selectedImage = images.find(
            image => image.fileName === imgName && image.folderName === selectedImageFolder
          );

          if (bodyPartsImages.hasOwnProperty(selectedImageFolder) && selectedImage) {
            bodyPartsImages[selectedImageFolder] = selectedImage;
          }

        } else {
          console.log(`${index + 1} clicked, No image found`);
        }
      });
    });
  };

  updateGalleryListeners();

  // Update gallery listeners when switching tabs
  const tabs = document.querySelectorAll('.tabs button');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      updateGalleryListeners();
    });
  });
});

// Set GUI position
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '360px';

// Setting values for dat GUI
const walkerSettingsDefault = {
  walkerHeight: 700,
  speed: 1.0,
  bodyStructure: 0.0,
  weight: 0.0,
  nervousness: 0.0,
  happiness: 0.0,
};
const walkerSettings = { ...walkerSettingsDefault };
const walkerFolder = gui.addFolder('Walker');

const cameraSettingsDefault = {
  azimuth: 0.0,
  angularVelocity: 0.0,
  elevation: 0.0,
  roll: 0.0,
};
const cameraSettings = { ...cameraSettingsDefault };
const cameraFolder = gui.addFolder('Camera');

const translationSettingsDefault = {
  flagTranslation: false,
};
const translationSettings = { ...translationSettingsDefault };
const translationFolder = gui.addFolder('Translation');

const canvasSettingsDefault = {
  dot: false,
  dotSize: 6,
  description: false,
  line: false,
  invert: false,
};
const canvasSettings = { ...canvasSettingsDefault };
const canvasFolder = gui.addFolder('Canvas');

const utilities = {
  reset: () => {
    initializeSettings();
  },
  saveImage: () => {
    saveCanvas('walker_sketch', 'png');
  },
};

const prepareDatGUI = () => {
  // Update canvas size before initializing GUI
  updateCanvasSize();
  initializeSettings();

  // Add some settings
  const step = 0.1;

  //  -- Walker
  walkerFolder.add(walkerSettings, 'walkerHeight', 1, W);
  walkerFolder.add(walkerSettings, 'speed', bmw.minSpeed, bmw.maxSpeed, step);
  walkerFolder.add(
    walkerSettings,
    'bodyStructure',
    bmw.minBodyStructure,
    bmw.maxBodyStructure,
    step
  );
  walkerFolder.add(walkerSettings, 'weight', bmw.minWeight, bmw.maxWeight, step);
  walkerFolder.add(walkerSettings, 'nervousness', bmw.minNervousness, bmw.maxNervousness, step);
  walkerFolder.add(walkerSettings, 'happiness', bmw.minHappiness, bmw.maxHappiness, step);
  walkerFolder.open();

  //  -- Camera
  cameraFolder.add(cameraSettings, 'azimuth', -PI, PI, step);
  cameraFolder.add(cameraSettings, 'angularVelocity', -TAU, TAU, step);
  cameraFolder.add(cameraSettings, 'elevation', -PI, PI, step);
  cameraFolder.add(cameraSettings, 'roll', -PI, PI, step);
  cameraFolder.open();

  //  -- Translation
  translationFolder.add(translationSettings, 'flagTranslation').onFinishChange(() => {
    if (translationSettings.flagTranslation) {
      bmw.resetTimer();
    }
  });
  translationFolder.open();

  //  -- Canvas
  canvasFolder.add(canvasSettings, 'dot');
  canvasFolder.add(canvasSettings, 'dotSize', 0, 30, 1);
  canvasFolder.add(canvasSettings, 'description');
  canvasFolder.add(canvasSettings, 'line');
  canvasFolder.add(canvasSettings, 'invert');
  canvasFolder.open();

  //  -- Utilities
  gui.add(utilities, 'reset');
};

// Initialize with default values
const initializeSettings = () => {
  Object.assign(walkerSettings, walkerSettingsDefault);
  Object.assign(cameraSettings, cameraSettingsDefault);
  Object.assign(translationSettings, translationSettingsDefault);
  Object.assign(canvasSettings, canvasSettingsDefault);
  gui.updateDisplay();

  // Assign random images to each body part initially
  const bodyParts = ['Heads', 'Torso', 'Left-Arm', 'Right-Arm', 'Left-Leg', 'Right-Leg'];
  bodyParts.forEach(part => {
    const partImages = images.filter(image => image.folderName === part);
    if (partImages.length > 0) {
      bodyPartsImages[part] = random(partImages);
    }
  });
};

let images = [];

function preload() {
  const folders = ['Heads', 'Left-Arm', 'Left-Leg', 'Right-Arm', 'Right-Leg', 'Torso'];
  for (const folder of folders) {
    for (let i = 1; i <= 19; i++) {
      const img = loadImage(`./assets/images/${folder}/artwork-${i.toString().padStart(2, '0')}.svg`);
      img.fileName = `artwork-${i.toString().padStart(2, '0')}.svg`;
      img.folderName = folder;
      images.push(img);
    }
  }
}

// p5.js Sketch
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(W, H);
  canvas.parent('walkerCanvas');
  textAlign(CENTER, CENTER);
  pixelDensity(5);

  // Prepare GUI
  prepareDatGUI();
}

function draw() {
  randomSeed(2);
  updateCanvasSize();
  resizeCanvas(W, H);
  // Set speed
  bmw.setSpeed(walkerSettings.speed);

  // Set Walker params
  bmw.setWalkerParam(
    walkerSettings.bodyStructure,
    walkerSettings.weight,
    walkerSettings.nervousness,
    walkerSettings.happiness
  );

  // Set Camera params
  bmw.setCameraParam(
    cameraSettings.azimuth,
    cameraSettings.angularVelocity,
    cameraSettings.elevation,
    cameraSettings.roll
  );

  // Set Translation params
  bmw.setTranslationParam(translationSettings.flagTranslation);

  // Drawing Part
  const markers = bmw.getMarkers(walkerSettings.walkerHeight);
  translate(W / 2, 50+ H / 2);

  // Choose colors
  let bgColor = 255;
  let lineColor = 30;
  if (canvasSettings.invert) {
    bgColor = 30;
    lineColor = 255;
  }
  background(bgColor);
  stroke(lineColor);

  // Draw lines first
  if (canvasSettings.line) {
    const lineMarkers = bmw.getLineMarkers(walkerSettings.walkerHeight);
    lineMarkers.forEach((m) => {
      line(m[0].x, m[0].y, m[1].x, m[1].y);
    });
  }

  // Draw dots next.
  if (canvasSettings.dot) {
    for (let marker of markers) {
      circle(marker.x, marker.y, canvasSettings.dotSize);
    }
  }

  // Draw descriptions of each dot.
  if (canvasSettings.description) {
    push();
    noStroke();
    fill(lineColor);
    markers.forEach((m, idx) => {
      text(idx, m.x, m.y + 20);
    });
    pop();
  }

  // Draw random or selected images at appropriate marker positions based on body part
  const bodyPartMarkerIndices = {
    'Heads': 0,
    'Torso': 8,
    'Left-Arm': 6,
    'Right-Arm': 3,
    'Left-Leg': 13,
    'Right-Leg': 10
  };

  for (const [part, markerIndex] of Object.entries(bodyPartMarkerIndices)) {
    if (bodyPartsImages[part] && markers.length > markerIndex) {
      imageMode(CENTER);
      push();
      if (part === 'Left-Arm') {
        translate(markers[markerIndex].x, markers[markerIndex].y);
        rotate(radians(random(-45, -30)));
        image(bodyPartsImages[part], -100, 0);
      } else if (part === 'Right-Arm') {
        translate(markers[markerIndex].x, markers[markerIndex].y);
        rotate(radians(random(30, 45)));
        image(bodyPartsImages[part], 100, 0);
      } else if (part === 'Left-Leg') {
        translate(markers[markerIndex].x, markers[markerIndex].y);
        rotate(radians(90+ random(10, 35)));
        image(bodyPartsImages[part], 50, 50);
        
      }
      else if (part === 'Right-Leg') {
        translate(markers[markerIndex].x, markers[markerIndex].y);
        rotate(radians(90+ random(-10, -35)));
        image(bodyPartsImages[part], 50, -50);
      }
      else if (part === 'Torso') {
        image(bodyPartsImages[part], markers[markerIndex].x, markers[markerIndex].y, bodyPartsImages[part].width * 2, bodyPartsImages[part].height * 2);
      } else {
        image(bodyPartsImages[part], markers[markerIndex].x, markers[markerIndex].y);
      }
      pop();
    }
  }

  // Show center for debug
  const showCenter = false;
  if (showCenter) {
    push();
    fill('red');
    circle(0, 0, 10);
    pop();
  }
}
