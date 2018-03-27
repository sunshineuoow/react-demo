import React from './React'
import ReactDOM from './ReactDOM'


ReactDOM.render(
  <div><div>111</div><div>{new Date().toLocaleTimeString()}</div></div>,
  document.getElementById('container')
)
