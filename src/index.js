import React from './React/React'
import ReactDOM from './ReactDOM/ReactDOM'
// import React from 'react'
// import ReactDOM from 'react-dom'

var flag = true

const Test = () => (
  <div>test</div>
)

class HelloWorld extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: 111
    }
  }

  componentWillMount() {
    this.setState({ text: 222 })
  }

  componentDidMount() {
    console.log('mount')
    setTimeout(() => {
      this.setState({text: 333})
    }, 1000)
  }

  render() {
    return (
      <div>
        <div>{this.state.text}</div>
        <div>{new Date().toLocaleTimeString()}</div>
        <Test/>
      </div>
    )
  }
}

ReactDOM.render(
  <HelloWorld />,
  document.getElementById('container')
)
