
import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';

import {gripql} from './gripql.js'


class Program extends Component {
  render() {
    var projects = this.props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      <h1>{this.props.data.program_id}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
  }
}


class Project extends Component {
  render() {
    var program = this.props.edges.filter(x => x.label == "programs").map( (x, index) =>
      <Link key={index} to={x.to}>{x.to}</Link>
    )
    var cases = this.props.edges.filter(x => x.label == "cases").map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      {program}
      <h1>{this.props.data.project_id}</h1>
      <h1>Cases</h1>
      <ul>
      {cases}
      </ul>
    </div>);
  }
}

class Aliquot extends Component {
  render() {
    var projects = this.props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      <h1>{this.props.data.submitter_id}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
  }
}


class Default extends Component {
  render() {
    var projects = this.props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link> - {x.label}</li>
    )
    return (<div>
      <h1>{this.props.gid} : {this.props.label}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
  }
}

class Viewer extends React.Component {

  constructor(props) {
     super(props);
     this.state = {
       gid: null,
       label: null,
       data: null,
       edges: null,
       isLoaded: false
     };
     this.getVertexData = this.getVertexData.bind(this);
  }

  getVertexData(gid) {
    gripql.query("bmeg").V(gid).execute(x => {
      console.log(x)
      if (x.length > 0) {
        gripql.query("bmeg").V(gid).outE().execute(y => {
          var edges = y.map( z => z.edge )
          this.setState({
            gid: gid,
            label: x[0].vertex.label,
            data: x[0].vertex.data,
            edges: edges,
            isLoaded: true
          })
        })
      } else {
        this.setState({
          gid: gid,
          label: null,
          data: null,
          edges: null,
          isLoaded: true
        })
      }
    })
  }

  componentDidMount() {
    if (this.props.match.params.gid.length > 0) {
      this.getVertexData(this.props.match.params.gid)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.gid !== this.props.match.params.gid) {
      this.getVertexData(this.props.match.params.gid)
    }
  }

  onInputTerm(term){
    //this.setState({term});
  }
  onSumbitTerm(term){
    //this.props.search(term,'games');
    this.props.history.push(term);
  }

  render() {
    var v
    if (this.state.label == "Program") {
      v = <Program data={this.state.data} edges={this.state.edges}/>
    } else if (this.state.label == "Project") {
      v = <Project gid={this.state.gid} data={this.state.data} label={this.state.label} edges={this.state.edges}/>
    } else if (this.state.label == "Aliquot") {
      v = <Aliquot gid={this.state.gid} data={this.state.data} label={this.state.label} edges={this.state.edges}/>
    } else if (this.state.label === null) {
      v = <div>Not Found {this.props.match.params.gid}</div>
    } else {
      v = <Default gid={this.state.gid} data={this.state.data} label={this.state.label} edges={this.state.edges}/>
    }
    return (<div>
      <div className='search-bar' >
					<form
						onSubmit={(e)=>{
								e.preventDefault();
								this.onSumbitTerm(e.target.searchValue.value);
							}}
					>
						<input
							name='searchValue'
							type='text'
							onChange={(e)=>{this.onInputTerm(e.target.value)}}
						/>
					</form>
				</div>
      {v}
    </div>)
  }
}

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path='/:gid' component={Viewer}></Route>
        </div>
      </Router>
    );
  }
}

export default App;
