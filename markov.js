// var dictionary = require('fs').readFileSync('./dictionary_utf8.txt').toString().split('\n');
var corpus = require('fs').readFileSync('./corpus_utf8.txt').toString();

class Graph {
  constructor () {
    this.edges = new Map() // {Node: {edgeDestNode: edgeData, ...}, ...}()
    return this
  }

  setEdge (fromNode, toNode, edgeValue) {
    if (!this.edges.has(fromNode))
      this.edges.set(fromNode, new Map())

    this.edges.get(fromNode).set(toNode,
                             typeof edgeValue == 'function'
                             ? edgeValue.call(null,
                                         this.edges.get(fromNode).get(toNode))
                             : edgeValue)
  }

  getEdges (fromNode) {
    return fromNode ? this.edges.get(fromNode) : this.edges
  }
}

const myGraph = new Graph()

// DICTIONARY
const getTokens = text =>
    text
    .toLowerCase()
    .split(/\s/)
    .map(x => x.replace(/[\.,:;]$/g,''))
    .map(x => x.replace(/^\(/g,''))
    .map(x => x.replace(/\)$/g,''))

const words = getTokens(corpus);

// HYDRATE WITH ABSOLUTE VALUES (AMT OF OCCURENCES)
words.reduce((prevLetter,currLetter) =>
    (myGraph.setEdge(prevLetter, currLetter, (e) => ++e || 1), currLetter)
  , '^')

// TRANSFORM AMT OF OCCURENCES TO RELATIVE WEIGHTS
const edges = myGraph.getEdges()

edges.forEach((edgesData, fromNode) => {
  // Get sum of occurences for this node's edges
  let sum = 0;
  edgesData.forEach((edgeData, toNode) => {
    sum+=edgeData;
  })

  // Work out weight and set it
  edgesData.forEach((edgeData, toNode) => {
    myGraph.setEdge(fromNode, toNode, edgeData/sum)
  })
})

// GENERATE SIX-LETTER WORD
var getBelievableNextWord = letter => {
  var edges = myGraph.getEdges(letter);

  var possibleOutputs = [];
  edges.forEach((edgeData, toNode) => {
    possibleOutputs.push([toNode, edgeData]);
  })
  possibleOutputs.sort((a, b) => b[1] - a[1]);

  var possibleOutputsThresholds = [];
  var currentSum = 0;
  for (var i = 0; i<possibleOutputs.length; i++)
  {
    currentSum += possibleOutputs[i][1];
    possibleOutputsThresholds.push([possibleOutputs[i][0],currentSum])
  }
  possibleOutputsThresholds[possibleOutputsThresholds.length-1][1] = 1;

  var dice = Math.random();

  return possibleOutputsThresholds.reduce(
    (acc, tuple) => acc || (dice <= tuple[1] ? tuple[0] : false)
  , false);
}

var getBelievableCorpus = () => {
  var word = ['^'];
  for (var i = 0; i < 1500; i++)
    word.push(getBelievableNextWord(word[word.length-1]))
  word.shift();
  return word.join(' ');
}

console.log(getBelievableCorpus());
