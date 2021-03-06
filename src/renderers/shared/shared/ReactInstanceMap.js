var ReactInstanceMap = {
  remove: function(key) {
    key._reactInternalInstance = undefined
  },

  get: function(key) {
    return key._reactInternalInstance
  },

  has: function(key) {
    return key._reactInternalInstance !== undefined
  },

  set: function(key, value) {
    return key._reactInternalInstance = value
  }
}

module.exports = ReactInstanceMap