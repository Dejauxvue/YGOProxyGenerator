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
			console.log("rejecting with " + xhr.status);
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
var failedLines = [];

const pdfPointsPerInch = 72;
const cardWidth = 2.32 * pdfPointsPerInch;// a card is 2.32 inch and 1 point is 1/72 inch
//const cardHeight = 3.25 * pdfPointsPerInch;
var pdfWidth = 8.26 * pdfPointsPerInch;
var pdfHeight= 11.69 * pdfPointsPerInch;



function addImageToDoc(doc){
	return (img_url)=>{			
			console.log('image: ');
			console.log(img_url);
			var img = doc.openImage(img_url);
			var scaledWidth = cardWidth * document.getElementById("card_scale").value;
			console.log("scaledcardwith " + scaledWidth);
			var scaledHeight = scaledWidth / img.width * img.height;
			var scaledWidthPlusMargin = scaledWidth + Number(document.getElementById("margin_cards").value);
			console.log("cardwithplusmargin " + scaledWidthPlusMargin);
			var scaledHeightPlusMargin = scaledHeight + Number(document.getElementById("margin_cards").value);
			console.log(scaledWidthPlusMargin);
			var imgCountHorizontal = Math.floor((pdfWidth - 2*document.getElementById("margin_document").value) / scaledWidthPlusMargin);
			var imgCountVertical = Math.floor((pdfHeight-2*document.getElementById("margin_document").value) / scaledHeightPlusMargin);
			
			if(imagePos >= imgCountHorizontal * imgCountVertical)
			{
				doc.addPage();
				imagePos = 0;
			}
			
			var xPos = imagePos%imgCountHorizontal;
			var yPos = Math.floor(imagePos/imgCountHorizontal);
			
			
			doc.image(img, Number(document.getElementById("margin_document").value) + xPos * scaledWidthPlusMargin, 
				Number(document.getElementById("margin_document").value) + yPos * scaledHeightPlusMargin, {width: scaledWidth});
				
			imagePos = (imagePos + 1);			
	};
}

function getImageUrl(cardNameOrId, versionNumber){
	return ()=>{
		return request('https://db.ygoprodeck.com/api/v7/cardinfo.php?name=' + encodeURIComponent(cardNameOrId))
		.catch((function(name){return (error)=>request('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + encodeURIComponent(name))})(cardNameOrId))
		.catch(function(name){
			return (error)=>
			{
				while(name.length < 8){
				name = '0' +name;
				}
			return request('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + encodeURIComponent(name));}
		}(cardNameOrId))
		.then(function (result){
			var data = JSON.parse(result);
			console.log('requesting result');
			console.log(data);
			return requestArrayBuffer(data.data[0].card_images[versionNumber].image_url);
		});
	};
}


function generateProxies(){
	imagePos = 0;
	failedLines = [];
	
	// create a document the same way as above
	const doc = new PDFDocument({size: document.getElementById("paper_size").value});
	
	//set pdf widht&height for image positions
	pdfWidth = doc.page.width;
	pdfHeight= doc.page.height;

	// pipe the document to a blob
	const stream = doc.pipe(blobStream());
	stream.on('finish', function() {
		/*var iframe = document.querySelector('iframe');*/
		  // get a blob you can do whatever you like with
		const blob = stream.toBlob('application/pdf');
		saveAs(blob, "download.pdf");	 
	});


	var lines = document.getElementById("decklist_input").value.split('\n');
	var overallProcess = Promise.resolve();
	
	for(var i = 0; i < lines.length; i++){
		if(/^\/\//.test(lines[i]) || /^#/.test(lines[i]) || /^!/.test(lines[i])){
			console.log("skipping comment " + lines[i]);
			continue;
		}

		
		//var regex_id_nr = 
		var regex_name = /^([1-9][0-9]* )?(.+?)(?: ?\[([0-9]+)\])?\s*$/;
		var regex_result = regex_name.exec(lines[i].trim());
		if(regex_result){
			var amount = regex_result[1] === undefined ? 1 : parseInt(regex_result[1]);
			var versionNumber = regex_result[3] === undefined ? 0 : parseInt(regex_result[3]);
			console.log(lines[i]);
			console.log(regex_result);
			console.log("amount: " + amount);
			console.log("versionNumber: " + versionNumber);
			overallProcess = overallProcess.then(getImageUrl(regex_result[2], versionNumber))
			.then(
				function(innerNumber){return (img)=>Promise.all([...Array(innerNumber).keys()].map(i => addImageToDoc(doc)(img)));}(amount),
				function(line){return () => failedLines.push(line);} (regex_result[0])
			);

		}
	}
	
	overallProcess = overallProcess
		.then(()=>{
			if(failedLines.length != 0){
				var error_message = "could not process following lines: \n";
				failedLines.forEach(line => error_message = error_message + "\n" + line);
				alert(error_message);
			}})
		.then(()=>doc.end())
		.catch(console.log.bind(console));
}

function dragOverHandler(e) {
  console.log('File(s) in drop zone'); 
  e.stopPropagation();
  e.preventDefault();
}

function dropHandler(ev) {
  console.log('File(s) dropped');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        var file = ev.dataTransfer.items[i].getAsFile();
		file.text()
		.then((content)=>{
			var ta = document.getElementById("decklist_input");
			ta.value = ta.value + content;
		});
        console.log('... file[' + i + '].name = ' + file.name);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
    }
  }
}



