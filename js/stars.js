
var dsos = Papa.parse(window.dsoData, {header: true, download: false}).data;
var objs = Papa.parse(window.csvData, {header: true, download: false}).data;
var numobjs = objs.length;
var numdsos = dsos.length;

var thisinterval = null;
const init_dir = 0;

// Function to convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Function to convert radians to degrees
  function radToDeg(radians) {
    return radians * (180 / Math.PI);
  }
  
  // Function to calculate the current RA of the celestial meridian
  function calculateMeridianRA(utc, longitude) {
    // Calculate the Sidereal Time
    const jd = (utc / 86400) + 2440587.5; // Julian Date
    const t_eph = (jd - 2451545.0) / 36525; // Julian centuries since J2000.0
    const theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t_eph * t_eph - t_eph * t_eph * t_eph / 38710000; // Greenwich Mean Sidereal Time in degrees
    const gmst = theta % 360; // Convert GMST to within [0, 360] degrees
  
    // Calculate the Local Sidereal Time
    const lst = gmst + longitude; // Local Sidereal Time
  
    // The RA of the celestial meridian is equal to the Local Sidereal Time
    return lst % 360; // Convert RA to within [0, 360] degrees
  }

//var dir = 360-meridianRA;
var dir = init_dir;

const init_speed = 100;
var rotation_speed = init_speed;

var histobins = Array(120).fill(0);
var binned = false;

var precession_adjustment = 50;  //arc second per year
var initial_meridan = 12;
var initial_month = 1;
var initial_day = 22;
var initial_year = 2024;
var initial_hour = 11;
var initial_min = 59;
var initial_sec = 48;
var current_julian = new Date().getTime()/86400000 + 2440587.5 ;  // 2460364.000694
var meridan_julian = 2460364.209028;

var displayDSO = false;
var displayMessier = false;
var displayStars = true;

var maxstarmag = 3.7;

var radian = 180.0 / Math.PI;
var lat = toDecimalDec(39,51,8.7);  // latitude
lat = -(90.0 - lat);

var sindec = Math.sin(toRadians(lat));
var cosdec = Math.cos(toRadians(lat));

var cosdir = Math.cos(toRadians(dir));
var sindir = Math.sin(toRadians(dir));

var speed = 1;

function toRadians(deg) {
	return deg / radian;	
}

function toDecimalRA(h,m,s) {
	var deg = h + (m/60.0) + (s/3600.0);
	return deg * 15.0;
}

function toDecimalDec(d,m,s) {
	return d + (m/60.0) + (s/3600.0);
}

function parsecToLightyears(dist) {
    const parsec = 3.26; // lightyears in a parsec
    return (dist*parsec).toFixed(2);
}


function xy_to_ra_dec(x, y, z) {
    ra_dec = [];
    theta = 0; // dec
    phi = 0; // ra

    theta = Math.atan(y/x);
    phi = 90 - Math.acos(z/Math.sqrt(horizonradius));

    ra_dec[0] = theta;
    ra_dec[1] = phi;

    return ra_dec;
}

function increase_star_mag() {
    maxstarmag += 0.1;
    rotateSpace();
}

function decrease_star_mag() {
    maxstarmag -= 0.1;
    rotateSpace();
}

var dirchange = 1;

function lookleft() {
    dir += dirchange;
    if (dir >= 360) {
        dir = 0;
    }
    cosdir = Math.cos(toRadians(dir));
    sindir = Math.sin(toRadians(dir));
    rotateSpace();
}

function lookright() {
    dir -= dirchange;
    if (dir < 0) {
        dir = 355;
    }
    cosdir = Math.cos(toRadians(dir));
    sindir = Math.sin(toRadians(dir));
    rotateSpace();
}

function findstarsize(mag) {
    var thissize = 1;
    if (mag <= 4) thissize = 1;
    if (mag <= 3.5) thissize = 1;
    if (mag <= 3.0) thissize = 2;
    if (mag <= 2.5) thissize = 2;
    if (mag <= 2.3) thissize = 2;
    if (mag <= 2) thissize = 3;
    if (mag <= 1) thissize = 3;
    if (mag <= 0) thissize = 3;
    if (mag <= -0.5) thissize = 3;
    if (mag <= -1) thissize = 4;
    
    return thissize;
}

function binmag(value) {
    var mag = parseFloat(value) + 30;
    min = Math.floor(mag);
    max = Math.floor(mag+0.5);
    if (min == max) {
        thisbin = min*2 ;
    }
    else {
        thisbin = min*2 + 1;
    }
//    console.log(value + " : " + thisbin);
    histobins[thisbin] +=1;
}

function printhisto() {
    for (i = 0; i < histobins.length; i++) {
//        console.log((i/2-30) + ": " + histobins[i]);
    }
}

var x2stars = [];
var x2dso = [];
var coords = [];

var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();

var context = canvas.getContext("2d");
//var mouselocfield = document.getElementById("mouseloc");

var centerX = canvas.width / 2;
var centerY = canvas.height / 2;

var starradius = 4;
var gridradius = 1;
var horizonradius = -(canvas.width / 2)*1.49;
var ra_change = 0;

canvas.addEventListener("mousedown", doMouseDown, false);
canvas.addEventListener("mousemove", doMouseMove, false);

//refresh screen on stellar class toggle
$('#O').change(function() {
    rotateSpace();    
});
$('#B').change(function() {
    rotateSpace();    
});
$('#A').change(function() {
    rotateSpace();    
});
$('#F').change(function() {
    rotateSpace();    
});
$('#G').change(function() {
    rotateSpace();    
});
$('#K').change(function() {
    rotateSpace();    
});
$('#M').change(function() {
    rotateSpace();    
});

// refresh screen on DSO toggle
$('#gal').change(function() {
    rotateSpace();    
});
$('#neb').change(function() {
    rotateSpace();    
});
$('#pn').change(function() {
    rotateSpace();    
});
$('#oc').change(function() {
    rotateSpace();    
});
$('#gc').change(function() {
    rotateSpace();    
});
$('#other_dso').change(function() {
    rotateSpace();    
});

function doMouseDown(e) {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    var thisstar = checkForStar(x, y);
    if (thisstar != -1) {
        printstar(thisstar);
        return;
    }

    if (displayMessier) {
        var thismessier = checkForMessier(x, y);
        if (thismessier != -1) {
            printdso(thismessier);
            return;
        }
    }
 
    if (displayDSO) {
        var thisdso = checkForDSO(x, y);
        if (thisdso != -1) {
            printdso(thisdso);
            return;
        }
    }
}

function printDSOType(dsotype) {
    var thistype = dsotype;
    switch (dsotype) {
        case "Gxy":
            thistype = "Galaxy";
            break; 
        case "GxyCld":
            thistype = "Bright Nebula";
            break;
        case "Neb":
            thistype = "Nebula";
            break;
        case "OC":
            thistype = "Open Cluster";
            break;
        case "OC+Neb":
            thistype = "Open Cluster + Nebula";
            break;
        case "GC":
            thistype = "Globular Cluster";
            break;
        case "PN":
            thistype = "Planetary Nebula";
            break;
        case "Ast":
            thistype = "Other";
            break;
        default:
    }
    return thistype;
}

function printstar(i) {
    thisstar = objs[x2stars[i].index];
    alerttext = thisstar.bf + "\n";
    if (thisstar.proper != "") alerttext += "Proper Name: " + thisstar.proper + "\n";
    alerttext += "Apparent Mag: " + thisstar.mag+ "\n";
    alerttext += "Distance: " + parsecToLightyears(thisstar.dist) + " ly\n";
    alerttext += "Classification: " + (thisstar.spect).substring(0, 2) + "\n";
    $('#mouseloc').val(alerttext);
}

function printdso(i) {
    thisdso = dsos[x2dso[i].index];
    alerttext = thisdso.cat1 + " " + thisdso.id1 + "\n";
    if (thisdso.name != "") alerttext += thisdso.name + "\n";
    alerttext += "DSO Type: " + printDSOType(thisdso.type) + "\n";
    $('#mouseloc').val(alerttext);
}

function updateMouseLocField(x,y) {
    var rd = xy_to_ra_dec(y,x,horizonradius);
//    $('#mouseloc').val(rd[0].toString() + " " + rd[1].toString());
    $('#mouseloc').val("x: " + x + " , y: " + y);
}

function doMouseMove(e) {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
//    updateMouseLocField(x, y);
}

var xthreshold = 4;
var ythreshold = 4;

function checkForStar(x,y) {
    for (i=0; i < x2stars.length;i++) {
        var thisx = x2stars[i].x;
        var thisy = x2stars[i].y;
        if (Math.abs(Math.abs(thisx) - x) <= xthreshold) {
            if (Math.abs(Math.abs(thisy) - y) <= ythreshold) {
                return i;
            }
        }
    }
    return -1;
}

function checkForDSO(x,y) {
    for (i=0; i < x2dso.length;i++) {
        var thisx = x2dso[i].x;
        var thisy = x2dso[i].y;
        if (Math.abs(Math.abs(thisx) - x) <= xthreshold) {
            if (Math.abs(Math.abs(thisy) - y) <= ythreshold) {
                if (dsos[x2dso[i].index].cat1 != "M") {
                    return i;
                }
            }
        }
    }
    return -1;
}

function checkForMessier(x,y) {
    for (i=0; i < x2dso.length;i++) {
        var thisx = x2dso[i].x;
        var thisy = x2dso[i].y;
        if (Math.abs(Math.abs(thisx) - x) <= xthreshold) {
            if (Math.abs(Math.abs(thisy) - y) <= ythreshold) {
                if (dsos[x2dso[i].index].cat1 == "M") {
                    return i;
                }
            }
        }
    }
    return -1;
}

var dsotype_set = new Set;
dsotype_set.add("Gxy"); // galaxy
dsotype_set.add("GxyCld"); // bright nebula
dsotype_set.add("Neb"); // nebula
dsotype_set.add("OC"); // open cluster
dsotype_set.add("OC+Neb"); // open cluster + Nebula
dsotype_set.add("GC"); // globular cluster
dsotype_set.add("PN"); // planetary nebula
dsotype_set.add("Ast"); // planetary nebula

function dsoTypeToCheckboxID(thisdso_type) {
    id = "not found";
    switch (thisdso_type) {
        case "Gxy":
            id = "gal";
            break;
        case "GxyCld":
            id = "neb";
            break;
        case "Neb":
            id = "neb";
            break;
        case "OC":
            id = "oc";
            break;
        case "OC+Neb":
            id = "oc";
            break;                
        case "GC":
            id = "gc";
            break;        
        case "PN":
            id = "pn";
            break;
        case "Ast":
            id = "pn";
        default:     
            id = "other_dso";      
    }
    return id;
}

var starclass_set = new Set;
starclass_set.add("O");
starclass_set.add("B");
starclass_set.add("A");
starclass_set.add("F");
starclass_set.add("G");
starclass_set.add("K");
starclass_set.add("M");


function checkStarClassDisplayable(thisclass) {
    var displayable = false;
    classes = "OBAFGKM"
    if (classes.includes(thisclass) && (thisclass != "")) {
 //       console.log(thisclass+ " class star");
        ischecked = document.getElementById(thisclass).checked;
        if (ischecked) {
            displayable = true;
        }
    }   
    return displayable;
}

function checkDSOTypeDisplayable(thisdso_type) {
    var displayable = false;
    if (dsotype_set.has(thisdso_type)) {
//        console.log(thisdso_type + " DSO Type");
        thisdso_type_id = dsoTypeToCheckboxID(thisdso_type);
        ischecked = document.getElementById(thisdso_type_id).checked;
        if (ischecked) {
            displayable = true;
        }
    }   
    return displayable;
}

var dist_min = 0;
var dist_max = 500;

function checkStarDistanceDisplayable(thisdistance) {
    var displayable = false;
    lydistance = parsecToLightyears(thisdistance);
    ischecked = document.getElementById("limitstars").checked;
    if (ischecked) {
        min = dist_min;
        max = dist_max;
        if ((lydistance >= min) && (lydistance <= max)){
            displayable = true;
        }
    }
    else {
        displayable = true;
    }

    return displayable;
}

function getStarColor(spect) {
    color = "white";
    if (document.getElementById("colorstars").checked) {
        switch (spect) {
            case "O":
                color = "cyan";
                break;
            case "B" :
                color = "lightcyan";
                break;
            case "A":
                color = "white";
                break;
            case "F":
                color = "lightyellow";
                break;
            case "G":
                color = "yellow";
                break;
            case "K":
                color = "orange";
                break;
            case "M":
                color = "orangered";
                break;
            default:
        }
    }
    return color;
}

  // Example usage
const utcTime = new Date().getTime() / 1000; // Current UTC time in seconds
const observerLongitude = -74.192; // Longitude of the observer's location (Boston, MA for example)
  
const meridianRA = calculateMeridianRA(utcTime, observerLongitude);
console.log("Current RA of the celestial meridian:", meridianRA.toFixed(2), "degrees");


var cosmer = Math.cos(toRadians(180+meridianRA));
var sinmer = Math.sin(toRadians(180+meridianRA));


function calcCoordinates(ra, dec, distance) {
    var theta = toRadians(ra);
    var phi = toRadians(90-dec);
    
    var x = horizonradius*Math.sin(phi)*Math.cos(theta);
    var y = horizonradius*Math.sin(phi)*Math.sin(theta);
    var z = horizonradius*Math.cos(phi);

    // zaxis-rotation for meridan
    x1 = x*cosmer + y * sinmer;
    y1 = -x*sinmer + y * cosmer;
    z1 = z;

    // yaxis-rotation
    x2 = x1*cosdec - z1 * sindec;
    y2 = y1;
    z2 = x1*sindec + z1 * cosdec;
 
//    var cosdir = Math.cos(toRadians(dir));
//    var sindir = Math.sin(toRadians(dir));
    // zaxis-rotation for view dir
    x_final = x2*cosdir + y2 * sindir;
    y_final = -x2*sindir + y2 * cosdir;
    z_final = z2;

    return {'x': x_final, 'y': y_final, 'z': z_final};
}

function plotObject(ra, dec, spectrum, size, distance) {
    //	dec = 90 - dec;
        var inview = false;
        ra = ra - ra_change;
        context.beginPath();
        context.fillStyle = spectrum;
        coords = calcCoordinates(ra,dec, distance);
        // id, ra, dec, x, y, z
//        if ((coords.x < 0) && (coords.z < 0)){
            if (coords.x < 0) {
                context.arc(coords.y+centerX, coords.z+centerY, size, 0, 2 * Math.PI, false);
            context.fill();		
            inview =  true;		
        }
        context.closePath();	
        return inview;
}

function rotateSpace() {
    var currenttime = new Date();
    var datetime = currenttime.toDateString() + " " + currenttime.toTimeString();
    paren = datetime.indexOf("G");

    document.getElementById("currenttime").innerHTML = datetime.substring(0,paren-1);

    context.fillStyle = "black";

    context.fillRect(0, 0, canvas.width, canvas.height);

// draw ra lines
    for (var i = 0; i < 360; i = i + 15) {
        for (var j = lat; j < 360 - lat; j = j + 1) {
            plotObject(i, j, 'green', gridradius, horizonradius);
        }
    }

// draw dec lines
//    for (var j = 90; j > -90; j = j - 10) {
//        console.log(j + " Declination line");
//        for (var i = 0; i < 360; i = i + 1) {
//        }
//    }

// draw zenith
    context.beginPath();
    context.strokeStyle = '#ff0000';
    context.moveTo(0, canvas.height / 2);
    context.fillStyle = "red";
    context.arc(centerX, centerY, 2, 0, 2 * Math.PI, false);
    context.lineTo(canvas.width, canvas.height / 2);
    context.closePath();
    context.stroke();

    var starradius = 4;
    var num_plotted = 0;
    x2stars = [];
    x2dsos = [];
    j = 0;

    if (displayStars) {
        for (i = 0; i < numobjs; i++) {
            var pmra = objs[i].pmra;  // proper motion right ascension
            var pmdec = objs[i].pmdec; // proper motion declination
    
            if (checkStarDistanceDisplayable(objs[i].dist)) {
                if (checkStarClassDisplayable(objs[i].spect.substring(0, 1))) { 
                    var mag = objs[i].mag;
                    binmag(mag);
                    if (mag <= maxstarmag) {
                        thiscolor = getStarColor(objs[i].spect.substring(0, 1));
                        starradius = findstarsize(mag);
                        if (plotObject(15*objs[i].ra, objs[i].dec, thiscolor, starradius, objs[i].dist)) {  // 15* is due to 15 * 24 = 360 degrees
                            x2stars[j] = { index: i, x: coords.y+centerX, y: coords.z+centerY, z: coords.x};
                            j++; 
                            num_plotted++;
                        };
                    
                    }
                }
            }
        }
    }
 //   console.log("num_plotted = " + num_plotted);

 var dso_plotted = 0;
 var messier_plotted = 0;
 var maxdsomag = 0.0;
 var mindsomag = 111111.0;

    if ((displayDSO) || (displayMessier)) {
        j = 0;

        for (i = 0; i < dsos.length; i++) {
            var mag = dsos[i].mag;
            var cat = dsos[i].cat1;
            var thisdso_type = dsos[i].type;
            var plotit = false;
            if (checkDSOTypeDisplayable(thisdso_type)) {
                starradius = findstarsize(mag);
                if ((cat == "M") && (displayMessier)) {
                    thiscolor = "red";
                    plotit = true;
                } 
                else if (displayDSO) {  
                    thiscolor = "lightblue";   
                   plotit = true;
                }
                if (plotit) {
                   if (plotObject(15*dsos[i].ra, dsos[i].dec, thiscolor, 2, horizonradius)) {  // 15* is due to 15 * 24 = 360 degrees
                       x2dso[j] = { index: i, x: coords.y+centerX, y: coords.z+centerY, z: coords.x };
                       j++;
                      if ((displayMessier) && (thiscolor == "red")) {
                          messier_plotted++;
                      }

                       if ((displayDSO) && (thiscolor == "lightblue")) {
                           dso_plotted++;
                       }
    
                       fmag = parseFloat(mag);
                       if (fmag < mindsomag) {
                           mindsomag = fmag;
                       }
                       if (fmag > maxdsomag) {
                           maxdsomag = fmag;
                       }
                    }
                }
            }
        }
    }
     
    thisvalmag = Math.round((maxstarmag + Number.EPSILON) * 100) / 100;

    var thisdir = 360 - dir;
    if (thisdir == 360) {
        thisdir = 0;
    }

    document.getElementById('curdirection').innerHTML = thisdir;
    document.getElementById('starmag').innerHTML = thisvalmag;
    document.getElementById('starcount').innerHTML = num_plotted;
    document.getElementById('dsocount').innerHTML = dso_plotted;
    document.getElementById('messiercount').innerHTML = messier_plotted;

}

document.getElementById('runbackward').addEventListener("mousedown", runbackward, false);
document.getElementById('stepbackward').addEventListener("mousedown", stepbackward, false);
document.getElementById('stepforward').addEventListener("mousedown", stepforward, false);
document.getElementById('runforward').addEventListener("mousedown", runforward, false);
document.getElementById('lookleft').addEventListener("mousedown", lookleft, false);
document.getElementById('lookright').addEventListener("mousedown", lookright, false);
document.getElementById('increasestarmag').addEventListener("mousedown", increase_star_mag, false);
document.getElementById('decreasestarmag').addEventListener("mousedown", decrease_star_mag, false);
document.getElementById('showStars').addEventListener("mousedown", showStars, false);
document.getElementById('showMessier').addEventListener("mousedown", showMessier, false);
document.getElementById('showDSO').addEventListener("mousedown", showDSO, false);
document.getElementById('reset').addEventListener("mousedown", resetConfig, false);

document.getElementById("mouseloc").disabled = true;
document.getElementById("starcount").disabled = true;
document.getElementById("dsocount").disabled = true;
document.getElementById("messiercount").disabled = true;
document.getElementById("starmag").disabled = true;



function resetConfig() {
    displayDSO = false;
    document.getElementById("showDSO").innerHTML = "Show DSO";       
 
    displayMessier = false;
    document.getElementById("showMessier").innerHTML = "Show Messier";       

    displayStars = true;
    document.getElementById("showStars").innerHTML = "Hide Stars";

    maxstarmag = 3.7;
    ra_change = 0;
    dir = init_dir;
    rotation_speed = init_speed;
    runforward();
}

function showMessier() {
    displayMessier = !displayMessier; 
    if (displayMessier) {
        document.getElementById("showMessier").innerHTML = "Hide Messier";
    }
    else {
        document.getElementById("showMessier").innerHTML = "Show Messier";       
    }
    rotateSpace();      
}

function showDSO() {
    displayDSO = !displayDSO; 
    if (displayDSO) {
        document.getElementById("showDSO").innerHTML = "Hide DSO";
    }
    else {
        document.getElementById("showDSO").innerHTML = "Show DSO";       
    }
    rotateSpace();      
}

function showStars() {
    displayStars = !displayStars;  
    if (displayStars) {
        document.getElementById("showStars").innerHTML = "Hide Stars";
    }
    else {
        document.getElementById("showStars").innerHTML = "Show Stars";       
    }
    rotateSpace();
}

function runbackward() {
    clearInterval(thisinterval);
       if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change -= speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
    thisinterval = setInterval(update_backwardsphere, rotation_speed);

}

function stepbackward() {
    clearInterval(thisinterval);
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change -= speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
 
}

function stepforward() {
    clearInterval(thisinterval);
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
 
}

function runforward() {
    clearInterval(thisinterval);
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
    thisinterval = setInterval(update_forwardsphere, rotation_speed);
}

function update_forwardsphere() {
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
}

function update_backwardsphere() {
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change -= speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
 
}

function update_sphere() {
    if (ra_change >= 360) {
        ra_change = 0;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
 
}
rotateSpace();
//runforward();