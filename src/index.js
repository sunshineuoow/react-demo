import React from './React/React'
import ReactDOM from './ReactDOM/ReactDOM'

var flag = true

class HelloWorld extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: 111
    }
  }
  render() {
    setTimeout(() => {
      if (flag) {
        this.setState({text: 222})
        flag = false        
      }
    }, 2000)
    return (
      <div>
        <div>{this.state.text}</div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    )
  }
}

ReactDOM.render(
 <HelloWorld />,
  document.getElementById('container')
)
