// p5.js Sketch integrated into center column
let W, H;
let selectedImage = null;
let selectedImageFolder = null;
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
          selectedImage = images.find(image => image.fileName === imgName);
          selectedImageFolder = imgElement.src.split('/')[imgElement.src.split('/').length - 2];
          console.log(`Selected image is from folder: ${selectedImageFolder}`);
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
  dot: true,
  dotSize: 6,
  description: true,
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
};

let images = [];

function preload() {
  const folders = ['Heads', 'Left-Arm', 'Left-Leg', 'Right-Arm', 'Right-Leg', 'Torso'];
  for (const folder of folders) {
    for (let i = 1; i <= 11; i++) {
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

  // Prepare GUI
  prepareDatGUI();
}

function draw() {
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
  translate(W / 2, H / 2);

  // Choose colors
  let bgColor = 220;
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
    for (let i = 0; i < markers.length; i++) {
      circle(markers[i].x, markers[i].y, canvasSettings.dotSize);
    }
  }

  // Draw descriptions of each dot.
  if (canvasSettings.description) {
    push();
    noStroke();
    fill(lineColor);
    markers.forEach((m, i) => {
      text(i, m.x, m.y + 20);
    });
    pop();
  }

  // Draw selected image at appropriate marker position based on folder
  if (selectedImage && markers.length > 1) {
    let i;
    switch (selectedImageFolder) {
      case 'Heads':
        i = 0;
        break;
      case 'Torso':
        i = 8;
        break;
      case 'Left-Arm':
        i = 6;
        break;
      case 'Right-Arm':
        i = 3;
        break;
      case 'Left-Leg':
        i = 13;
        break;
      case 'Right-Leg':
        i = 10;
        break;
      default:
        i = 0;
    }
    if (markers.length > i) {
      const imageIndex = images.findIndex(image => image.fileName === selectedImage.fileName && image.folderName === selectedImageFolder);
      if (imageIndex !== -1) {
        imageMode(CENTER);
        image(images[imageIndex], markers[i].x, markers[i].y);
      }
    }
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

