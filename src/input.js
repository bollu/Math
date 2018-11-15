
export function is_number(n) {
	return n != null && !isNaN(n);
}

/** clean floating point numbers
 *  example: 15.0000000000000002 into 15
 * the adjustable epsilon is default 15, Javascripts 16 digit float
 */
export function clean_number(num, decimalPlaces = 15) {
	// todo, this fails when num is a string, consider checking
	return (num == null
		? undefined
		: parseFloat(num.toFixed(decimalPlaces)));
}

/** 
 * this searches user-provided inputs for a valid n-dimensional vector 
 * which includes objects {x:, y:}, arrays [x,y], or sequences of numbers
 * 
 * @returns (number[]) array of number components
 *   invalid/no input returns an emptry array
*/
export function get_vec(){
	let params = Array.from(arguments);
	if(params.length == 0) { return []; }
	if(params[0].vector != null && params[0].vector.constructor == Array){
		return params[0].vector; // Vector type
	}
	let arrays = params.filter((param) => param.constructor === Array);
	if(arrays.length >= 1) { return arrays[0]; }
	let numbers = params.filter((param) => !isNaN(param));
	if(numbers.length >= 1) { return numbers; }
	if(!isNaN(params[0].x)){
		// todo, we are relying on convention here. should 'w' be included?
		// todo: if y is not defined but z is, it will move z to index 1
		return ['x','y','z'].map(c => params[0][c]).filter(a => a != null);
	}
	return [];
}

/** 
 * @returns (number[]) array of number components
 *  invalid/no input returns the identity matrix
*/
export function get_matrix(){
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if(params.length == 0) { return [1,0,0,1,0,0]; }
	if(params[0].m != null && params[0].m.constructor == Array){
		numbers = params[0].m.slice(); // Matrix type
	}
	if(numbers.length == 0 && arrays.length >= 1){ numbers = arrays[0]; }
	if(numbers.length >= 6){ return numbers.slice(0,6); }
	else if(numbers.length >= 4){
		let m = numbers.slice(0,4);
		m[4] = 0;
		m[5] = 0;
		return m;
	}
	return [1,0,0,1,0,0];
}

/** 
 * @returns ({ point:[], vector:[] })
*/
export function get_line(){
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if(params.length == 0) { return {vector: [], point: []}; }
	if(!isNaN(params[0]) && numbers.length >= 4){
		return {
			point: [params[0], params[1]],
			vector: [params[2], params[3]]
		};
	}
	if(arrays.length > 0){
		if(arrays.length == 2){
			return {
				point: [arrays[0][0], arrays[0][1]],
				vector: [arrays[1][0], arrays[1][1]]
			};
		}
		if(arrays.length == 4){
			return {
				point: [arrays[0], arrays[1]],
				vector: [arrays[2], arrays[3]]
			};
		}
	}
	if(params[0].constructor === Object){
		let vector = [], point = [];
		if (params[0].vector != null)         { vector = get_vec(params[0].vector); }
		else if (params[0].direction != null) { vector = get_vec(params[0].direction); }
		if (params[0].point != null)       { point = get_vec(params[0].point); }
		else if (params[0].origin != null) { point = get_vec(params[0].origin); }
		return {point, vector};
	}
	return {point: [], vector: []};
}

export function get_two_vec2(){
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if(numbers.length >= 4){
		return [
			[numbers[0], numbers[1]],
			[numbers[2], numbers[3]]
		];
	}
	if(arrays.length >= 2 && !isNaN(arrays[0][0])){
		return arrays;
	}
}
