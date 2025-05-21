



var cubename = 'cube';

var latest_box_data = [];





function loadNextFrame() {

    $('.next_frame').addClass('noclick');

    $.ajax({
        type: 'POST',
        url: '/loop.php',
        data: {},
        beforeSend: function() {
            console.log('Sending request...');
        },
        success: function(data) {

            latest_box_data = [];

            var data = JSON.parse(data);



            latest_box_data[cubename] = data.box.main_cube;

            clearBigCube(cubename);

            for (let i = 0; i < data.box.main_cube.length; i++) {

                const item = data.box.main_cube[i];

                try {
                    if (item.type == 'line') {
                        addBigLine(cubename, ...item.position[0], ...item.position[1]);
                    } else {
                        addBigSphere(cubename, ...item.position);
                    }
                } catch (err) {
                    console.error("Error at index:", i, err);
                }

            }

            $('.next_frame').removeClass('noclick');

            // console.log('Response:', data);
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error:', status, error);
        }
    });

}









$(function() {



    animate();

    addBigCube(cubename, 0, 0, 0);

    loadNextFrame();







    // ajax call
    // $('.latest_version_check').show();





});