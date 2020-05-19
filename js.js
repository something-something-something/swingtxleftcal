window.addEventListener('DOMContentLoaded',()=>{
	addHcdpCalender();
});

//let mobilizeURL='https://api.mobilize.us/v1/organizations/210/events?timeslot_start=gte_now';
let mobilizeURL='https://api.mobilize.us/v1/organizations/210/events?per_page=200';



async function addHcdpCalender(){
	let theData=await getData(mobilizeURL);
	console.log(theData);
	//document.getElementById('calInsert').innerText=JSON.stringify(theData);
	swingtxleftEvents=theData.filter(filterOnlySwingTXLeft);
	console.log(swingtxleftEvents);
	console.log(swingtxleftEvents.filter(filterUpcomingEvents));
	document.getElementById('futureEvents').innerHTML='';
	writeEvents(swingtxleftEvents.filter(filterUpcomingEvents),document.getElementById('futureEvents'));
	document.getElementById('pastEvents').innerHTML='';
	writeEvents(swingtxleftEvents.filter(filterPastEvents).reverse(),document.getElementById('pastEvents'));
}

function filterOnlySwingTXLeft(event,index,arr){
	let swingtxleftRegExp=/swing\s*tx\s*left/i;
	if(event.title.search(swingtxleftRegExp)!==-1){
		return true;
	}
	else if(event.description.search(swingtxleftRegExp)!==-1){
		return true;
	}
	return false;
}



function filterUpcomingEvents(event,index,arr){
	return event.timeslots.some((time)=>{
		return time.end_date>Math.floor(Date.now()/1000);
	})
}

function filterPastEvents(event,index,arr){
	return event.timeslots.some((time)=>{
		return time.end_date<Math.floor(Date.now()/1000);
	})
}

function writeEvents(events,elementContainer){
	for(let e of events){
		elementContainer.appendChild(eventHTML(e));
	}
}



function eventHTML(event){
	eventDiv=document.createElement('div');
	eventDiv.appendChild(elementWithText('h2',event.title));
	if(event.summary!==''){
		eventDiv.appendChild(eventFieldHTML('Summary',event.summary));
	}

	eventDiv.appendChild(eventFieldHTML('Description',event.description));


	eventDiv.appendChild(eventTimeSlotsHTML(event.timeslots));

	if(event.location!==null){
		
			eventDiv.appendChild(eventFieldHTML('Location',event.location.venue));
		
		
		eventDiv.appendChild(elementWithText('div',event.location.address_lines.join('\n')));
		eventDiv.appendChild(elementWithText('div',event.location.locality+', '+event.location.region+' '+event.location.postal_code));
	}

	eventLink=document.createElement('a');

	eventLink.setAttribute('href',event.browser_url);

	eventLink.appendChild(document.createTextNode('Sign Up'));

	eventDiv.appendChild(eventLink);

	let searchParams=new URL(document.location).searchParams
	if(searchParams.get('debug')==='yes'){
		let debugtext=document.createElement('pre');
		debugtext.textContent='FOR DEBUG DATA FROM MOBILIZE AMERICA: \n\n'+JSON.stringify(event,null,'\t');
		eventDiv.appendChild(debugtext);
	}

	return eventDiv;
}


function eventFieldHTML(fieldName,text){
	let fieldContainer=document.createElement('div');

	let fieldNameHTML=document.createElement('b');
	fieldNameHTML.textContent=fieldName+': ';

	fieldContainer.appendChild(fieldNameHTML);

	fieldContainer.appendChild(document.createTextNode(text));

	return fieldContainer;
}

function eventTimeSlotsHTML(timeslots){
	let timeslotContainer=document.createElement('div');
	let timeslotList=document.createElement('ul');

	timeslotContainer.appendChild(timeslotList);

	for(let t of timeslots){
		let startDate=new Date(t.start_date*1000);
		
		let endDate=new Date(t.end_date*1000)
		timeslotList.appendChild(elementWithText('li',startDate.toLocaleString()+' to '+endDate.toLocaleString()));

	}

	return timeslotContainer;
}

function elementWithText(element,text){
	let el=document.createElement(element);
	el.innerText=text;

	return el;
}

async function getData(url){
	let res=await fetch(url);
	let eventArr=[];
	let theJson=await res.json();
	console.log(theJson);
	eventArr=theJson.data;
	if(theJson.next!==null){
		console.log('fetching more');
		eventArr=eventArr.concat(await getData(theJson.next));
	}
	else{
		console.log('fetched all');
	}
	return eventArr;
}
