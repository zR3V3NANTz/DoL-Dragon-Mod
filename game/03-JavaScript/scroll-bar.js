//Sidebar scroll resetting fix
//When a passage is finished loading:
$(document).on(":passageend", function (event) {
	//get sidebar dom element, assign it to variable for convenience
	let sidebar = document.querySelector("#storyCaptionDiv");
	
	//if the sidebar was not found, quit before causing errors.
	if (sidebar == undefined) return;

	//if the bar was very close to the bottom, stay at the bottom. otherwise, scroll to last known scroll position
	if (setup.sidebarIsAtBottom){
		sidebar.scroll(0, sidebar.scrollHeight);
	} else {
		sidebar.scroll(0, setup.sidebarScrollY);
	}

	//update last known scroll position whenever the position is changed
	sidebar.addEventListener("scroll", function(){
		setup.sidebarScrollY = sidebar.scrollTop;
		setup.sidebarIsAtBottom = ((sidebar.scrollHeight - sidebar.scrollTop) < sidebar.clientHeight+10);
	});
});