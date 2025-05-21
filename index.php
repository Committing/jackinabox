<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>HI Sandbox Area</title>
    <link rel="stylesheet" href="/css/styles.css" />
</head>
    <body>

        <div class="latest_version_check"></div>

        <canvas id="cube"></canvas>

        <div class="ui">

            <br /><span class="tiny_title">Line opacity</span><br />
            <button onclick="setLineOpacity(0);">0</button>
            <button onclick="setLineOpacity(0.1);">0.1</button>
            <button onclick="setLineOpacity(0.15);">0.15</button>
            <button onclick="setLineOpacity(0.2);">0.2</button>
            <button onclick="setLineOpacity(0.3);">0.3</button>
            <button onclick="setLineOpacity(0.5);">0.5</button>
            <button onclick="setLineOpacity(1);">1</button>

            <br /><span class="tiny_title">Sphere size</span><br />
            <button onclick="setSphereSize(0);">0</button>
            <button onclick="setSphereSize(1);">1</button>
            <button onclick="setSphereSize(1.5);">1.5</button>
            <button onclick="setSphereSize(2);">2</button>
            <button onclick="setSphereSize(3);">3</button>
            <button onclick="setSphereSize(5);">5</button>
            <button onclick="setSphereSize(10);">10</button>
            <hr />
            <button onclick="toggleWireFrame();">toggle_wireFrame</button>
            <button onclick="toggleWireframeOpacity();">toggle_wireFrame_opacity</button>
            <button onclick="startRotating();">start_rotating</button>
            <button onclick="stopRotating();">stop_rotating</button>
            <button onclick="rotateCameraCounterClockwise();">rotate_camera_left</button>
            <button onclick="rotateCameraClockwise();">rotate_camera_right</button>
            <button onclick="toggleClamp();">clamp_to_255_max</button>
            <button onclick="toggleGradientLines();">toggle_gradient_lines</button>
            <button onclick="togglePerspective();">switch_perspective</button>
            <button onclick="focusCamera(cubename);">focus_cube</button>
            <button onclick="detatchCamera();">detatch_focus</button>

            <button class="next_frame" onclick="loadNextFrame();">NEXT</button>
        </div>

        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="/javascript/box.js?v=<?=time();?>"></script>
        <script src="/javascript/main.js?v=<?=time();?>"></script>
    </body>
</html>