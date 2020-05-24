window.addEventListener('DOMContentLoaded',async ()=>{
	
	let data=await getSwingLeftEvents(mobilizeURL);
	writeZipCodeFilterControls();
	addHcdpCalender(data);
	writeFilterByTypeControls(data);
	writeFilterByTagControls(data);
	writeFilterByVirtualStatusControls(data);
	
});

let mobilizeURL='https://api.mobilize.us/v1/organizations/210/events?timeslot_end=gte_now';

if(fetchAllEventsModeOn()){
	mobilizeURL='https://api.mobilize.us/v1/organizations/210/events?per_page=200';
}



function isDebugModeOn(){
	let searchParams=new URL(document.location).searchParams
	return searchParams.get('debug')==='yes';
}


function fetchAllEventsModeOn(){
	let searchParams=new URL(document.location).searchParams
	return searchParams.get('allevents')==='yes';
}


async function getSwingLeftEvents(queryURL){
	let theData=await getData(queryURL);
	console.log(theData);
	swingtxleftEvents=theData.filter(filterOnlySwingTXLeft);
	return swingtxleftEvents;
}



function splitEventsIntoTimeSlot(events){
	let timeSlotArray=[]
	for(let e of events){
		for(let ets of e.timeslots){
			let timeSlotObj={
				timeslot:ets,
				event:e
			};
			timeSlotArray.push(timeSlotObj);
		}
	}
	return timeSlotArray.sort((fel,sel)=>{
		return fel.timeslot.start_date-sel.timeslot.start_date;
	});
}

async function addHcdpCalender(swingtxleftEvents){
	
	//document.getElementById('calInsert').innerText=JSON.stringify(theData);
	
	// console.log(swingtxleftEvents.filter(filterUpcomingEvents));
	// document.getElementById('futureEvents').innerHTML='';
	// writeEvents(swingtxleftEvents.filter(filterUpcomingEvents),document.getElementById('futureEvents'));
	// document.getElementById('pastEvents').innerHTML='';
	// writeEvents(swingtxleftEvents.filter(filterPastEvents).reverse(),document.getElementById('pastEvents'));
	document.getElementById('swingleftevents').innerHTML='';
	writeEvents(swingtxleftEvents,document.getElementById('swingleftevents'));

}

function writeZipCodeFilterControls(){
	
	let zipFilterContainer=document.getElementById('swingleftZipCodeFilter');

	//Zipcode: <input id="zipCodeForFilter" type="text"> Distance: <input id="distanceForFilter" type="text"> Miles

	zipFilterContainer.appendChild(document.createTextNode('Zipcode:'));


	let zipInput=document.createElement('input');
	zipInput.setAttribute('id','zipCodeForFilter');
	zipInput.setAttribute('type','text');
	zipInput.addEventListener('blur',whenFilterLocationEnabledReAddCalanderWithFiltering);
	zipFilterContainer.appendChild(zipInput);


	zipFilterContainer.appendChild(document.createTextNode('Distance:'));

	let distianceInput=document.createElement('input');
	distianceInput.setAttribute('id','distanceForFilter');
	distianceInput.setAttribute('type','text');
	distianceInput.addEventListener('blur',whenFilterLocationEnabledReAddCalanderWithFiltering);
	zipFilterContainer.appendChild(distianceInput);

	zipFilterContainer.appendChild(document.createTextNode('miles'));

	let zipFilterButton=elementWithText('button','Filter by location (This will exclude Virtual Events From Results)');
	zipFilterButton.classList.add('locationFilterButton');
	zipFilterButton.addEventListener('click',filterButtonClick);
	zipFilterContainer.appendChild(zipFilterButton);
	
}
function whenFilterLocationEnabledReAddCalanderWithFiltering(){
	if(document.querySelectorAll('.locationFilterButton.eventFilterButtonSelected').length>0){
		reAddCalanderWithFiltering();
	}
	
}

function writeFilterByTypeControls(swingtxleftEvents){
	document.getElementById('swingleftTypeOptions').innerHTML=''
	let typeFilterContainer=document.getElementById('swingleftTypeOptions');
	typeFilterContainer.appendChild(document.createTextNode('Filter by Event Type: '));
	let eventTypes=getEventTypesAvailable(swingtxleftEvents);


	for(let et of eventTypes){
		let button=elementWithText('button',humanizeEventType(et));
		button.setAttribute('data-event-type',et);

		button.classList.add('eventTypeFilterButton');

		button.addEventListener('click',filterButtonClick);
		typeFilterContainer.appendChild(button);



	}
}
function writeFilterByVirtualStatusControls(swingtxleftEvents){
	let virtualStatusFilterContainer=document.getElementById('swingleftVirtualStatusOptions');
	virtualStatusFilterContainer.innerHTML=''
	
	virtualStatusFilterContainer.appendChild(document.createTextNode('Filter by Virtual Status: '));
	
	let statusArr=[
		{name:'Virtual', value:'true'},
		{name:'In Person',value:'false'}
	]
	for(let s of statusArr){
		let button=elementWithText('button',s.name);
		button.setAttribute('data-virtual-status',s.value);
		button.classList.add('virtualStatusFilterButton');
		button.addEventListener('click',filterButtonClick);
		virtualStatusFilterContainer.appendChild(button);
	}

}


function writeFilterByTagControls(swingtxleftEvents){
	let tagFilterContainer=document.getElementById('swingleftTagOptions');
	tagFilterContainer.appendChild(document.createTextNode('Filter by Tags: '));
	let tagArray=[];


	for(let e of swingtxleftEvents){
		if(e.tags.length>0){
			for(let t of e.tags){
				if(!tagArray.some((el)=>{ return t.id === el.id})){
					tagArray.push({id:t.id,name:t.name});
				}
			}
		}
	}

	console.log()


	console.log(tagArray);

	
	for(let tag of tagArray){
		let tagButton=elementWithText('button',tag.name);
		tagButton.setAttribute('data-tag-id',tag.id);
		tagButton.classList.add('tagFilterButton');
		tagButton.addEventListener('click',filterButtonClick);

		tagFilterContainer.appendChild(tagButton);
	}


}

function getEventTagsAvailable(){}

function filterButtonClick(ev){
	if(ev.currentTarget.classList.contains('eventFilterButtonSelected')){
		ev.currentTarget.classList.remove('eventFilterButtonSelected');
	}
	else{
		ev.currentTarget.classList.add('eventFilterButtonSelected');
	}
	reAddCalanderWithFiltering();
}

async function reAddCalanderWithFiltering(){
	let queryURL=mobilizeURL;

	let filterEventTypeButtonsSelected=document.querySelectorAll('.eventTypeFilterButton.eventFilterButtonSelected');

	for(let b of filterEventTypeButtonsSelected){
		queryURL=queryURL+'&event_types='+ b.getAttribute('data-event-type');
	}

	let filterTagButtonsSelected=document.querySelectorAll('.tagFilterButton.eventFilterButtonSelected');

	for(let b of filterTagButtonsSelected){
		queryURL=queryURL+'&tag_id='+ b.getAttribute('data-tag-id');
	}
	
	if(document.querySelectorAll('.locationFilterButton.eventFilterButtonSelected').length>0){
		console.log('geo filtering');
		let zipcode=document.getElementById('zipCodeForFilter').value;
		let distance=document.getElementById('distanceForFilter').value;
		queryURL=queryURL+'&zipcode='+zipcode+'&max_dist='+distance;
	}




	console.log(queryURL);


	let additionalFilter

	let data=await getSwingLeftEvents(queryURL);
	
	//todo write this a bit better
	let filterVirtualStatusButtonsSelected=document.querySelectorAll('.virtualStatusFilterButton.eventFilterButtonSelected');
	if(filterVirtualStatusButtonsSelected.length>0){
		data=data.filter((el)=>{
				for(let b of filterVirtualStatusButtonsSelected){
					if(el.is_virtual.toString()===b.getAttribute('data-virtual-status')){
						return true;
					}
				}
			return false;
		});
	}
	

	addHcdpCalender(data);
}

function getEventTypesAvailable(swingtxleftEvents){
	//todo see if can simplify
	let eventTypeArray=[];
	
	for(let e of swingtxleftEvents){
		if(!eventTypeArray.includes(e.event_type)){
			eventTypeArray.push(e.event_type);
		}
	}
	return eventTypeArray;
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



// function filterUpcomingEvents(event,index,arr){
// 	return event.timeslots.some((time)=>{
// 		return time.end_date>Math.floor(Date.now()/1000);
// 	})
// }

// function filterPastEvents(event,index,arr){
// 	return event.timeslots.some((time)=>{
// 		return time.end_date<Math.floor(Date.now()/1000);
// 	})
// }

function writeEvents(events,elementContainer){
	let eventTimeSlots=splitEventsIntoTimeSlot(events);
	for(let ets of eventTimeSlots){
		elementContainer.appendChild(eventTimeSlotHTML(ets));
	}
}



function eventTimeSlotHTML(eventTimeSlot){
	let event=eventTimeSlot.event;
	eventDiv=document.createElement('div');
	eventDiv.appendChild(elementWithText('h2',event.title));
	// if(event.summary!==''){
	// 	eventDiv.appendChild(eventFieldHTML('Summary',event.summary));
	// }

	

	

	eventDiv.appendChild(eventFieldHTML('Type',humanizeEventType(event.event_type)));
	
	

	let dateFormater=new Intl.DateTimeFormat(undefined,{
		weekday:'long',
		//era:'short',
		year:'numeric',
		month:'long',
		day:'numeric',
		hour:'numeric',
		minute:'2-digit',
		timeZoneName:'short'

	});
	let startDate=new Date(eventTimeSlot.timeslot.start_date*1000);
	let endDate=new Date(eventTimeSlot.timeslot.end_date*1000)
	
	eventDiv.appendChild(eventFieldHTML('Starts:',dateFormater.format(startDate)));
	
	eventDiv.appendChild(eventFieldHTML('Ends:',dateFormater.format(endDate)));
	//eventDiv.appendChild(eventTimeSlotsHTML(event.timeslots));

	if(event.location!==null){
		
			eventDiv.appendChild(eventFieldHTML('Location',event.location.venue));
		if(event.address_visibility==='PUBLIC'){
			let googlemapurl='https://www.google.com/maps/dir/?api=1';
			let address=event.location.address_lines.join(' ')+' '+event.location.locality+', '+event.location.region+' '+event.location.postal_code
			googlemapurl=googlemapurl+'&destination='+encodeURIComponent(address);

			mapLink=document.createElement('a');
			mapLink.setAttribute('href',googlemapurl);
			mapLink.setAttribute('target','_blank');
			mapLink.appendChild(document.createTextNode('Directions'));
			eventDiv.appendChild(mapLink);
		}
		
		eventDiv.appendChild(elementWithText('div',event.location.address_lines.join('\n')));
		eventDiv.appendChild(elementWithText('div',event.location.locality+', '+event.location.region+' '+event.location.postal_code));
	}

	let descriptionPreviewLength=200;

	let descriptionField=elementWithText('div',event.description.substring(0,descriptionPreviewLength));
	eventDiv.appendChild(descriptionField);
	if(event.description.length>descriptionPreviewLength){
		let showMoreClicker=elementWithText('a',' ...Click to Show More');
		
		showMoreClicker.addEventListener('click',(ev)=>{
			descriptionField.innerText=event.description;
			ev.currentTarget.remove();
		});


		descriptionField.appendChild(showMoreClicker);
	}
	// let eventLink=document.createElement('a');

	// eventLink.setAttribute('href',event.browser_url);
	// eventLink.setAttribute('target','_blank');
	// eventLink.appendChild(document.createTextNode('Sign Up -> New Tab'));

	// eventDiv.appendChild(eventLink);

	let signUpButton=elementWithText('button','Sign Up');
	signUpButton.addEventListener('click',overlaySignUp);
	signUpButton.setAttribute('data-sign-up-url',event.browser_url);

	eventDiv.appendChild(signUpButton);

	if(event.tags.length>0){
		let tagtext=event.tags.map((el)=>{return el.name}).join(', ');

		eventDiv.appendChild(eventFieldHTML('Tags',tagtext));
	}
	if(isDebugModeOn()){
		let debugtext=document.createElement('pre');
		debugtext.textContent='FOR DEBUG DATA FROM MOBILIZE AMERICA: \n\n'+JSON.stringify(event,null,'\t');
		eventDiv.appendChild(debugtext);
	}

	return eventDiv;
}

function overlaySignUp(ev){
	let signUpContainer=document.createElement('div');

	signUpContainer.setAttribute('style','z-index:900000000;top:0;left:0;position:fixed;width:100%;height:100%;background-color:rgba(0,0,0,0.5);');

	let signUpIframe=document.createElement('iframe');
	signUpIframe.setAttribute('src',ev.currentTarget.getAttribute('data-sign-up-url'));
	signUpIframe.setAttribute('style','top:10%;left:10%;position:fixed;width:80%;height:80%;');

	signUpContainer.appendChild(signUpIframe);

	let signUpCloseButton=elementWithText('span','X');
	signUpCloseButton.setAttribute('style','top:0;right:0;position:fixed;height:10vmin;width:10vmin;text-align:center;font-size:8vmin;line-height:normal;color:red;background-color:black;border-radius:50%;padding:1vmin;');
	signUpCloseButton.addEventListener('click',()=>{
		signUpContainer.remove();
	})

	signUpContainer.appendChild(signUpCloseButton);


	signUpContainer.addEventListener('click',()=>{
		signUpContainer.remove();
	})

	document.body.appendChild(signUpContainer);

}


function eventFieldHTML(fieldName,text){
	let fieldContainer=document.createElement('div');

	let fieldNameHTML=document.createElement('b');
	fieldNameHTML.textContent=fieldName+': ';

	fieldContainer.appendChild(fieldNameHTML);

	fieldContainer.appendChild(elementWithText('span',text));

	return fieldContainer;
}

// function eventTimeSlotsHTML(timeslots){
// 	let timeslotContainer=document.createElement('div');
// 	let timeslotList=document.createElement('ul');

// 	timeslotContainer.appendChild(timeslotList);

// 	for(let t of timeslots){
// 		let startDate=new Date(t.start_date*1000);
		
// 		let endDate=new Date(t.end_date*1000)
// 		timeslotList.appendChild(elementWithText('li',startDate.toLocaleString()+' to '+endDate.toLocaleString()));

// 	}

// 	return timeslotContainer;
// }

function elementWithText(element,text){
	let el=document.createElement(element);
	el.innerText=text;

	return el;
}

function humanizeEventType(eventType){
	if(eventType==='MEET_GREET'){
		return 'Meet & Greet'
	}

	let words=eventType.split('_');

	words=words.map((w)=>{
		w=w.toLowerCase();
		w=w[0].toUpperCase()+w.substring(1);
		return w;
	});

	return words.join(' ');


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
