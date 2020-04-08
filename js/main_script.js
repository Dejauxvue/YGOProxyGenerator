

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

function addImageToDoc(doc, name){
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

function getLines(){
	return document.getElementById("decklist_input").value.split('\n');
}

function generateProxies(){
	var lines = getLines();
	for(var i = 0; i < lines.length; i++){
		if(/^\/\//.test(lines[i]) || /^#/.test(lines[i])){
			console.log("skipping comment " + lines[i]);
			continue;
		}

		
		//var regex_id_nr = 
		var regex_name = /^(?:([1-9][0-9]*) )?([A-Za-z0-9?!,:"\/-@]+(?: [A-Za-z0-9?!,:"\/-@]+)*)/;
		var regex_result = regex_name.exec(lines[i]);
		if(regex_result){
			var number = regex_result[1] === undefined ? 1 : parseInt(regex_result[1]);
			//console.log(lines[i]);
			//console.log(regex_result);
			console.log("number: " + number);
			var id_regex_result = /^[0-9]{7}$/.exec(regex_result[2]);
			if(id_regex_result){
				console.log("found id: " + regex_result[2]);
			}
			else{
				console.log("found name: " + regex_result[2]);
			}
		}
		else{
			console.log("could not process line " + lines[i]);
		}
		
	}


	// create a document the same way as above
	const doc = new PDFDocument;

	// pipe the document to a blob
	const stream = doc.pipe(blobStream());
	stream.on('finish', function() {
		/*var iframe = document.querySelector('iframe');*/
		  // get a blob you can do whatever you like with
		const blob = stream.toBlob('application/pdf');
		saveAs(blob, "download.pdf");	 
	});


	// Embed a font, set the font size, and render some text

	// Finalize PDF file
	var buildTask = new Promise(function(){});
	
	buildTask = buildTask
	.then(function(){return addImageToDoc(doc,'Tornado%20Dragon');})
		.then(function(){return addImageToDoc(doc,'Dark%20Magician');})
		.then(function(){doc.end();})
		.catch(console.log.bind(console));
		//doc.end();
	
}



