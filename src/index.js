import React from './React/React'
import ReactDOM from './ReactDOM/ReactDOM'

class HelloWorld extends React.Component {
  render() {
    return (
      <div>
        <div>111</div>
        <div>{new Date().toLocaleTimeString()}</div>
        <p>234</p>
      </div>
    )
  }
}

ReactDOM.render(
 <HelloWorld />,
  document.getElementById('container')
)
