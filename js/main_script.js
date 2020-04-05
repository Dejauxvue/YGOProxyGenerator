
// create a document the same way as above
const doc = new PDFDocument;

// pipe the document to a blob
const stream = doc.pipe(blobStream());


// Embed a font, set the font size, and render some text


// Add another page
doc.addPage()
   .fontSize(25)
   .text('Here is some vector graphics...', 100, 100);

// Draw a triangle
doc.save()
   .moveTo(100, 150)
   .lineTo(100, 250)
   .lineTo(200, 250)
   .fill("#FF3300");

// Apply some transforms and render an SVG path with the 'even-odd' fill rule
doc.scale(0.6)
   .translate(470, -380)
   .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
   .fill('red', 'even-odd')
   .restore();

// Add some text with annotations
doc.addPage()
   .fillColor("blue")
   .text('Here is a link!', 100, 100)
   .underline(100, 100, 160, 27, {color: "#0000FF"})
   .link(100, 100, 160, 27, 'http://google.com/');

// Finalize PDF file

stream.on('finish', function() {
/*var iframe = document.querySelector('iframe');*/
  // get a blob you can do whatever you like with
	const blob = stream.toBlob('application/pdf');
	
saveAs(blob, "download.pdf");

 
});

function request(url) {
	console.log('requesting url:');
	console.log(url);
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
    xhr.open('get', url, true)
    xhr.send();
  });
}

function requestArrayBuffer(url) {
	console.log('requesting AB url:');
	console.log(url);
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
	xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true)
    xhr.send();
  });
}

function addImageToDoc(name){
	var myPromise = request('https://db.ygoprodeck.com/api/v6/cardinfo.php?name=' + name)
	.then(function (result){
		var data = JSON.parse(result);
		console.log('requesting result');
		console.log(data);
		return requestArrayBuffer(data[0].card_images[0].image_url);
	})
	.then(function (res){
		console.log('image: ');
		console.log(res);
		return doc.image(res);
	});
	return myPromise;
}
addImageToDoc('Tornado%20Dragon')
.then(addImageToDoc('Tornado%20Dragon'))
.then(function(){doc.end();})
.catch(console.log.bind(console));

