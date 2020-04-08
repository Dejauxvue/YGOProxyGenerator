

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

var imagePos = 0;

function addImageToDoc(doc){
	return (img_url)=>{
			console.log('image: ');
			console.log(img_url);
			var xPos = imagePos%3;
			var yPos = Math.floor(imagePos/3);
			imagePos = (imagePos + 1);	
			doc.image(img_url, 10 + xPos * 167, 10 + yPos * 243, {width: 166});
			if(imagePos >= 9)
			{
				doc.addPage();
				imagePos = 0;
			}
	};
}

function getImageUrlFromID(id){
	return ()=>{
		return request('https://db.ygoprodeck.com/api/v6/cardinfo.php?id=' + id)
		.then(function (result){
			var data = JSON.parse(result);
			console.log('requesting result');
			console.log(data);
			return requestArrayBuffer(data[0].card_images[0].image_url);
		});
	};
}

function getImageUrlFromName(name){
	return ()=>{
		return request('https://db.ygoprodeck.com/api/v6/cardinfo.php?name=' + name)
		.then(function (result){
			var data = JSON.parse(result);
			console.log('requesting result');
			console.log(data);
			return requestArrayBuffer(data[0].card_images[0].image_url);
		});
	};
}

function getLines(){
	return document.getElementById("decklist_input").value.split('\n');
}

function generateProxies(){
	
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


	var lines = getLines();
	var overallProcess = Promise.resolve();
	
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
				for(var j = 0; j < number; j++){
				if(id_regex_result){
					console.log("found id: " + regex_result[2]);
					overallProcess = overallProcess.then(getImageUrlFromID(regex_result[2])).then(addImageToDoc(doc));
				}
				else{
					console.log("found name: " + regex_result[2]);
					overallProcess = overallProcess.then(getImageUrlFromName(regex_result[2])).then(addImageToDoc(doc));
				}
			}
		}
		else{
			console.log("could not process line " + lines[i]);
		}
		
	}
	
	overallProcess = overallProcess
	.then(function(){return addImageToDoc(doc,'Tornado%20Dragon');})
		.then(function(){return addImageToDoc(doc,'Dark%20Magician');})
		.then(function(){doc.end();})
		.catch(console.log.bind(console));
		//doc.end();
	
}



