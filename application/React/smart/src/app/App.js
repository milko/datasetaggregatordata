import React, { Component } from 'react';

import Header from '../header/header.js';
import Body from '../body/body.js';

import './App.css';

class App extends Component {
	render() {
		return (
			<div>
				<Header />
				<Body />
			</div>
		);
	}
}

export default App;
