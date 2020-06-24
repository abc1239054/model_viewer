function keydown(event) {
	state.ui.pressedKeys[event.keyCode] = true;
}

function keyup(event) {
	state.ui.pressedKeys[event.keyCode] = false;
}

function mousedown(event) {
	var x = event.clientX;
	var y = event.clientY;
	var rect = event.target.getBoundingClientRect();
	// If we're within the rectangle, mouse is down within canvas.
	if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
		state.ui.mouse.lastX = x;
		state.ui.mouse.lastY = y;
		state.ui.dragging = true;
	}
}

function mouseup(event) {
	state.ui.dragging = false;
}

function mousemove(event) {
	var x = event.clientX;
	var y = event.clientY;
	if (state.ui.dragging) {
		// The rotation speed factor
		// dx and dy here are how for in the x or y direction the mouse moved
		var factor = 5 / state.canvas.height;
		var dx = factor * (x - state.ui.mouse.lastX);
		var dy = factor * (y - state.ui.mouse.lastY);

		// update the latest angle
		state.app.angle.x = state.app.angle.x + dy;
		state.app.angle.y = state.app.angle.y + dx;
	}
	// update the last mouse position
	state.ui.mouse.lastX = x;
	state.ui.mouse.lastY = y;
}

function mousewheel(event){
    if(event.wheelDelta > 0){
        if(state.app.fieldOfView - 3 < 5)
            state.app.fieldOfView = 5.0;
        else
            state.app.fieldOfView -= 3.0;
    } 
    else{
        if(state.app.fieldOfView + 3 > 175)
            state.app.fieldOfView = 175.0;
        else
            state.app.fieldOfView += 3.0;
    }
}