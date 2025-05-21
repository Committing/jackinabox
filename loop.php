<?php

# Use same logic with any language.
# For displaying in an rgb cube 2d or 3d.
# Only lines and dots

session_start(); # for looping data around
// unset($_SESSION['loop']);
require_once('jackinabox.class.php');

# initiate class
$i = new box();

# set starting color variables
$c1 = $c2 = [127.5, 255, 127.5];
$s1 = $s2 = [127.5, 0, 127.5];

# override variables if looping (not first loop)
if ( isset($_SESSION['loop']) && ! empty($_SESSION['loop']) ) {
    # c1 and s1 are now swapped.
    # c2 and s2 are now swapped.
    $c1 = $_SESSION['loop']['s1'];
    $c2 = $_SESSION['loop']['s2'];
    $s1 = $_SESSION['loop']['c1'];
    $s2 = $_SESSION['loop']['c2'];
}

# run the main interaction
$result_c = $i->interaction($c1, $s1);
$result_s = $i->interaction($s2, $c2);

# save output for next loop
$_SESSION['loop'] = [
    'c1' => $result_c['c']['cs'],
    'c2' => $result_s['c']['cs'],
    's1' => $result_c['s']['cs'],
    's2' => $result_s['s']['cs'],
];


// $i->testOutputManually();

# return the process's ouput for displaying in an rgb cube
echo json_encode( [ 'box' => $i->box ], JSON_PRETTY_PRINT);
exit;


