
/*

Fundamental cube commands:

var cubename = 'cube'; // id of canvas element
addBigCube(cubename, 0, 0, 0);
addBigLine(cubename, 0, 0, 0, 255, 255, 255);
addBigSphere(cubename, 100, 200, 200);

Available cube commands:

- addBigCube(name, x, y, z)
- addBigLine(cubeName, x1, y1, z1, x2, y2, z2)
- addBigSphere(cubeName, x, y, z)
- animateCameraToPosition(targetPositionData, duration = 1000)
- changeAllSphereSizes(cubeName, newSize)
- clearBigCube(cubeName)
- createCubeWireframe()
- focusCamera(cubeName)
- focusCameraToPosition(x, y, z)
- getAbsoluteCameraPosition()
- getCameraPosition()
- getCubePosition(cubeName)
- getCubeRotation(cubeName)
- hideCube(cubeName)
- moveCameraToAbsolutePosition(px, py, pz, rx, ry, rz)
- moveCube(cubeName, x, y, z)
- moveToCameraPosition(state)
- releaseCamera()
- rotateBigCube(cubeName, rotation)
- rotateCameraClockwise(speed = 0.05)
- rotateCameraCounterClockwise(speed = 0.05)
- setCubeRotation(cubeName, newRotation)
- setLineOpacity(opacity)
- setSphereSize(size)
- showCube(cubeName)
- startRotating(speed = 0.002)
- stopAnimatingToCameraPosition()
- stopRotating()
- toggleBrightLines(force_value = null)
- toggleClamp(override = null)
- toggleGradientLines()
- togglePerspective(on_or_off = null)
- toggleWireFrame()
- toggleWireframeOpacity()
- updateAllLinesGradient()

*/



// 'down' 'up'
var arrow_key_up    = 3600;
var arrow_key_left  = 6132;
var arrow_key_down  = 10572;
var arrow_key_right = 13141.5;

var limit_rotation_top_and_bottom = true;
var ajax_sounds = true; // ajax_sounds = false;
var white_line_default_color = 0.5; // 0.1 // setLineOpacity(0.1)
var current_sphere_size = 3; // 3
// setSphereSize(2)
// rotateCubesRandomly()

var basePanSpeed = 0.5;
var scalingFactor = 0.002;
var center_focus = [127.5, 127.5, 127.5];


// function resetBigCubes() {
//     for (let key in latest_box_data) {
//         if (latest_box_data.hasOwnProperty(key)) {
//             moveCube(key, 0, 0 ,0);
//         }
//     }
// }



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 50000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#cube'),
  antialias: true // Enable antialiasing
});
const cubes = {};
// Add new variables for camera focus state
let isCameraFocused = false;
let freeCameraState = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler()
};
let focusedCubePosition = new THREE.Vector3();
let spherical = new THREE.Spherical();
let isOrthographic = false; // Tracks whether we're in orthographic mode
let orthoCamera = null;     // Holds the orthographic camera instance

let isRotatingManually = false; // Renamed for clarity
let isRotatingAutomatically = false; // New variable for automatic rotation
let autoRotationSpeed = 0.002; // Default rotation speed
let isPanning = false;
let previousMousePosition = { x: 0, y: 0 };
let orthoHeight;

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 0, 800);

// Variable to track if the bright lines are currently at full opacity (1)
let areBrightLinesFullOpacity = false;
let isWireframeEnabled = true; // Track the wireframe state
let isWireframeOpacityLow = true; // Track if wireframe opacity is 0.2

// Animation variables
let isAnimatingCameraPosition = false;
let animationTargetPosition = new THREE.Vector3();
let animationTargetRotation = new THREE.Euler();
let animationStartTime = 0;
let animationDuration = 1000; // Default animation duration in milliseconds

// Add new variable for gradient lines toggle
let isGradientLinesEnabled = false;

// New variable to track the clamping state
let isClampingEnabled = true;
// Object to store the original positions of spheres and lines
const originalPositions = {};

// toggleClamp();




// Camera controls
const mouseDown = (e) => {
    e.preventDefault();
    // console.log('test');
    if (e.touches) {
        if (e.touches.length === 1) {
            isRotatingManually = true; // Updated variable name
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    } else {
        if (e.button === 0) isRotatingManually = true; // Updated variable name
        if (e.button === 2) isPanning = true;
        previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }
    // Stop camera animation on user interaction
    stopAnimatingToCameraPosition();
};

const mouseUp = () => {
    isRotatingManually = false; // Updated variable name
    isPanning = false;
};

function togglePerspective(on_or_off = null) {
    isOrthographic = on_or_off !== null ? on_or_off : !isOrthographic;
    if (isOrthographic) {
        let d;
        if (isCameraFocused) {
            d = spherical.radius; // Use distance from camera to focused cube/position
        } else {
            d = camera.position.length(); // Use distance from origin
        }
        const fovRad = (camera.fov * Math.PI) / 180;
        orthoHeight = 2 * d * Math.tan(fovRad / 2);
    }
}

// Focus camera on a specific cube
function focusCamera(cubeName) {
    const cube = cubes[cubeName];
    if (!cube) {
        console.error('Cube not found:', cubeName);
        return;
    }

    // Store current camera state
    freeCameraState.position.copy(camera.position);
    freeCameraState.rotation.copy(camera.rotation);

    // Calculate the cube's center position
    const size = 255; // Matches the size defined in createCubeWireframe
    const centerPos = cube.position.clone().add(new THREE.Vector3(size / 2, size / 2, size / 2));

    // Calculate camera's offset from the cube's center
    const offset = new THREE.Vector3().subVectors(camera.position, centerPos);
    spherical.setFromVector3(offset);

    // Store the cube's center position
    focusedCubePosition.copy(centerPos);
    isCameraFocused = true;

    // Optionally, make the camera look at the center immediately
    camera.lookAt(centerPos);
}

// New function to focus camera on a specific position
function focusCameraToPosition(x, y, z) {
    // Store current camera state
    freeCameraState.position.copy(camera.position);
    freeCameraState.rotation.copy(camera.rotation);

    // Set the focus position
    const targetPosition = new THREE.Vector3(x, y, z);
    focusedCubePosition.copy(targetPosition);
    isCameraFocused = true;

    // Calculate camera's offset from the target position
    const offset = new THREE.Vector3().subVectors(camera.position, targetPosition);
    spherical.setFromVector3(offset);

    // Make the camera look at the target position immediately
    camera.lookAt(targetPosition);
}

// Release camera back to free movement
function releaseCamera() {
    if (!isCameraFocused) return;

    // Restore original camera state
    camera.position.copy(freeCameraState.position);
    camera.rotation.copy(freeCameraState.rotation);
    isCameraFocused = false;
}

// Modified mouseMove handler
const mouseMove = (e) => {
    if (!isRotatingManually && !isPanning) return; // Updated variable name
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const deltaX = clientX - previousMousePosition.x;
    const deltaY = clientY - previousMousePosition.y;

    if (isRotatingManually) { // Updated variable name
        if (isCameraFocused) {
            // Orbit around focused position
            spherical.theta -= deltaX * 0.005;
            spherical.phi -= deltaY * 0.005;

            if (limit_rotation_top_and_bottom === true) {
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            }

            const offset = new THREE.Vector3().setFromSpherical(spherical);
            camera.position.copy(focusedCubePosition).add(offset);
            camera.lookAt(focusedCubePosition);
        } else {
            const euler = new THREE.Euler(camera.rotation.x, camera.rotation.y, camera.rotation.z, 'YXZ');
            euler.y -= deltaX * 0.005;
            euler.x -= deltaY * 0.005;
            euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
            camera.rotation.copy(euler);
        }
    } else if (isPanning) {
        // Determine panning speed based on camera distance
        let distance;
        if (isCameraFocused) {
            distance = spherical.radius;
        } else {
            distance = camera.position.length();
        }

        // Calculate pan speed: base speed + scaling based on distance
        // Adjust baseSpeed and scalingFactor as needed for desired feel // Adjust this value to control how much faster it gets when zoomed out
        const panSpeed = basePanSpeed + distance * scalingFactor;


        if (isCameraFocused) {
            // Pan the focused position
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            const rightDirection = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
            const upDirection = new THREE.Vector3().copy(camera.up).normalize();

            focusedCubePosition.add(rightDirection.multiplyScalar(-deltaX * panSpeed));
            focusedCubePosition.add(upDirection.multiplyScalar(deltaY * panSpeed));

            const offset = new THREE.Vector3().setFromSpherical(spherical);
            camera.position.copy(focusedCubePosition).add(offset);
            camera.lookAt(focusedCubePosition);
        } else {
            camera.translateX(-deltaX * panSpeed);
            camera.translateY(deltaY * panSpeed);
        }
    }

    previousMousePosition = { x: clientX, y: clientY };
};

// Modified zoom handler
const handleZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001;
    
    if (isOrthographic) {
        orthoHeight *= 1 + delta * 0.5; // Adjust zoom speed as needed
    } else if (isCameraFocused) {
        spherical.radius += delta * 50;
        // spherical.radius = Math.max(50, Math.min(1000, spherical.radius)); // clamping max zoom and min zoom
        const offset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(focusedCubePosition).add(offset);
        camera.lookAt(focusedCubePosition);
    } else {
        camera.translateZ(delta * 100);
    }
    // Stop camera animation on user interaction
    stopAnimatingToCameraPosition();
};

// New function to start automatic rotation with a speed parameter
function startRotating(speed = 0.002) {
    isRotatingAutomatically = true;
    autoRotationSpeed = speed;
}

// New function to stop automatic rotation
function stopRotating() {
    isRotatingAutomatically = false;
}

// Event listeners
renderer.domElement.addEventListener('mousedown', mouseDown);
renderer.domElement.addEventListener('mousemove', mouseMove);
renderer.domElement.addEventListener('mouseup', mouseUp);
renderer.domElement.addEventListener('mouseleave', mouseUp);
renderer.domElement.addEventListener('wheel', handleZoom);
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
    if (e.key === 'p') {
        togglePerspective();
    }
    // Add event listener for toggling bright lines (e.g., press 'l')
    if (e.key === 'l') {
        toggleBrightLines();
    }
    // Add event listener for toggling wireframe (e.g., press 'w')
    if (e.key === 'w') {
        toggleWireFrame();
    }
    // Add event listener for toggling wireframe opacity (e.g., press 'o')
    if (e.key === 'o') {
        toggleWireframeOpacity();
    }
    // Example key bindings for starting and stopping rotation
    if (e.key === 'r') {
        startRotating(0.01); // Start with a faster speed
    }
    if (e.key === 't') {
        startRotating(); // Start with the default speed
    }
    if (e.key === 's') {
        stopRotating();
    }

    if (e.key === '-') {
        clickPrevious();
    }

    if (e.key === '=') {
        clickNext();
    }

    // New key bindings for clockwise and counterclockwise rotation
    if (e.key === '[') {
        rotateCameraCounterClockwise(); // Use '=' for counterclockwise as it's visually similar
    }
    if (e.key === ']') {
        rotateCameraClockwise(); // Use '-' for clockwise
    }

    // New key binding for toggling clamp (e.g., press 'c')
    if (e.key === 'c') {
        toggleClamp();
    }

    // New key binding for toggling gradient lines (e.g., press 'g')
    if (e.key === 'g') {
        toggleGradientLines();
    }
});

// Touch events
renderer.domElement.addEventListener('touchstart', mouseDown);
renderer.domElement.addEventListener('touchmove', mouseMove);
renderer.domElement.addEventListener('touchend', mouseUp);

// New function to toggle gradient lines
function toggleGradientLines() {
    isGradientLinesEnabled = !isGradientLinesEnabled;
    console.log('Gradient Lines Enabled:', isGradientLinesEnabled);
    // When the toggle changes, update the colors of all existing lines
    updateAllLinesGradient();
}

// New function to update the colors of all user-added lines based on the current isGradientLinesEnabled state
function updateAllLinesGradient() {
    for (const cubeName in cubes) {
        if (cubes.hasOwnProperty(cubeName)) {
            const cubeGroup = cubes[cubeName];
            cubeGroup.children.forEach(child => {
                // Check if the child is a user-added line (type 'Line', not 'LineSegments' for wireframe)
                if (child.isLine && child.type === 'Line') {
                    const positionAttribute = child.geometry.attributes.position;
                    const colorAttribute = child.geometry.attributes.color;
                    const positionsArray = positionAttribute.array;
                    const colorsArray = colorAttribute.array;

                    // Get the current start and end positions from the geometry's position attribute
                    const x1 = positionsArray[0];
                    const y1 = positionsArray[1];
                    const z1 = positionsArray[2];
                    const x2 = positionsArray[3];
                    const y2 = positionsArray[4];
                    const z2 = positionsArray[5];

                    let color1, color2;

                    if (isGradientLinesEnabled) {
                        // Calculate gradient colors based on the current positions
                        // Use the position values directly for color calculation, as per requirement
                        color1 = new THREE.Color(x1 / 255, y1 / 255, z1 / 255);
                        color2 = new THREE.Color(x2 / 255, y2 / 255, z2 / 255);
                    } else {
                        // Set colors to white if gradient is disabled
                        color1 = new THREE.Color(1, 1, 1);
                        color2 = new THREE.Color(1, 1, 1);
                    }

                    // Update the colors array
                    colorsArray.set(color1.toArray(), 0); // Set color for the first vertex
                    colorsArray.set(color2.toArray(), 3); // Set color for the second vertex

                    // Mark the color attribute for update
                    colorAttribute.needsUpdate = true;

                    // material.needsUpdate is not strictly necessary if only attribute is changed, but safe
                    // child.material.needsUpdate = true;
                }
            });
        }
    }
}

function getCameraPosition() {

    var position = camera.position.clone();
    var rotation = camera.rotation.clone();

    console.log('position: ' + position.x + ', ' + position.y + ', ' + position.z);
    console.log('rotation: ' + rotation.x + ', ' + rotation.y + ', ' + rotation.z);

    return {
        position: position,
        rotation: rotation
    };
}

function moveCube(cubeName, x, y, z) {
    const cube = cubes[cubeName];
    if (!cube) {
        console.log('Cube not found:', cubeName);
        return;
    }
    cube.position.set(x, y, z);

    var xyz = getCubePosition(cubeName);
    // console.log('position of: ', cubeName, x, y, z)
}

function moveToCameraPosition(state) {
    camera.position.set(
        parseFloat(state.position.x),
        parseFloat(state.position.y),
        parseFloat(state.position.z)
    );
    camera.rotation.copy(state.rotation);
    // // Ensure the rotation order is set to 'YXZ' to match interaction handling
    // camera.rotation.order = 'YXZ';
    // camera.updateMatrixWorld();

    // When the camera is moved directly, it should no longer be considered focused.
    isCameraFocused = false;
}

function animateCameraToPosition(targetPositionData, duration = 1000) {
    if (!targetPositionData || !targetPositionData.position || !targetPositionData.rotation) {
        console.error('Invalid target position data provided.');
        return;
    }

    isAnimatingCameraPosition = true;
    animationTargetPosition.copy(targetPositionData.position);
    animationTargetRotation.copy(targetPositionData.rotation);
    animationStartTime = performance.now();
    animationDuration = duration;
}

function stopAnimatingToCameraPosition() {
    isAnimatingCameraPosition = false;
}

// Updated wireframe with gradient lines
function createCubeWireframe() {
    const edges = [];
    const size = 255;

    // X-axis edges (red gradient)
    for(const y of [0, size]) {
        for(const z of [0, size]) {
            edges.push({
                start: [0, y, z], end: [size, y, z],
                colors: [new THREE.Color(0, y/size, z/size), new THREE.Color(1, y/size, z/size)]
            });
        }
    }

    // Y-axis edges (green gradient)
    for(const x of [0, size]) {
        for(const z of [0, size]) {
            edges.push({
                start: [x, 0, z], end: [x, size, z],
                colors: [new THREE.Color(x/size, 0, z/size), new THREE.Color(x/size, 1, z/size)]
            });
        }
    }

    // Z-axis edges (blue gradient)
    for(const x of [0, size]) {
        for(const y of [0, size]) {
            edges.push({
                start: [x, y, 0], end: [x, y, size],
                colors: [new THREE.Color(x/size, y/size, 0), new THREE.Color(x/size, y/size, 1)]
            });
        }
    }

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    edges.forEach(edge => {
        vertices.push(...edge.start, ...edge.end);
        colors.push(...edge.colors[0].toArray(), ...edge.colors[1].toArray());
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ vertexColors: true })
    );
}

// Fixed cube positioning
function addBigCube(name, x, y, z) {
    if (cubes[name]) return 'cube_exists';
    
    const cubeGroup = new THREE.Group();
    const wireframe = createCubeWireframe();
    
    cubeGroup.add(wireframe);
    cubeGroup.position.set(x, y, z);
    scene.add(cubeGroup);
    cubes[name] = cubeGroup;
    
    // Initialize accumulated rotation matrix
    cubeGroup.userData.rotationMatrix = new THREE.Matrix4();
}

// Color-coded spheres
function addBigSphere(cubeName, x, y, z) {
    const cube = cubes[cubeName];
    if (!cube) return;

    // Clamp the new sphere coordinates if clamping is enabled
    if (isClampingEnabled) {
        x = Math.max(0, Math.min(255, x));
        y = Math.max(0, Math.min(255, y));
        z = Math.max(0, Math.min(255, z));
    }

    const color = new THREE.Color(x/255, y/255, z/255);
    
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshBasicMaterial({ color: color })
    );
    sphere.position.set(x, y, z);
    cube.add(sphere);
    
    // Apply accumulated rotation to the new sphere
    sphere.applyMatrix4(cube.userData.rotationMatrix);
}

function addBigLine(cubeName, x1, y1, z1, x2, y2, z2) {
    const cube = cubes[cubeName];
    if (!cube) {
        console.error('Cube not found:', cubeName);
        return;
    }

    // Store original coordinates before potential clamping
    const originalX1 = x1, originalY1 = y1, originalZ1 = z1;
    const originalX2 = x2, originalY2 = y2, originalZ2 = z2;

    // Apply clamping if enabled - this affects the initial position attribute values
    if (isClampingEnabled) {
        x1 = Math.max(0, Math.min(255, x1));
        y1 = Math.max(0, Math.min(255, y1));
        z1 = Math.max(0, Math.min(255, z1));
        x2 = Math.max(0, Math.min(255, x2));
        y2 = Math.max(0, Math.min(255, y2));
        z2 = Math.max(0, Math.min(255, z2));
    }

    const geometry = new THREE.BufferGeometry();
    // Use the potentially clamped coordinates for the initial position attribute
    const vertices = [x1, y1, z1, x2, y2, z2];
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const colors = [];
    // Determine initial colors based on the current gradient toggle state and the vertex positions
    if (isGradientLinesEnabled) {
        // Use the vertex positions (which are potentially clamped) to calculate the initial gradient colors
        const color1 = new THREE.Color(x1 / 255, y1 / 255, z1 / 255);
        const color2 = new THREE.Color(x2 / 255, y2 / 255, z2 / 255);
        colors.push(...color1.toArray(), ...color2.toArray());
    } else {
        // Default to white if gradient is disabled
        const whiteColor = new THREE.Color(1, 1, 1);
        colors.push(...whiteColor.toArray(), ...whiteColor.toArray());
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Material setup remains the same - always ready for vertex colors and opacity
    const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 1, opacity: white_line_default_color, transparent: true });
    const line = new THREE.Line(geometry, material);

    // Store original unclamped positions for use when clamping is toggled off
    line.userData.originalPositions = [originalX1, originalY1, originalZ1, originalX2, originalY2, originalZ2];

    cube.add(line);

    // Apply accumulated rotation to the new line
    line.applyMatrix4(cube.userData.rotationMatrix);
}

function rotateBigCube(cubeName, rotation) {
    const cube = cubes[cubeName];
    if (!cube) return;

    const size = 255;
    const center = new THREE.Vector3(size / 2, size / 2, size / 2);
    
    const matrix = new THREE.Matrix4();
    const translationToOrigin = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
    const translationBack = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
    
    matrix.multiply(translationBack).multiply(rotationMatrix).multiply(translationToOrigin);
    
    cube.children.forEach(child => {
        child.applyMatrix4(matrix);
    });
    
    // Update the accumulated rotation matrix by pre-multiplying the new matrix
    cube.userData.rotationMatrix.premultiply(matrix); // Changed from multiply to premultiply

}

function setCubeRotation(cubeName, newRotation) {
    const cube = cubes[cubeName];
    if (!cube) {
        console.error('Cube not found:', cubeName);
        return;
    }

    const size = 255;
    // Calculate the cube's local center relative to its own origin (0,0,0)
    const center = new THREE.Vector3(size / 2, size / 2, size / 2);

    // Get the current accumulated transformation matrix from userData.
    // This matrix represents the total effect of previous rotateBigCube calls
    // on the children's initial local matrices (which are their initial translation matrices).
    const currentAccumulatedMatrix = cube.userData.rotationMatrix.clone();

    // Calculate the desired total transformation matrix based on the new absolute rotation.
    // This matrix represents the transformation that, when applied to a child's
    // initial local matrix (Translation(x,y,z)), will result in the child being
    // in the desired absolute orientation, rotated around the cube's local center.
    const desiredTotalMatrix_centered = new THREE.Matrix4();
    const translationToOrigin_center = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
    // Create the desired rotation matrix around the origin
    const rotationMatrix_desired = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(newRotation.x, newRotation.y, newRotation.z));
    const translationBack_center = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);

    // Combine translations and rotation to get the desired total transformation matrix applied around the center
    desiredTotalMatrix_centered.multiply(translationBack_center).multiply(rotationMatrix_desired).multiply(translationToOrigin_center);

    // Calculate the matrix M that needs to be applied to each child's *current local matrix*
    // to move it from the state represented by `currentAccumulatedMatrix` to the state
    // represented by `desiredTotalMatrix_centered`.
    // Child's current local matrix = currentAccumulatedMatrix * InitialChildLocalMatrix
    // We want Child's new local matrix = desiredTotalMatrix_centered * InitialChildLocalMatrix
    // Applying M using applyMatrix4 (premultiplication): NewLocalMatrix = M * CurrentLocalMatrix
    // So, M * (currentAccumulatedMatrix * InitialChildLocalMatrix) = desiredTotalMatrix_centered * InitialChildLocalMatrix
    // M * currentAccumulatedMatrix = desiredTotalMatrix_centered
    // M = desiredTotalMatrix_centered * inverse(currentAccumulatedMatrix)

    // Calculate the inverse of the current accumulated matrix
    const inverseCurrentAccumulatedMatrix = new THREE.Matrix4().copy(currentAccumulatedMatrix).invert();

    // Check if the inverse operation was successful (determinant is non-zero)
    if (inverseCurrentAccumulatedMatrix.determinant() === 0) {
         console.error("Cannot set cube rotation: current accumulated matrix is singular.");
         // Depending on requirements, you might try to reset the cube's state here
         // or handle this error appropriately.
         return;
    }


    // Calculate the transformation matrix to apply to the children
    const matrixToApplyToChildren = desiredTotalMatrix_centered.clone().multiply(inverseCurrentAccumulatedMatrix);

    // Apply the calculated difference matrix to each child's local matrix.
    // This transitions the child from its current transformed state to the desired transformed state.
    cube.children.forEach(child => {
        // Assuming all children (including the wireframe if it's a child) should be rotated.
        child.applyMatrix4(matrixToApplyToChildren);
    });

    // Update the accumulated rotation matrix to the new desired total transformation.
    // This represents the cumulative effect of all rotations applied to the initial child states.
    cube.userData.rotationMatrix.copy(desiredTotalMatrix_centered);

    // Note: If you need to get the Euler angles of the cube's current rotation,
    // you would need to extract the rotation component from the updated
    // cube.userData.rotationMatrix (which includes translation) and then
    // convert that rotation matrix to Euler angles. This is not straightforward
    // because the matrix is a combined transformation. A cleaner approach
    // would be to store the pure accumulated rotation matrix and apply
    // centering consistently during rendering or transformation.
}


function clearBigCube(cubeName) {
    var cube = cubes[cubeName];
    if (!cube) return;

    var toRemove = [];

    for (var i = 0; i < cube.children.length; i++) {
        var child = cube.children[i];
        if (child.type !== 'LineSegments') {
            toRemove.push(child);
        }
    }

    for (var j = 0; j < toRemove.length; j++) {
        var childToRemove = toRemove[j];
        cube.remove(childToRemove);

        // Explicitly dispose of geometry and material
        if (childToRemove.geometry) {
            childToRemove.geometry.dispose();
        }
        if (childToRemove.material) {
            if (Array.isArray(childToRemove.material)) {
                childToRemove.material.forEach(material => material.dispose());
            } else {
                childToRemove.material.dispose();
            }
        }
    }
}

function toggleBrightLines(force_value = null) {
    // Store the target opacity based on the toggle state
    const targetOpacity = (force_value !== null) ? (force_value ? 1 : white_line_default_color) : (areBrightLinesFullOpacity ? white_line_default_color : 1);

    scene.traverse(function (object) {
        // Check if it's a Line object added by addBigLine, exclude the wireframe (LineSegments)
        if (object.isLine && object.type === 'Line') {
            const material = object.material;
            // The original check was: material.vertexColors && material.linewidth === 1 && material.transparent
            // The new lines always have vertexColors: true, linewidth: 1, transparent: true
            // So we can just check the type and if it's a Line.
            if (material) { // Basic check if material exists
                 material.opacity = targetOpacity;
                 material.transparent = true; // Ensure transparency is enabled
                 material.needsUpdate = true; // Important to trigger material update
            }
        }
    });

    // Update the state variable
    areBrightLinesFullOpacity = (targetOpacity === 1);
    console.log('Bright Lines Full Opacity:', areBrightLinesFullOpacity);
}

function toggleWireFrame() {
    isWireframeEnabled = !isWireframeEnabled;
    for (const cubeName in cubes) {
        if (cubes.hasOwnProperty(cubeName)) {
            const cubeGroup = cubes[cubeName];
            // Assuming the wireframe is the first child of the group
            if (cubeGroup.children.length > 0 && cubeGroup.children[0].type === 'LineSegments') {
                cubeGroup.children[0].visible = isWireframeEnabled;
            }
        }
    }
}

function toggleWireframeOpacity() {
    isWireframeOpacityLow = !isWireframeOpacityLow;
    for (const cubeName in cubes) {
        if (cubes.hasOwnProperty(cubeName)) {
            const cubeGroup = cubes[cubeName];
            // Assuming the wireframe is the first child of the group
            if (cubeGroup.children.length > 0 && cubeGroup.children[0].type === 'LineSegments') {
                const wireframe = cubeGroup.children[0];
                const material = wireframe.material;
                material.opacity = isWireframeOpacityLow ? 0.2 : 1;
                material.transparent = true;
                material.needsUpdate = true;
            }
        }
    }
}

function hideCube(cubeName) {
    const cube = cubes[cubeName];
    if (cube) {
        cube.visible = false;
    } else {
        console.log('Cube not found:', cubeName);
    }
}

function showCube(cubeName) {
    const cube = cubes[cubeName];
    if (cube) {
        cube.visible = true;
    } else {
        console.log('Cube not found:', cubeName);
    }
}


function toggleClamp(override = null) {
    isClampingEnabled = !isClampingEnabled;

    if (override !== null) {
        isClampingEnabled = override;
    }

    for (const cubeName in cubes) {
        if (cubes.hasOwnProperty(cubeName)) {
            const cube = cubes[cubeName];
            if (isClampingEnabled) {
                // Store original positions if not already stored
                if (!originalPositions[cubeName]) {
                    originalPositions[cubeName] = [];
                    cube.children.forEach(child => {
                        if (child.type === 'Mesh') {
                            originalPositions[cubeName].push({
                                object: child,
                                position: child.position.clone(),
                                isLine: false // Flag to identify spheres
                            });
                        } else if (child.type === 'Line') {
                            const positions = child.geometry.attributes.position.array.slice();
                            originalPositions[cubeName].push({
                                object: child,
                                positions: positions,
                                isLine: true // Flag to identify lines
                            });
                        }
                    });
                }
                // Clamp positions
                cube.children.forEach(child => {
                    if (child.type === 'Mesh') {
                        child.position.x = Math.max(0, Math.min(255, child.position.x));
                        child.position.y = Math.max(0, Math.min(255, child.position.y));
                        child.position.z = Math.max(0, Math.min(255, child.position.z));
                    } else if (child.type === 'Line') {
                        const positions = child.geometry.attributes.position.array;
                        for (let i = 0; i < positions.length; i += 3) {
                            positions[i] = Math.max(0, Math.min(255, positions[i])); // x
                            positions[i + 1] = Math.max(0, Math.min(255, positions[i + 1])); // y
                            positions[i + 2] = Math.max(0, Math.min(255, positions[i + 2])); // z
                        }
                        child.geometry.attributes.position.needsUpdate = true;
                    }
                });
            } else {
                // Restore original positions
                if (originalPositions[cubeName]) {
                    originalPositions[cubeName].forEach(item => {
                        if (!item.isLine) {
                            item.object.position.copy(item.position);
                        } else {
                            item.object.geometry.attributes.position.array.set(item.positions);
                            item.object.geometry.attributes.position.needsUpdate = true;
                        }
                    });
                }
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isAnimatingCameraPosition) {
        const currentTime = performance.now();
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(1, elapsedTime / animationDuration);

        camera.position.lerp(animationTargetPosition, progress);
        camera.rotation.set(
            THREE.MathUtils.lerp(camera.rotation.x, animationTargetRotation.x, progress),
            THREE.MathUtils.lerp(camera.rotation.y, animationTargetRotation.y, progress),
            THREE.MathUtils.lerp(camera.rotation.z, animationTargetRotation.z, progress),
            'YXZ' // Assuming your camera rotation order is YXZ
        );

        if (progress === 1) {
            isAnimatingCameraPosition = false;
        }
    } else if (isRotatingAutomatically && isCameraFocused) {
        spherical.theta += autoRotationSpeed; // Use the stored rotation speed
        const offset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(focusedCubePosition).add(offset);
        camera.lookAt(focusedCubePosition);
    }

    if (isOrthographic) {
        if (!orthoCamera) {
            orthoCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, -20000, 20000);
        }
        orthoCamera.position.copy(camera.position);
        orthoCamera.rotation.copy(camera.rotation);
        
        const aspect = window.innerWidth / window.innerHeight;
        const width = orthoHeight * aspect;
        orthoCamera.left = -width / 2;
        orthoCamera.right = width / 2;
        orthoCamera.top = orthoHeight / 2;
        orthoCamera.bottom = -orthoHeight / 2;
        
        // Dynamically adjust near and far planes to include the cube
        let d;
        if (isCameraFocused) {
            d = spherical.radius;
        } else {
            d = camera.position.length();
        }
        const cubeHalfDiagonal = (255 / 2) * Math.sqrt(3); // Cube size is 255
        const nearPlane = d - cubeHalfDiagonal;
        const farPlane = d + cubeHalfDiagonal;
        orthoCamera.near = 10000; // Math.max(0.1, nearPlane);
        orthoCamera.far = -10000; // Math.max(farPlane, orthoCamera.near + 0.1);
        
        orthoCamera.updateProjectionMatrix();
        
        renderer.render(scene, orthoCamera);
    } else {
        renderer.render(scene, camera);
    }
}


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



function getCubePosition(cubeName) {
    const cube = cubes[cubeName];
    if (cube) {
        return {
            x: cube.position.x,
            y: cube.position.y,
            z: cube.position.z
        };
    } else {
        console.log('Cube not found:', cubeName);
        return null;
    }
}
function setSphereSize(size) {
    for (let key in latest_box_data) {
      if (latest_box_data.hasOwnProperty(key)) {
        changeAllSphereSizes(key, size);
      }
    }
}

function setLineOpacity(opacity) {
    white_line_default_color = opacity;

    // Update the opacity of all existing user-added lines
    scene.traverse(function (object) {
        if (object.isLine && object.type === 'Line') { // Only affect user-added lines
            const material = object.material;
            if (material) {
                material.opacity = white_line_default_color;
                material.transparent = true; // Ensure transparency is enabled
                material.needsUpdate = true;
            }
        }
    });

    // Update the state variable for the next toggleBrightLines call
    // If the default opacity is 1, consider bright lines to be full opacity
    areBrightLinesFullOpacity = (white_line_default_color === 1);
}

function changeAllSphereSizes(cubeName, newSize) {
    current_sphere_size = newSize;

    const cube = cubes[cubeName];
    if (!cube) {
        console.error('Cube not found:', cubeName);
        return;
    }

    let spheresChanged = 0;

    // Iterate through all children of the cube group
    cube.children.forEach(child => {
        // Check if the child is a Mesh and not the wireframe (which is LineSegments)
        if (child.isMesh && !(child instanceof THREE.LineSegments)) {
            // Dispose of the old geometry to free up memory
            if (child.geometry) {
                child.geometry.dispose();
            }

            // Create new geometry with the desired size
            const newGeometry = new THREE.SphereGeometry(newSize);

            // Assign the new geometry to the sphere
            child.geometry = newGeometry;

            spheresChanged++;
        }
    });

}
function getCubeRotation(cubeName) {
    const cube = cubes[cubeName];

    if (cube) {
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.copy(cube.userData.rotationMatrix);

        // Create a dummy object to extract rotation from the matrix
        const dummyObject = new THREE.Object3D();
        dummyObject.applyMatrix4(rotationMatrix);

        const radToDeg = 180 / Math.PI;

        return {
            x: dummyObject.rotation.x * radToDeg,
            y: dummyObject.rotation.y * radToDeg,
            z: dummyObject.rotation.z * radToDeg
        };
    } else {
        console.log('Cube not found:', cubeName);
        return null;
    }
}
function getAbsoluteCameraPosition() {
    const position = camera.position.clone();
    const rotation = camera.rotation.clone();

    console.log('Absolute position: ' + position.x + ', ' + position.y + ', ' + position.z);
    console.log('Absolute rotation: ' + rotation.x + ', ' + rotation.y + ', ' + rotation.z);

    console.log('moveCameraToAbsolutePosition(' + position.x + ', ' + position.y + ', ' + position.z + ', ' + rotation.x + ', ' + rotation.y + ', ' + rotation.z + ');');

    return {
        position: position,
        rotation: rotation
    };
}
function moveCameraToAbsolutePosition(px, py, pz, rx, ry, rz) {
    camera.position.set(px, py, pz);
    camera.rotation.set(rx, ry, rz, 'YXZ'); // Assuming 'YXZ' rotation order

    // Ensure the camera is no longer in a focused state
    isCameraFocused = false;
}
// New function to rotate the camera clockwise (Local Roll)
function rotateCameraClockwise(speed = 0.05) { // Adjusted default speed slightly
    // Get the camera's forward direction (local Z-axis in world space)
    const axis = new THREE.Vector3();
    camera.getWorldDirection(axis);

    // Create a quaternion for the rotation around the forward axis
    const rotationQuaternion = new THREE.Quaternion();
    // Negative speed for clockwise roll
    rotationQuaternion.setFromAxisAngle(axis, -speed);

    // Apply the rotation to the camera's current quaternion (local rotation)
    // premultiply applies the rotation before the current one, achieving local rotation
    camera.quaternion.premultiply(rotationQuaternion);

    // Update the camera's Euler rotation from the new quaternion
    // This keeps the Euler angles in sync, ensuring consistency if they are used elsewhere.
    // Make sure the camera's rotation order is set correctly (e.g., 'YXZ' from your mouseMove)
    camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);

    // Important Note: If isCameraFocused is true, the camera.lookAt() call in the
    // animate loop or mouseMove will immediately counteract this roll rotation
    // by resetting the camera's rotation to point directly at the focus point,
    // effectively removing the roll. This roll works best in the unfocused state
    // or if you modify the focused state logic not to continuously call lookAt.
}

// New function to rotate the camera counterclockwise (Local Roll)
function rotateCameraCounterClockwise(speed = 0.05) { // Adjusted default speed slightly
    // Get the camera's forward direction (local Z-axis in world space)
    const axis = new THREE.Vector3();
    camera.getWorldDirection(axis);

    // Create a quaternion for the rotation around the forward axis
    const rotationQuaternion = new THREE.Quaternion();
    // Positive speed for counterclockwise roll
    rotationQuaternion.setFromAxisAngle(axis, speed);

    // Apply the rotation to the camera's current quaternion (local rotation)
    // premultiply applies the rotation before the current one, achieving local rotation
    camera.quaternion.premultiply(rotationQuaternion);

    // Update the camera's Euler rotation from the new quaternion
    // This keeps the Euler angles in sync, ensuring consistency if they are used elsewhere.
    // Make sure the camera's rotation order is set correctly (e.g., 'YXZ' from your mouseMove)
    camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);

    // Important Note: If isCameraFocused is true, the camera.lookAt() call in the
    // animate loop or mouseMove will immediately counteract this roll rotation
    // by resetting the camera's rotation to point directly at the focus point,
    // effectively removing the roll. This roll works best in the unfocused state
    // or if you modify the focused state logic not to continuously call lookAt.
}

function detatchCamera() {
    isOrthographic = false;
    moveToCameraPosition({
        position: new THREE.Vector3(-186.87585086051544, 338.6884381814538, 713.67419167353),
        rotation: new THREE.Euler(-0.3458058503908643, -0.023068976642661495, -0.008310425402397292)
    });
}