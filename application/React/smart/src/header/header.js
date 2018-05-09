import React, { Component } from 'react';
import logo from '../logo.svg';

class Header extends Component {
	render() {
		return (
			<nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
				<a className="navbar-brand" href="#">SMART surveys aggregator</a>

				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>

				<div className="collapse navbar-collapse" id="navbarsExampleDefault">
					<ul className="navbar-nav mr-auto">
						<li className="nav-item active">
							<a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
						</li>
						<li className="nav-item dropdown">
							<a className="nav-link dropdown-toggle" href="http://example.com" id="dropdown01" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Browse</a>
							<div className="dropdown-menu" aria-labelledby="dropdown01">
								<a className="dropdown-item" href="#">Action</a>
								<a className="dropdown-item" href="#">Another action</a>
								<a className="dropdown-item" href="#">Something else here</a>
							</div>
						</li>
						<li className="nav-item dropdown">
							<a className="nav-link dropdown-toggle disabled" href="http://example.com" id="dropdown01" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Upload</a>
							<div className="dropdown-menu" aria-labelledby="dropdown01">
								<a className="dropdown-item" href="#">Action</a>
								<a className="dropdown-item" href="#">Another action</a>
								<a className="dropdown-item" href="#">Something else here</a>
							</div>
						</li>
						<li className="nav-item dropdown">
							<a className="nav-link dropdown-toggle disabled" href="http://example.com" id="dropdown01" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Dictionary</a>
							<div className="dropdown-menu" aria-labelledby="dropdown01">
								<a className="dropdown-item" href="#">Action</a>
								<a className="dropdown-item" href="#">Another action</a>
								<a className="dropdown-item" href="#">Something else here</a>
							</div>
						</li>
					</ul>
					<form className="form-inline my-2 my-lg-0">
						<input className="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search" />
						<button className="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
					</form>
				</div>
			</nav>
		);
	}
}

export default Header;
