import React, { Component } from 'react';

class Body extends Component {
	render() {
		return (
			<main role="main" class="container">

				<div class="jumbotron">
					<div class="container">
						<h1 class="display-3">Hello, SMART world!</h1>
						<p>
							This is an application that can be used to aggregate SMART surveys.
							It allows to store SMART surveys along with their annex documents
							and aggregate all datasets into a database.
							Once stored, you can query the datasets and download data selections
							for further analysis.
						</p>
						<p>
							<a class="btn btn-primary btn-lg"
							   href="http://smartmethodology.org"
							   role="button"
							   target="_blank">
								Learn more on SMART &raquo;
							</a>
						</p>
					</div>
				</div>

				<div class="container">

					<div class="row">
						<div class="col-md-4">
							<h2>Heading</h2>
							<p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>
							<p><a class="btn btn-secondary" href="#" role="button">View details &raquo;</a></p>
						</div>
						<div class="col-md-4">
							<h2>Heading</h2>
							<p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>
							<p><a class="btn btn-secondary" href="#" role="button">View details &raquo;</a></p>
						</div>
						<div class="col-md-4">
							<h2>Heading</h2>
							<p>Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Vestibulum id ligula porta felis euismod semper. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.</p>
							<p><a class="btn btn-secondary" href="#" role="button">View details &raquo;</a></p>
						</div>
					</div>

					<hr />

				</div>

			</main>
		);
	}
}

export default Body;
