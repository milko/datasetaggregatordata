import React from 'react';
import ReactDOM from 'react-dom';
import { LocaleProvider, DatePicker, message } from 'antd';
// The default locale is en-US, but we can change it to other language
import enGB from 'antd/lib/locale-provider/en_GB';
import moment from 'moment';
import 'moment/locale/en-gb';

moment.locale('fr');

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			date: '',
		};
	}
	handleChange(date) {
		message.info('Selected Date: ' + date.toString());
		this.setState({ date });
	}
	render() {
		return (
			<LocaleProvider locale={enGB}>
				<div style={{ width: 400, margin: '100px auto' }}>
					<DatePicker onChange={value => this.handleChange(value)} />
					<div style={{ marginTop: 20 }}>Date: {this.state.date.toString()}</div>
				</div>
			</LocaleProvider>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('root'));