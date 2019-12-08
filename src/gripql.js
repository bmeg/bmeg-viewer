
function process(val) {
	if (!val) {
		val = []
  } else if (typeof val == "string" || typeof val == "number") {
	  val = [val]
  } else if (!Array.isArray(val)) {
		throw "not something we know how to process into an array"
	}
	return val
}

export var gripql = {
	query: function(graph) {
		var queryBase = '/v1/graph/'+ graph + '/query'
		return {
			query: [],
			V: function(id) {
				this.query.push({'v': process(id)})
				return this
			},
			E: function(id) {
				this.query.push({'e': process(id)})
				return this
			},
			out: function(label) {
				this.query.push({'out': process(label)})
				return this
			},
			in_: function(label) {
				this.query.push({'in': process(label)})
				return this
			},
			both: function(label) {
				this.query.push({'both': process(label)})
				return this
			},
			outV: function(label) {
				this.query.push({'outV': process(label)})
				return this
			},
			inV: function(label) {
				this.query.push({'inV': process(label)})
				return this
			},
			bothV: function(label) {
				this.query.push({'bothV': process(label)})
				return this
			},
			outE: function(label) {
				this.query.push({'out_e': process(label)})
				return this
			},
			inEdge: function(label) {
				this.query.push({'in_e': process(label)})
				return this
			},
			bothE: function(label) {
				this.query.push({'both_e': process(label)})
				return this
			},
			as_: function(name) {
				this.query.push({'as': name})
				return this
			},
			select: function(marks) {
				this.query.push({'select': {'marks': process(marks)}})
				return this
			},
			limit: function(n) {
				this.query.push({'limit': n})
				return this
			},
			skip: function(n) {
				this.query.push({'skip': n})
				return this
			},
			range: function(start, stop) {
				this.query.push({'range': {'start': start, 'stop': stop}})
				return this
			},
			count: function() {
				this.query.push({'count': ''})
				return this
			},
			distinct: function(val) {
				this.query.push({'distinct': process(val)})
				return this
			},
			fields: function(fields) {
				this.query.push({'fields': fields})
				return this
			},
			render: function(r) {
				this.query.push({'render': r})
				return this
			},
			has: function(expression) {
				this.query.push({'has': expression})
				return this
			},
			hasLabel: function(label) {
				this.query.push({'hasLabel': process(label)})
				return this
			},
			hasId: function(id) {
				this.query.push({'hasId': process(id)})
				return this
			},
			hasKey: function(key) {
				this.query.push({'hasKey': process(key)})
				return this
			},
			aggregate: function() {
				this.query.push({'aggregate': {'aggregations': Array.prototype.slice.call(arguments)}})
				return this
			},

			execute: function(callback) {
	      fetch(queryBase, {
	        method: 'POST',
	        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
	        body: JSON.stringify( {query:this.query} ),
	      }).then(function(response) {
	        return response.text()
	      }).then(function(text) {
	        var lines = text.replace(/^\s+|\s+$/g, '').split("\n")
	        var parsed = lines.filter(x => x.length > 0).map(JSON.parse).map(function(x) { return x["result"] })
	        callback(parsed)
	      })
	    },

			call: function() {
				return fetch(queryBase, {
	        method: 'POST',
	        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
	        body: JSON.stringify( {query:this.query} ),
	      }).then(function(response) {
	        return response.text()
	      }).then(function(text) {
	        var lines = text.replace(/^\s+|\s+$/g, '').split("\n")
	        var parsed = lines.filter(x => x.length > 0).map(JSON.parse).map(function(x) { return x["result"] })
	        return parsed
	      })
			}
		}
	},

	// Where operators
	and_: function() {
		return {'and': {'expressions': Array.prototype.slice.call(arguments)}}
	},

	or_: function() {
		return {'or': {'expressions': Array.prototype.slice.call(arguments)}}
	},

	not_: function(expression) {
		return {'not': expression}
	},

	eq: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'EQ'}}
	},

	neq: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'NEQ'}}
	},

	gt: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'GT'}}
	},

	gte: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'GTE'}}
	},

	lt: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'LT'}}
	},

	lte: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'LTE'}}
	},

	inside: function(key, values) {
		return {'condition': {'key': key, 'value': process(values), 'condition': 'INSIDE'}}
	},

	outside: function(key, values) {
		return {'condition': {'key': key, 'value': process(values), 'condition': 'OUTSIDE'}}
	},

	between: function(key, values) {
		return {'condition': {'key': key, 'value': process(values), 'condition': 'BETWEEN'}}
	},

	within: function(key, values) {
		return {'condition': {'key': key, 'value': process(values), 'condition': 'WITHIN'}}
	},

	without: function(key, values) {
		return {'condition': {'key': key, 'value': process(values), 'condition': 'WITHOUT'}}
	},

	contains: function(key, value) {
		return {'condition': {'key': key, 'value': value, 'condition': 'CONTAINS'}}
	},

	// Aggregation builders
	term: function(name, label, field, size) {
		var agg = {
			"name": name,
			"term": {"label": label, "field": field}
		}
		if (size) {
			if (typeof size != "number") {
				throw "expected size to be a number"
			}
			agg["term"]["size"] = size
		}
		return agg
	}
}

function percentile(name, label, field, percents) {
	if (!percents) {
		percents = [1, 5, 25, 50, 75, 95, 99]
	} else {
		percents = process(percents)
	}

  if (!percents.every(function(x){ return typeof x == "number" })) {
		throw "percents expected to be an array of numbers"
	}

	return {
		"name": name,
		"percentile": {
			"label": label, "field": field, "percents": percents
		}
	}
}

function histogram(name, label, field, interval) {
	if (interval) {
		if (typeof interval != "number") {
			throw "expected interval to be a number"
		}
	}
	return {
		"name": name,
		"histogram": {
			"label": label, "field": field, "interval": interval
		}
	}
}
