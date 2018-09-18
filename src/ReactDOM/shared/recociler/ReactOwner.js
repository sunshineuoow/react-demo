/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid owner.
 * @final
 */
function isValidOwner(object) {
  return !!(
    object &&
    typeof object.attachRef === 'function' &&
    typeof object.datechRef === 'function'
  )
}

/**
 * ReactOwners能够存储所拥有的组件的引用
 * 
 * 所有组件都能被所有者组件引用，但是只有ReactOwner组件可以引用所拥有的组件
 * 这个引用的名字被称为ref
 *
 * Refs在调度更新和挂载时可以获取
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs应当避免使用。当refs使用时，它们应当用来控制非React的数据流控制的数据
 *
 * @class ReactOwner
 */
var ReactOwner = {
  /**
   * 通过ref将一个组件添加到一个所有者组件上
   *
   * @param {ReactComponent} component 引用的组件.
   * @param {string} ref 组件的ref
   * @param {ReactOwner} owner 记录Ref的组件.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(
    component,
    ref,
    owner
  ) {
    owner.attachRef(ref, component)
  },

  /**
   * 从一个所有者组件中通过ref移除一个组件
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(
    component,
    ref,
    owner
  ) {
    var ownerPublicInstance = owner.getPublicInstance()
    // 检查组件的所有者是不是依然存在，并且组件是不是依然是当前ref
    // 因为我们不想注销这个ref如果另一个组件偷了他
    if (
      ownerPublicInstance &&
      ownerPublicInstance.refs[ref] === component.getPublicInstance()
    ) {
      owner.detachRef(ref)
    }
  }
}

module.exports = ReactOwner