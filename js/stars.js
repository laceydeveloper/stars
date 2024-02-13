
//var dsos = []; //Papa.parse(window.dsoData, {header: true, download: false}).data;
var dsos = Papa.parse(window.dsoData, {header: true, download: false}).data;
var objs = Papa.parse(window.csvData, {header: true, download: false}).data;
var numobjs = objs.length;
var numdsos = dsos.length;

var thisinterval = null;

var histobins = Array(120).fill(0);
var binned = false;

var displayDSO = false;
var displayStars = true;

var maxstarmag = 3.7;

var radian = 180.0 / Math.PI;
var lat = toDecimalDec(39,51,8.7);  // latitude
lat = 90.0 - lat;
//lat = 90.0 - lat;
//lat = 0.0;
//lat = 50.0;
var sindec = Math.sin(toRadians(lat));
var cosdec = Math.cos(toRadians(lat));
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

function xy_to_ra_dec(x, y, z) {
    ra_dec = [];
    theta = 0; // dec
    phi = 0; // ra

 /*
    var x = horizonradius*Math.sin(phi)*Math.cos(theta);
    var y = horizonradius*Math.sin(phi)*Math.sin(theta);
    var z = horizonradius*Math.cos(phi);
*/

    theta = Math.atan(y/x);
    phi = 90 - Math.acos(z/Math.sqrt(horizonradius));

    ra_dec[0] = theta;
    ra_dec[1] = phi;

    return ra_dec;

//	x1 = x*cosdec - z * sindec;
//	z1 = x*sindec + z * cosdec;
/*
    rho=𝑥2+𝑦2+𝑧2
    tan(theta)=𝑦/𝑥
    phi= arccos(z/(x2+y2+z2)1/2)
*/

}

function increase_star_mag() {
    maxstarmag += 0.1;
    rotateSpace();
}

function decrease_star_mag() {
    maxstarmag -= 0.1;
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
//centerY = canvas.height;
//var centerY = 0;
var starradius = 4;
var gridradius = 1;
var horizonradius = -(canvas.width / 2)*1.49;
//var horizonradius = -(canvas.width / 2);
var ra_change = 0;

canvas.addEventListener("mousedown", doMouseDown, false);
canvas.addEventListener("mousemove", doMouseMove, false);

function doMouseDown(e) {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    var thisstar = checkForStar(x, y);
    if (thisstar != -1) {
        printstar(thisstar);
    }
    //else {
        var thisdso = checkForDSO(x, y);
        if (thisdso != -1) {
            printdso(thisdso);
    //    }
    }
}

function printstar(i) {
    thisstar = objs[x2stars[i].index];
    alerttext = thisstar.bf + "\n";
    alerttext += "Apparent Magnitude: " + thisstar.mag+ "\n";

    if (thisstar.proper != "") alerttext += thisstar.proper;
 //   if (objs[x2stars[i].index].x > 0) {
    $('#mouseloc').val(alerttext);
 //       alert(alerttext);
 //   }
 //   alert(objs[x2stars[i].index].proper);
}

function printdso(i) {
    thisdso = dsos[x2dso[i].index];
    alerttext = thisdso.cat1 + thisdso.id1 + "\n";
    if (thisdso.name != "") alerttext += thisdso.name;
 //   alert(dsos[x2dso[i].index].name);
 //   if (dsos[x2dso[i].index].x > 0) {
        $('#mouseloc').val(alerttext);
//    alert(alerttext);
 //   }
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
                return i;
            }
        }
    }
    return -1;
}

function calcCoordinates(ra, dec, distance) {
    var theta = toRadians(180-ra);
    var phi = toRadians(90-dec);
    
    var x = horizonradius*Math.sin(phi)*Math.cos(theta);
    var y = horizonradius*Math.sin(phi)*Math.sin(theta);
    var z = horizonradius*Math.cos(phi);

    // yaxis-rotation
    x1 = x*cosdec - z * sindec;
    y1 = y;
    z1 = x*sindec + z * cosdec;

    var dir = 0;
    var cosdir = Math.round(Math.cos(toRadians(dir)));
    var sindir = Math.round(Math.sin(toRadians(dir)));
    // zaxis-rotation
    x1 = x1*cosdir + y1 * sindir;
    y1 = -x1*sindir + y1 * cosdir;
    z1 = z1

    return {'x': x1, 'y': y1, 'z': z1};
}

function plotObject(ra,dec,spectrum,size, distance) {
    //	dec = 90 - dec;
        var inview = false;
        ra = ra - ra_change;
        context.beginPath();
        context.fillStyle = spectrum;
        coords = calcCoordinates(ra,dec, distance);
        // id, ra, dec, x, y, z
        if ((coords.x > 0) && (coords.z < 0)){
            context.arc(coords.y+centerX, coords.z+centerY, size, 0, 2 * Math.PI, false);
//            context.arc(coords.y+centerX, coords.z+(2*centerY), size, 0, 2 * Math.PI, false);
 //           context.arc(coords.y-horizonradius, coords.z-horizonradius, size, 0, 2 * Math.PI, false);
            context.fill();		
            inview =  true;		
        }
        context.closePath();	
        return inview;
}

function rotateSpace() {
    context.fillStyle = "black";

    context.fillRect(0, 0, canvas.width, canvas.height);

// draw ra lines
    for (var i = 0; i < 360; i = i + 15) {
        for (var j = lat; j < 360 - lat; j = j + 1) {
            plotObject(i, j, 'green', gridradius, horizonradius);
        }
    }

// draw dec lines
//for (var j=lat; j < 90; j = j + 10) {
    for (var j = 90; j > -90; j = j - 10) {
//        console.log(j + " Declination line");
        for (var i = 0; i < 360; i = i + 1) {
 //           plotObject(i, j, 'yellow', gridradius, horizonradius);
        }
    }

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
            var mag = objs[i].mag;
            binmag(mag);
            if (mag <= maxstarmag) {
                thiscolor = 'white';
                if (objs[i].proper == "Aldebaran") thiscolor = "pink";
                starradius = findstarsize(mag);
 //               if (plotObject(15*objs[i].ra, objs[i].dec, 'white', starradius, objs[i].dist)) {
                if (plotObject(15*objs[i].ra, objs[i].dec, thiscolor, starradius, objs[i].dist)) {  // 15* is due to 15 * 24 = 360 degrees
                    x2stars[j] = { index: i, x: coords.y+centerX, y: coords.z+centerY, z: coords.x};
                    j++; 
                    num_plotted++;
                };
                
            }
    
        }
    }
 //   console.log("num_plotted = " + num_plotted);

    var dso_plotted = 0;
    var maxdsomag = 0.0;
    var mindsomag = 111111.0;

    if (displayDSO) {
        j = 0;
        for (i = 0; i < dsos.length; i++) {
            var mag = dsos[i].mag;
            var cat = dsos[i].cat1;
 
            if (cat == "M") {
                starradius = findstarsize(mag);
                if (plotObject(15*dsos[i].ra, dsos[i].dec, 'red', 2, horizonradius)) {  // 15* is due to 15 * 24 = 360 degrees
                    x2dso[j] = { index: i, x: coords.y+centerX, y: coords.z+centerY, z: coords.x };
                    j++;
    
                    dso_plotted++;
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
    thisvalmag = Math.round((maxstarmag + Number.EPSILON) * 100) / 100;
    document.getElementById('starmag').innerHTML = thisvalmag;
    document.getElementById('starcount').innerHTML = num_plotted;
    document.getElementById('dsocount').innerHTML = dso_plotted;

}

document.getElementById('runbackward').addEventListener("mousedown", runbackward, false);
document.getElementById('stepbackward').addEventListener("mousedown", stepbackward, false);
document.getElementById('stepforward').addEventListener("mousedown", stepforward, false);
document.getElementById('runforward').addEventListener("mousedown", runforward, false);
document.getElementById('increasestarmag').addEventListener("mousedown", increase_star_mag, false);
document.getElementById('decreasestarmag').addEventListener("mousedown", decrease_star_mag, false);
document.getElementById('showStars').addEventListener("mousedown", showStars, false);
document.getElementById('showDSO').addEventListener("mousedown", showDSO, false);
document.getElementById('reset').addEventListener("mousedown", resetConfig, false);

document.getElementById("mouseloc").disabled = true;
document.getElementById("starcount").disabled = true;
document.getElementById("dsocount").disabled = true;
document.getElementById("starmag").disabled = true;



function resetConfig() {
    displayDSO = false;
    displayStars = true;
    maxstarmag = 3.7;
    rotateSpace();
}

function showDSO() {
    displayDSO = !displayDSO; 
    rotateSpace();      
}

function showStars() {
    displayStars = !displayStars;  
    rotateSpace();
}

function runbackward() {
    clearInterval(thisinterval);
       if (ra_change >= 360) {
        ra_change = 0;
//        clearInterval(thisinterval);
//        return;
    }
    ra_change -= speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
    thisinterval = setInterval(update_backwardsphere, 100);

}

function stepbackward() {
    clearInterval(thisinterval);
    if (ra_change >= 360) {
        ra_change = 0;
//        clearInterval(thisinterval);
//        return;
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
//        clearInterval(thisinterval);
//        return;
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
//        clearInterval(thisinterval);
//        return;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
    thisinterval = setInterval(update_forwardsphere, 100);
}

function update_forwardsphere() {
    if (ra_change >= 360) {
        ra_change = 0;
//        clearInterval(thisinterval);
//        return;
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
//        clearInterval(thisinterval);
//        return;
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
//        clearInterval(thisinterval);
//        return;
    }
    ra_change += speed;
   context.clearRect(0,0,canvas.width, canvas.height);
    rotateSpace(ra_change);
    if (!binned) {
        printhisto();
        binned = true;
    }
 
}

runforward();