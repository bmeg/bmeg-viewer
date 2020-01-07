
import React, { Component } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';

import TextField from '@material-ui/core/TextField';

import Autocomplete from '@material-ui/lab/Autocomplete';

import {
    XYPlot,
    Hint,
    VerticalBarSeries
} from 'react-vis';

import _ from 'lodash';

import {
  BrowserRouter as Router,
  Route,
  Link,
  useHistory
} from 'react-router-dom';

import {gripql} from './gripql.js'

const GRAPH = "rc5";

function Program(props) {
    var projects = props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      <h1>{props.data.program_id}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
}


function Project(props) {
    var program = props.edges.filter(x => x.label == "programs").map( (x, index) =>
      <Link key={index} to={x.to}>{x.to}</Link>
    )
    var cases = props.edges.filter(x => x.label == "cases").map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      {program}
      <h1>{props.data.project_id}</h1>
      <h1>Cases</h1>
      <ul>
      {cases}
      </ul>
    </div>);
}

function Aliquot(props) {
    var projects = props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link></li>
    )
    return (<div>
      <h1>{props.data.submitter_id}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
}


function Default(props) {
    var projects = props.edges.map( (x, index) =>
      <li key={index}><Link to={x.to}>{x.to}</Link> - {x.label}</li>
    )
    return (<div>
      <h1>{props.gid} : {props.label}</h1>
      <ul>
      {projects}
      </ul>
    </div>);
}

function Gene(props) {
  var transcripts = props.edges.filter(x => x.label == "transcripts").map( (x, index) =>
    <li key={index}><Link to={x.to}>{x.to}</Link></li>
  )
  return (<div>
    <h1>{props.gid} : {props.data.symbol}</h1>
    <h3>{props.data.description}</h3>
    <h2>Transcripts</h2>
    <ul>
    {transcripts}
    </ul>
  </div>);
}

function GeneExpression(props) {
  const nGenes = 200;
  var [hoverVal,setHoverVal] = React.useState("")
  var topGenes = _.slice( _.sortBy( _.toPairs(props.data.values), (x) => -x[1] ), 0, nGenes );
  var data = _.map( topGenes, (x) => { return {"x" : x[0], "y" : x[1]}} );

  return (<div>
    <h1>{props.gid}</h1>

    <XYPlot
      xType="ordinal"
      width={800}
      height={300}
      getLabel={d => d.x}
      onValueMouseOver={(v) => {setHoverVal(v.x)}}
    >
       <VerticalBarSeries
           data={data}
       />
       {hoverVal != "" && (
       <Hint value={hoverVal}>
        <div>
          <h3>Value of hint</h3>
          <p>{hoverVal}</p>
        </div>
      </Hint>
    )}
   </XYPlot>

    </div>)

}


function BMEGViewer(props) {
  const [vertex, setVertex] = React.useState({"label": "", "data" : null, "edges" : null});

  let gid = props.match.params.gid;

  React.useEffect(() => {
    //console.log(props)
    if (gid.length > 0) {
      gripql.query(GRAPH).V(gid).execute(x => {
        if (x.length > 0) {
          gripql.query(GRAPH).V(gid).outE().execute(y => {
            var edges = y.map( z => z.edge )
            setVertex({
              "label": x[0].vertex.label,
              "data": x[0].vertex.data,
              "edges" : edges
            })
          })
        } else {
          setVertex({"label": "", "data" : null, "edges" : null})
        }
      })
    }
  }, [props.match])

  if (vertex.label == '') {
    return (<div>Test</div>)
  }
  var v
  if (vertex.label == "Program") {
    v = <Program data={vertex.data} edges={vertex.edges}/>
  } else if (vertex.label == "Project") {
    v = <Project gid={gid} data={vertex.data} label={vertex.label} edges={vertex.edges}/>
  } else if (vertex.label == "Aliquot") {
    v = <Aliquot gid={gid} data={vertex.data} label={vertex.label} edges={vertex.edges}/>
  } else if (vertex.label == "Gene") {
    v = <Gene gid={gid} data={vertex.data} label={vertex.label} edges={vertex.edges}/>
  } else if (vertex.label == "GeneExpression") {
    v = <GeneExpression gid={gid} data={vertex.data} label={vertex.label} edges={vertex.edges}/>
  } else if (vertex.label === null) {
    v = <div>Not Found {gid}</div>
  } else {
    v = <Default gid={gid} data={vertex.data} label={vertex.label} edges={vertex.edges}/>
  }
  return (<div>
    {v}
  </div>)

}


const useStyles = makeStyles(theme => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: 500,
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

function SearchBar() {
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const [dstGid, setDstGid] = React.useState('');
  let history = useHistory();

  let fields =  ["submitter_id", "symbol", "program_id", "name"];

  const handleChange = event => {
    setInputValue(event.target.value);
  };

  React.useEffect(() => {
    if (inputValue.length >= 2) {
      gripql.query(GRAPH).Search("symbol", inputValue).render(["_gid", "_label", "symbol"]).limit(20).execute(x => {
        //console.log(x)
        setOptions( x.map( y => y.render) )
      })
    }
  }, [inputValue])

  const classes = useStyles();

  return (
    <Paper component="form" className={classes.root} onSubmit={(e)=>{
        e.preventDefault();
        //console.log(e)
        history.push(dstGid)
      }}>
      <Autocomplete
        id="bmeg-search-box"
        options={options}
        getOptionLabel={y => y[0] + " (" + y[1] + ")" }
        getOptionSelected={y => { console.log("Selecting"); console.log(y)} }
        className={classes.input}
        onChange={(event, newValue) => {
          //console.log(newValue);
          setDstGid(newValue[0])
        }}
        renderInput={params => (
          <TextField {...params} label="Search BMEG"
          margin="normal" variant="outlined"
          name="searchValue"
          fullWidth onChange={handleChange} />
        )}
      />
       <IconButton type="submit" className={classes.iconButton} aria-label="search">
         <SearchIcon />
       </IconButton>
     </Paper>
  )
}


function App() {
  return (
    <div>
    <Router>
      <SearchBar/>
      <div>
        <Route exact path='/:gid' component={BMEGViewer}></Route>
      </div>
    </Router>
    </div>
  );
}

export default App;
