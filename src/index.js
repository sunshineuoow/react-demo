import React from './React/React'
import ReactDOM from './renderers/ReactDOM/ReactDOM'
// import React from 'react'
// import ReactDOM from 'react-dom'

var flag = true

const Test = () => <div>test</div>

class ChildComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    console.log('mount Child')
  }

  render() {
    return <div>child</div>
  }
}

class HelloWorld extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: 111,
      value: ''
    }
  }

  componentWillMount() {
    this.setState({ text: 222 })
  }

  componentDidMount() {
    console.log('mount')
    console.log(this.refs.input)
    setTimeout(() => {
      this.setState({ text: 333 })
    }, 1000)
  }

  componentWillUpdate() {
    console.log('will update')
  }

  componentDidUpdate() {
    console.log('did update')
  }

  render() {
    return (
      <div id="test">
        <div
          onClick={() => {
            console.log('click')
            this.setState({ text: 444 })
          }}
        >
          {this.state.text}
        </div>
        <div>{new Date().toLocaleTimeString()}</div>
        <input type="text" ref="input" value={this.state.value} />
        <Test />
        <ChildComponent />
      </div>
    )
  }
}

ReactDOM.render(
  <HelloWorld />,
  document.getElementById('container')
)
